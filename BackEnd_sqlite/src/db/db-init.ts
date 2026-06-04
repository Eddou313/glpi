import db from './db.js';

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT
  );
`);

console.log('SQLite initialisé -> data/db.sqlite');
process.exit(0);