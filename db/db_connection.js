const promise = require('bluebird');
const options = {
    promiseLib : promise
}

let ssl = null
if(process.env.DATABASE_URL) ssl = {rejectUnauthorized: false}

const pgp = require('pg-promise')( options);
const cString = process.env.DATABASE_URL || 'postgres://postgres:uspumpdatabase@localhost:5432/data_processing';
const config = {
    connectionString: cString,
    max:30,
    ssl: ssl
}
const db = pgp(config);
db.connect();

module.exports = db