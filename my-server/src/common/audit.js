const { getCollection } = require('../config/db');
const { newId, now } = require('./id');

async function writeAudit({ actorId = null, action, entityName, entityId = null, changes = null, level = 'INFO' }) {
  try {
    await getCollection('audit_logs').insertOne({
      _id: newId(),
      actorId,
      action,
      entityName,
      entityId,
      changes,
      level,
      createdAt: now()
    });
  } catch (error) {
    console.error('Failed to write audit log', error);
  }
}

module.exports = { writeAudit };
