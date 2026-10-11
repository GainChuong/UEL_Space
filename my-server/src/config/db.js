const { MongoClient } = require('mongodb');
const { env } = require('./env');

let client;
let database;

async function connectToDb(uri = env.mongoUri, dbName = env.mongoDb) {
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  database = client.db(dbName);
  return database;
}

function getDb() {
  if (!database) throw new Error('Database has not connected yet');
  return database;
}

function getCollection(name) {
  return getDb().collection(name);
}

async function closeDb() {
  if (client) {
    await client.close();
    client = undefined;
    database = undefined;
  }
}

module.exports = { connectToDb, getDb, getCollection, closeDb };
