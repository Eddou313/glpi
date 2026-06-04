import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const dbPath = path.join(dataDir, 'db.sqlite');
type Db = ReturnType<typeof Database>;
const db: Db = new Database(dbPath);

db.pragma('foreign_keys = ON');

export default db;