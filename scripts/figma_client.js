const https = require('https');
const { getValidAccessToken } = require('C:/Users/legal/.antigravity-figma-mcp/dist/auth.js');

const FILE_KEY = '9i3tFwMCkzk3umQTTzSM0j'; // UEL Space - Campus & Office Sharing Platform

async function callFigma(code, description) {
  const token = await getValidAccessToken();
  const payload = JSON.stringify({
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: 'use_figma',
      arguments: {
        fileKey: FILE_KEY,
        code,
        description
      }
    }
  });

  return new Promise((resolve, reject) => {
    const req = https.request('https://mcp.figma.com/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': 'Bearer ' + token
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let result = null;
        for (const line of data.split('\n')) {
          if (line.startsWith('data: ')) {
            try { result = JSON.parse(line.slice(6)); } catch {}
          }
        }
        if (!result) {
          try { result = JSON.parse(data); } catch {}
        }
        resolve(result);
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

module.exports = { callFigma, FILE_KEY };
