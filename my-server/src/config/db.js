const dns = require('dns');
const { MongoClient } = require('mongodb');
const { env } = require('./env');

let client;
let database;

async function connectToDb(uri = env.mongoUri, dbName = env.mongoDb) {
  if (database) return database;

  // Xử lý DNS SRV cho MongoDB Atlas trên môi trường mạng Windows
  if (uri && uri.startsWith('mongodb+srv://')) {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (dnsErr) {
      console.warn('DNS server override warning:', dnsErr.message);
    }
  }

  client = new MongoClient(uri, { 
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000
  });

  await client.connect();
  database = client.db(dbName);
  console.log(`[MongoDB] Kết nối thành công tới database: ${dbName}`);
  return database;
}

function getDb() {
  if (!database) throw new Error('Database chưa được kết nối! Vui lòng gọi connectToDb() trước.');
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
