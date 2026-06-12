import db from "./db.ts";

db.exec(
`
  CREATE TABLE cost (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL UNIQUE, 
    cost NUMBER(10,2) NOT NULL DEFAULT 0, 
    nbr_elements INTEGER NOT NULL DEFAULT 1,       
  );
`
);
console.log("creation fait !");
process.exit(0);
