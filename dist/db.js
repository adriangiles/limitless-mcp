"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// db.ts
// SQLite setup for caching lifelogs locally
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
// Open (or create) the database file in the project root
const db = new better_sqlite3_1.default('lifelogs.db');
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
exports.default = db;
