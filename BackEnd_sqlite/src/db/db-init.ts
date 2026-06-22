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
  INSERT INTO kanban_statuses(technical_name,default_name_fr,name_mg,bg_color) VALUES
  (1,'nouveau','vaovao','#2b993a'),
  (2,'en cours','efa manao','#837123'),
  (6,'terminer','vita','#bb8900');
`
);

db.exec(
`
  CREATE TABLE cost (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL, 
    cost REAL NOT NULL DEFAULT 0, 
    id_items INTEGER,
    category String,
    type_cout INTEGER NOT NULL,
    is_deleted BOOLEAN DEFAULT 0 ,
    "group" TEXT ,
    mode_ouverture INTEGER NULL,
    percentage REAL NOT NULL DEFAULT 0
  );
`
);
console.log("creation fait !");
process.exit(0);