// db.ts
// SQLite setup for caching lifelogs locally
import Database from 'better-sqlite3';

// Open (or create) the database file in the project root
const db = new Database('lifelogs.db');

// Create the lifelogs table if it doesn't exist
// Fields: id (primary key), title, markdown, startTime, endTime, updatedAt
const createTable = `
CREATE TABLE IF NOT EXISTS lifelogs (
  id TEXT PRIMARY KEY,
  title TEXT,
  markdown TEXT,
  startTime TEXT,
  endTime TEXT,
  updatedAt TEXT
);
`;
db.exec(createTable);

export default db;
