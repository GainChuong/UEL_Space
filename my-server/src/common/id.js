const crypto = require('crypto');

function newId() {
  return crypto.randomUUID();
}

function now() {
  return new Date();
}

module.exports = { newId, now };
