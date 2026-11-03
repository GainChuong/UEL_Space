const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Generate 60 days of dates starting from 2026-11-01
function generateDateRange(startDateStr, daysCount = 60) {
  const dates = [];
  const start = new Date(startDateStr);
  for (let i = 0; i < daysCount; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dates.push({
      dateStr: `${yyyy}-${mm}-${dd}`,
      dayOfWeek: d.getDay() // 0 = Sun, 1 = Mon, ..., 6 = Sat
    });
  }
  return dates;
}

// Deterministic hash for consistent realistic schedule
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getAvailableDatesForSpace(spaceId, spaceType, allDates) {
  const hash = hashString(spaceId || 'space');
  const typeLower = (spaceType || '').toLowerCase();

  // 20% spaces: Weekday only (Office / Official Meeting Rooms)
  const isWeekdayOnly = typeLower.includes('office') || typeLower.includes('văn phòng') || (hash % 5 === 0);

  // Maintenance day candidates (1-2 days blocked)
  const maintenanceDay1 = (hash % 25) + 2; // e.g., day 2 to 27
  const maintenanceDay2 = (hash % 15) + 30; // e.g., day 30 to 45

  const available = [];
  for (let idx = 0; idx < allDates.length; idx++) {
    const item = allDates[idx];
    const isWeekend = item.dayOfWeek === 0 || item.dayOfWeek === 6;

    if (isWeekdayOnly && isWeekend) {
      continue; // closed on weekends
    }

    if (idx === maintenanceDay1 || idx === maintenanceDay2) {
      continue; // blocked for maintenance / private event
    }

    available.push(item.dateStr);
  }

  return available;
}

async function run() {
  const allDates = generateDateRange('2026-11-01', 60);
  console.log(`Generated ${allDates.length} days from ${allDates[0].dateStr} to ${allDates[allDates.length - 1].dateStr}`);

  // 1. Update MongoDB Atlas
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('No MONGODB_URI found in .env');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('uel_space');
  const spacesCol = db.collection('spaces');
  const mongoSpaces = await spacesCol.find({ deletedAt: null }).toArray();
  console.log(`Found ${mongoSpaces.length} spaces in MongoDB collection 'spaces'. Updating availableDates...`);

  let updatedMongoCount = 0;
  for (const s of mongoSpaces) {
    const availableDates = getAvailableDatesForSpace(s._id || s.code, s.spaceType || s.categoryName, allDates);
    await spacesCol.updateOne(
      { _id: s._id },
      { $set: { availableDates, updatedAt: new Date() } }
    );
    updatedMongoCount++;
  }
  console.log(`Successfully updated ${updatedMongoCount} spaces in MongoDB Atlas.`);

  // 2. Update Backend spaces_100_dataset.json
  const backendDatasetPath = path.resolve(__dirname, 'spaces_100_dataset.json');
  if (fs.existsSync(backendDatasetPath)) {
    const backendData = JSON.parse(fs.readFileSync(backendDatasetPath, 'utf8'));
    for (const s of backendData) {
      s.availableDates = getAvailableDatesForSpace(s._id || s.code, s.spaceType || s.categoryName, allDates);
    }
    fs.writeFileSync(backendDatasetPath, JSON.stringify(backendData, null, 2), 'utf8');
    console.log(`Updated backend dataset: ${backendDatasetPath} (${backendData.length} spaces)`);
  }

  // 3. Update Frontend spaces_100_dataset.json
  const frontendDatasetPath = path.resolve(__dirname, '../../../frontend/src/app/services/spaces_100_dataset.json');
  if (fs.existsSync(frontendDatasetPath)) {
    const frontendData = JSON.parse(fs.readFileSync(frontendDatasetPath, 'utf8'));
    for (const s of frontendData) {
      s.availableDates = getAvailableDatesForSpace(s._id || s.code, s.spaceType || s.categoryName, allDates);
    }
    fs.writeFileSync(frontendDatasetPath, JSON.stringify(frontendData, null, 2), 'utf8');
    console.log(`Updated frontend dataset: ${frontendDatasetPath} (${frontendData.length} spaces)`);
  }

  // 4. Update Frontend spaces_100_data.ts
  const frontendDataTsPath = path.resolve(__dirname, '../../../frontend/src/app/services/spaces_100_data.ts');
  if (fs.existsSync(frontendDataTsPath)) {
    const frontendData = JSON.parse(fs.readFileSync(frontendDatasetPath, 'utf8'));
    const tsContent = `// Auto-generated 100 spaces dataset with availableDates\nexport const SPACES_100_DATA: any[] = ${JSON.stringify(frontendData, null, 2)};\n`;
    fs.writeFileSync(frontendDataTsPath, tsContent, 'utf8');
    console.log(`Updated frontend spaces_100_data.ts (${frontendData.length} spaces)`);
  }

  await client.close();
  console.log('Migration complete!');
}

run().catch(console.error);
