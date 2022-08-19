const fs = require('fs');
const fsp = fs.promises;
const { join } = require('path');
// const sqlite3 = require('better-sqlite3');
// const db = new sqlite3.Database(':memory:');
const db = require('better-sqlite3')(':memory:');
const debug = require('debug')('backend:database');

// Load config
require('dotenv').config();

async function loadSqlQueries(directory) {
  const queries = {};
  const filePath = join(process.cwd(), "src", "queries", directory);
  const files = await fsp.readdir(filePath);
  const sqlFiles = files.filter(file => file.endsWith('.sql'));

  debug(`Number of SQL files in directory '${directory}': ${sqlFiles.length}`);
  debug(`SQL files in directory '${directory}': ${sqlFiles}`);

  for (const sqlFile of sqlFiles) {
    const sql = await fsp.readFile(join(filePath, sqlFile), { encoding: 'utf8', flag: 'r' });
    const queryName = sqlFile.replace('.sql', '');

    queries[queryName] = sql;
    debug(`Added query '${queryName}'`);
  }

  return queries;
}

async function loadAllSqlQueries() {
  let queries = {};
  const filePath = join(process.cwd(), "src", "queries");
  const files = await fsp.readdir(filePath);
  const queryDirectories = files.filter(file => fs.statSync(join(filePath, file)).isDirectory());

  debug(`Number of SQL query directories: ${queryDirectories.length}`);
  debug(`SQL query directories: ${queryDirectories}`);

  for (const dir of queryDirectories) {
    queries = { ...loadSqlQueries(dir) };
  }

  return queries;
}

module.exports = {
  queries: loadAllSqlQueries(),
  db: db,
};
