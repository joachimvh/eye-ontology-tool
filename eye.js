const fs = require('node:fs');
const path = require('node:path');
const querystring = require('node:querystring');

const SERVER_URL = 'https://eye.restdesc.org/';
const RULE_DIR = path.join(__dirname, 'rules');

// Parse all files in the rules dir
async function getRules() {
  const dir = await fs.promises.readdir(RULE_DIR);
  return Promise.all(dir.map(file => fs.promises.readFile(path.join(RULE_DIR, file), { encoding: 'utf8' })));
}

// Combine input data with fixed rules and send POST request to EYE server
async function handleRequest(query, data) {
  const body = querystring.stringify({ query, data });
  const response = await fetch(SERVER_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  return response.text();
}

// Read the file paths from CLI
const args = process.argv.slice(2);

// Read input files, combine them with stored rules, and send to server
Promise.all(args.map(file => fs.promises.readFile(file, { encoding: 'utf8' })))
  .then(async files => {
    const [query, ...documents] = files;
    const rules = await getRules();
    const result = await handleRequest(query, [ ...documents, ...rules ]);
    if (result.trim().length === 0) {
      console.error('No results');
    } else {
      console.log(result);
    }
  });
