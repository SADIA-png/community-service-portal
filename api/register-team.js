const { MongoClient } = require('mongodb');

// Store the connection globally in serverless environments to reuse it
let cachedClient = null;

async function connectToDatabase() {
    if (cachedClient) return cachedClient;
    
    // Connects using the secure environment variable you set in Vercel
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    cachedClient = client;
    return client;
}

export default async function handler(req, res) {
    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { program, members, preferences } = req.body;

        // Basic validation
        if (!members || members.length < 4) {
            return res.status(400).json({ message: 'A team must have at least 4 members.' });
        }

        const client = await connectToDatabase();
        const db = client.db('community_service');
        
        // Connect to the specific collections
        const usersCollection = db.collection('users');
        const teamsCollection = db.collection('teams');

        // 1. Verify all students exist in the roster
        const foundUsers = await usersCollection.find({ _id: { $in: members } }).toArray();
        if (foundUsers.length !== members.length) {
            return res.status(400).json({ message: 'One or more Roll Numbers do not exist in the official roster.' });
        }

        // 2. Check if any member is already on a team
        const alreadyAssigned = foundUsers.filter(user => user.team_id !== null && user.team_id !== undefined && user.team_id !== "");
        if (alreadyAssigned.length > 0) {
            const assignedIds = alreadyAssigned.map(u => u._id).join(', ');
            return res.status(400).json({ message: `These students are already on a team: ${assignedIds}` });
        }

        // 3. Generate a unique Team ID
        const teamId = 'TEAM-' + Math.floor(1000 + Math.random() * 9000);

        // 4. Create the new team document
        const newTeam = {
            _id: teamId,
            program: program,
            members: members,
            preferences: preferences,
            assigned_project_id: null,
            created_at: new Date()
        };

        await teamsCollection.insertOne(newTeam);

        // 5. Update the users in the database with their new Team ID
        await usersCollection.updateMany(
            { _id: { $in: members } },
            { $set: { team_id: teamId } }
        );

        // Return a success response to the frontend
        return res.status(200).json({ message: 'Team successfully registered!', teamId: teamId });

    } catch (error) {
        console.error("Database Error:", error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}