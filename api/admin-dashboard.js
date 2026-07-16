const { MongoClient } = require('mongodb');

let cachedDbClient = null;

async function connectToDatabase() {
    if (cachedDbClient) return cachedDbClient;
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    cachedDbClient = client;
    return client;
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const client = await connectToDatabase();
        const db = client.db('community_service');

        // Fetch all projects and teams, sorting by newest first
        const projects = await db.collection('projects').find({}).sort({ created_at: -1 }).toArray();
        const teams = await db.collection('teams').find({}).sort({ created_at: -1 }).toArray();

        return res.status(200).json({ projects, teams });
    } catch (error) {
        console.error("Dashboard Error:", error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}