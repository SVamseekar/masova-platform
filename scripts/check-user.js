const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'masova_db';

async function checkUser() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const usersCollection = db.collection('users');

        const user = await usersCollection.findOne({ email: 'suresh.manager@masova.com' });

        if (!user) {
            console.log('❌ User not found!');
            return;
        }

        console.log('✅ User found in database:');
        console.log('ID:', user._id);
        console.log('Email:', user.email);
        console.log('Type:', user.type);
        console.log('Status:', user.status);
        console.log('Password Hash (first 20 chars):', user.password?.substring(0, 20) + '...');
        console.log('Has Password:', !!user.password);
        console.log('Password Length:', user.password?.length);
        console.log('\nFull User Object:');
        console.log(JSON.stringify(user, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

checkUser();
