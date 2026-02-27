const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'masova_db';

async function checkUsers() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const usersCollection = db.collection('users');

        // Check by nested personalInfo.email
        const user = await usersCollection.findOne({ 'personalInfo.email': 'suresh.manager@masova.com' });

        if (!user) {
            console.log('❌ User not found with nested email search!');

            // Try finding by name
            const userByName = await usersCollection.findOne({ 'personalInfo.name': /suresh/i });

            if (userByName) {
                console.log('✅ Found user by name:');
                console.log(JSON.stringify(userByName, null, 2));
            } else {
                console.log('❌ No user found with name containing "suresh"');

                // Show all users
                const allUsers = await usersCollection.find({}).toArray();
                console.log('\nAll users in database:');
                allUsers.forEach(u => {
                    console.log('- ID:', u._id, '| Name:', u.personalInfo?.name || u.name, '| Email:', u.personalInfo?.email || u.email, '| Type:', u.type);
                });
            }
            return;
        }

        console.log('✅ User found in database:');
        console.log(JSON.stringify(user, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

checkUsers();
