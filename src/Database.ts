import fs from 'fs';
import { join } from 'path';
import sqlite3 from 'better-sqlite3';
import Debug from 'debug';
import { StatusCodes } from "http-status-codes";
import createError from "http-errors";

const debug = Debug('backend:database');

// Remove database
if (process.env.DEBUG) {
  if (!process.env.DB_PATH) throw new Error('No DB_PATH variable in .env found');
  // If memory then database sits in memory (RAM) and not on disk (file)
  if (process.env.DB_PATH !== ':memory:') {
    debug('Removing old database if it exists');
    fs.unlink(process.env.DB_PATH, () => {});
  }
}

const db = sqlite3(process.env.DB_PATH);

function loadSqlQueries(directory): {} {
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
    debug(`Added query '${queryName}': ${queries[queryName]}`);
  }

  return queries;
}

function loadAllSqlQueries(): {} {
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

const queries = loadAllSqlQueries();

function updateColumns(queryName: string, bindings: object, expectedNumberOfChanges: number) {
  if (!queries[queryName]) throw new Error('Unknown query');

  db.transaction(() => {
    const stmt = db.prepare(queries[queryName]);
    const info = stmt.run(bindings);
    if (info.changes === 0 && expectedNumberOfChanges !== 0) throw createError(StatusCodes.NOT_FOUND, 'No rows were updated');
    if (info.changes > expectedNumberOfChanges) throw createError(StatusCodes.CONFLICT, `Too many rows were updated. Expected ${expectedNumberOfChanges}, but updated ${info.changes}`);
    if (info.changes < expectedNumberOfChanges) throw createError(StatusCodes.CONFLICT, `Too few rows were updated. Expected ${expectedNumberOfChanges}, but updated ${info.changes}`);
  })();
}

process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));

export { queries, db, updateColumns };
