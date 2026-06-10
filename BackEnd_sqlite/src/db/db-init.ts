import db from './db.js';

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT
  );
`);

db.exec(
`
  CREATE TABLE kanban_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    technical_name INTEGER NOT NULL UNIQUE, 
    default_name_fr TEXT NOT NULL, 
    name_mg TEXT NOT NULL,       
    bg_color TEXT NOT NULL DEFAULT '#FFFFFF' 
);
`
);
console.log("creation fait !");
process.exit(0);