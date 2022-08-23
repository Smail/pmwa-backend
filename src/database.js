const fs = require('fs');
const { join } = require('path');
const sqlite3 = require('better-sqlite3');
const debug = require('debug')('backend:database');

// Load config
require('dotenv').config();

const db = sqlite3(process.env.DB_PATH);

function loadSqlQueries(directory) {
  const queries = {};
  const filePath = join(process.cwd(), "src", "queries", directory);
  const files = fs.readdirSync(filePath);
  const sqlFiles = files.filter(file => file.endsWith('.sql'));

  debug(`Number of SQL files in directory '${directory}': ${sqlFiles.length}`);
  debug(`SQL files in directory '${directory}'`);

  for (const sqlFile of sqlFiles) {
    const sql = fs.readFileSync(join(filePath, sqlFile), { encoding: 'utf8', flag: 'r' });
    const queryName = sqlFile.replace('.sql', '');

    queries[queryName] = sql;
    debug(`Added query '${queryName}': ${queries[queryName] }`);
  }

  return queries;
}

function loadAllSqlQueries() {
  let queries = {};
  const filePath = join(process.cwd(), "src", "queries");
  const files = fs.readdirSync(filePath);
  const queryDirectories = files.filter(file => fs.statSync(join(filePath, file)).isDirectory());

  debug(`Number of SQL query directories: ${queryDirectories.length}`);
  debug(`SQL query directories: ${queryDirectories}`);

  for (const dir of queryDirectories) {
    queries = { ...queries, ...loadSqlQueries(dir) };
  }

  return queries;
}

process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));

module.exports = {
  queries: loadAllSqlQueries(),
  db: db,
};
