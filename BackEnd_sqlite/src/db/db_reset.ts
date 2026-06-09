import db from './db.ts'
db.exec(`
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS kanban_statuses;
`);

process.exit(0);