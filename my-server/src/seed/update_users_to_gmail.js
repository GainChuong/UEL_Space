const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb+srv://gameyuno123_db_user:4ScSGOFQjScjIWOh@cluster0.jdglrux.mongodb.net/?retryWrites=true&w=majority';

const emailUpdates = [
  { old: 'admin@uel.edu.vn', new: 'admin.uelspace@gmail.com' },
  { old: 'admin@uelspace.vn', new: 'admin.uelspace@gmail.com', removeIfDup: true },
  { old: 'chittk@uel.edu.vn', new: 'chittk.uel@gmail.com' },
  { old: 'annv@uel.edu.vn', new: 'annv.uel@gmail.com' },
  { old: 'ngocttb21411@st.uel.edu.vn', new: 'ngocttb.uel@gmail.com' },
  { old: 'techpark.executive@uelspace.vn', new: 'techpark.executive@gmail.com' },
  { old: 'innovate.hub@uelspace.vn', new: 'innovate.hub@gmail.com' },
  { old: 'landmark.events@uelspace.vn', new: 'landmark.events@gmail.com' },
  { old: 'bql.csvc@uel.edu.vn', new: 'bql.csvc.uel@gmail.com' },
  { old: 'media.lab@uelspace.vn', new: 'media.lab.uel@gmail.com' },
  { old: 'contact@uelspace.vn', new: 'contact.uelspace@gmail.com' },
  { old: 'member@techflow.vn', new: 'member.techflow@gmail.com' },
  { old: 'anhnpk24411@st.uel.edu.vn', new: 'anhnp.uel@gmail.com' }
];

async function updateEmails() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db('uel_space');
    const usersCol = db.collection('users');

    for (const item of emailUpdates) {
      const existingNew = await usersCol.findOne({ email: item.new });
      if (existingNew) {
        if (item.removeIfDup) {
          await usersCol.deleteMany({ email: item.old });
          console.log(`Deleted duplicate old doc ${item.old} because ${item.new} exists`);
          continue;
        }
      }
      const res = await usersCol.updateMany(
        { email: item.old },
        { $set: { email: item.new } }
      );
      if (res.modifiedCount > 0) {
        console.log(`Updated ${item.old} -> ${item.new} (${res.modifiedCount} docs)`);
      }
    }

    const users = await usersCol.find({}, { projection: { email: 1, fullName: 1, role: 1 } }).toArray();
    console.log('--- ALL USERS IN MONGODB ATLAS ---');
    console.log(JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error updating emails:', err);
  } finally {
    await client.close();
  }
}

updateEmails();
