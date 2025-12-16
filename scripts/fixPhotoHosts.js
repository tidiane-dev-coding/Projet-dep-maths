const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env from backend/.env if present
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dept-math';
const NEW_HOST = (process.env.BASE_URL || process.env.KEEP_ALIVE_URL || 'https://projet-dep-maths.onrender.com').replace(/\/+$/, '');

async function run() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB:', MONGO);

  const collName = 'committeemembers'; // default collection name from model
  const collection = mongoose.connection.collection(collName);

  const query = { photo: { $regex: 'localhost|127.0.0.1' } };
  const cursor = collection.find(query);

  let count = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const old = doc.photo || '';
    let updated = old;
    // replace common localhost patterns
    updated = updated.replace(/https?:\/\/localhost(:\d+)?/g, NEW_HOST);
    updated = updated.replace(/https?:\/\/127\.0\.0\.1(:\d+)?/g, NEW_HOST);

    if (updated !== old) {
      await collection.updateOne({ _id: doc._id }, { $set: { photo: updated } });
      console.log(`Updated ${doc._id}:`, old, '->', updated);
      count++;
    }
  }

  console.log('Done. Updated documents:', count);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
