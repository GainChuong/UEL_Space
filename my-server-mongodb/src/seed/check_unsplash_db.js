const { connectToDb, getCollection, closeDb } = require('../config/db');

async function check() {
  await connectToDb();
  const spaces = getCollection('spaces');
  const count = await spaces.countDocuments();
  console.log('Total spaces in DB:', count);

  const unsplashSpaces = await spaces.find({
    $or: [
      { image: { $regex: 'unsplash', $options: 'i' } },
      { 'seller.avatar': { $regex: 'unsplash', $options: 'i' } },
      { images: { $elemMatch: { $regex: 'unsplash', $options: 'i' } } }
    ]
  }).toArray();
  console.log('Spaces with unsplash in DB:', unsplashSpaces.length);

  const sellers = getCollection('sellers');
  if (sellers) {
    const unsplashSellers = await sellers.find({
      $or: [
        { avatar: { $regex: 'unsplash', $options: 'i' } },
        { coverImage: { $regex: 'unsplash', $options: 'i' } }
      ]
    }).toArray();
    console.log('Sellers with unsplash in DB:', unsplashSellers.length);
  }
  await closeDb();
}

check().catch(console.error);

