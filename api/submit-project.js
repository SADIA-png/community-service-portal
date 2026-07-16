const { MongoClient } = require('mongodb');

let cachedClient = null;

async function connectToDatabase() {
    if (cachedClient) return cachedClient;
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    cachedClient = client;
    return client;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { 
            userType, 
            fullName, 
            email, 
            affiliation, 
            title, 
            themes, 
            coreProblem, 
            fieldComponent, 
            location, 
            withinRadius, 
            collaborator 
        } = req.body;

        // Structured boundary validation
        if (!userType || !fullName || !email || !affiliation || !title || !coreProblem || !fieldComponent || !location) {
            return res.status(400).json({ message: 'Missing mandatory operational field metadata.' });
        }

        const client = await connectToDatabase();
        const db = client.db('community_service');
        const projectsCollection = db.collection('projects');

        // Generate systematic internal routing number (CORE-XXXX)
        const projectId = 'CORE-' + Math.floor(1000 + Math.random() * 9000);

        const newProjectProposal = {
            _id: projectId,
            course_code: "XXC-399",
            senate_compliance: "Item 105.9",
            submitter: {
                type: userType, // Faculty / NGO / SHG
                name: fullName,
                email: email,
                affiliation: affiliation // Dept or Org Name
            },
            details: {
                title: title,
                thematic_areas: themes,
                societal_problem: coreProblem,
                field_execution: fieldComponent
            },
            logistics: {
                target_location: location,
                compliant_radius: withinRadius, // true/false evaluation
                external_collaborator: collaborator
            },
            assignment_status: "open", 
            registered_teams: [],
            created_at: new Date()
        };

        await projectsCollection.insertOne(newProjectProposal);

        return res.status(200).json({ 
            message: 'CORE Course Proposal successfully archived.', 
            projectId: projectId 
        });

    } catch (error) {
        console.error("Database Transaction Error:", error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}