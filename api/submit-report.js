const { MongoClient } = require('mongodb');
const { createClient } = require('@supabase/supabase-js');

// Initialize Database Connections
let cachedDbClient = null;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function connectToDatabase() {
    if (cachedDbClient) return cachedDbClient;
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    cachedDbClient = client;
    return client;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    try {
        const { teamId, fileName, contentType, fileData } = req.body;

        if (!teamId || !fileData) {
            return res.status(400).json({ message: 'Missing file data or Team ID.' });
        }

        // 1. Decode Base64 string back into a binary buffer
        const base64String = fileData.split(',')[1];
        const buffer = Buffer.from(base64String, 'base64');

        // 2. Upload to Supabase Storage
        const uniqueFilePath = `${teamId}/${Date.now()}-${fileName}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('reports')
            .upload(uniqueFilePath, buffer, {
                contentType: contentType,
                upsert: true
            });

        if (uploadError) throw new Error(`Supabase Upload Failed: ${uploadError.message}`);

        // 3. Retrieve the Public URL
        const { data: urlData } = supabase.storage
            .from('reports')
            .getPublicUrl(uniqueFilePath);

        // 4. Update the Team document in MongoDB
        const dbClient = await connectToDatabase();
        const db = dbClient.db('community_service');
        const result = await db.collection('teams').updateOne(
            { _id: teamId },
            { $set: { 
                report_url: urlData.publicUrl,
                status: "Report Submitted",
                updated_at: new Date()
            }}
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Team ID not found in database.' });
        }

        return res.status(200).json({ message: 'Success', url: urlData.publicUrl });

    } catch (error) {
        console.error("Storage Error:", error);
        return res.status(500).json({ message: 'Internal Server Error', details: error.message });
    }
}