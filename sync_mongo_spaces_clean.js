const path = require('path');
const { MongoClient } = require(path.resolve('my-server-mongodb/node_modules/mongodb'));
require(path.resolve('my-server-mongodb/node_modules/dotenv')).config({ path: 'my-server-mongodb/.env' });
const fs = require('fs');

(async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('uel_space');
  const spacesCol = db.collection('spaces');

  const dataset = JSON.parse(fs.readFileSync('frontend/src/app/services/spaces_100_dataset.json', 'utf8'));

  for (const s of dataset) {
    const filter = { $or: [{ _id: s._id }, { code: s.code }] };
    await spacesCol.updateOne(filter, {
      $set: {
        name: s.name,
        spaceType: s.spaceType,
        categoryName: s.categoryName,
        description: s.description,
        updatedAt: new Date()
      }
    });
  }

  // Also clean old legacy spaces in MongoDB if any
  await spacesCol.updateMany(
    { spaceType: 'Giảng đường đa năng' },
    { $set: { spaceType: 'Trung tâm Hội thảo & Đào tạo', categoryName: 'Trung tâm Hội thảo & Đào tạo' } }
  );
  await spacesCol.updateMany(
    { spaceType: 'Thư viện & Co-study' },
    { $set: { spaceType: 'Không gian Làm việc & Nghiên cứu', categoryName: 'Không gian Làm việc & Nghiên cứu' } }
  );

  console.log('Successfully synced and cleaned MongoDB spaces collection!');
  await client.close();
})();
