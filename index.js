const fs = require('node:fs');
const path = require('node:path');
const querystring = require('node:querystring');

const SERVER_URL = 'https://eye.restdesc.org/'
const RULE_DIR = path.join(__dirname, 'rules');
const query = `
@prefix ex: <http://example.com/>.
@prefix foaf: <http://xmlns.com/foaf/0.1/>.
{
  ?picture a foaf:Image;
    foaf:depicts ?person.
  ?person a foaf:Person;
      foaf:name ?name.
} => {
  (?picture ?name) a ex:Result.
}.`;

// Parse all files in the rules dir
async function getRules() {
  const dir = await fs.promises.readdir(RULE_DIR);
  return Promise.all(dir.map(file => fs.promises.readFile(path.join(RULE_DIR, file), { encoding: 'utf8' })));
}

// TODO: pass-only-new?

// Combine input data with fixed rules and send POST request to EYE server
async function handleRequest(data, rules) {
  const body = querystring.stringify({
    data: [ ...data, ...rules ],
    query
  });
  const response = await fetch(SERVER_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  })
  return response.text();
}

// Read the file paths from CLI
const args = process.argv.slice(2);

// Read input files, combine them with stored rules, and send to server
Promise.all(args.map(file => fs.promises.readFile(file, { encoding: 'utf8' })))
  .then(async data => {
    const rules = await getRules();
    const result = await handleRequest(data, rules);
    if (result.trim().length === 0) {
      console.log('No results');
    } else {
      console.log(result);
    }
  });
