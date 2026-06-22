import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const dbPath = path.join(dataDir, 'glpi_parameter.sqlite');
type Db = ReturnType<typeof Database>;
const db: Db = new Database(dbPath);

db.pragma('foreign_keys = ON');

const costColumns = db.prepare(`PRAGMA table_info(cost)`).all() as Array<{ name: string }>;
const hasCostColumn = (name: string) => costColumns.some((column) => column.name === name);

if (costColumns.length > 0 && !hasCostColumn('mode_ouverture')) {
  db.prepare(`ALTER TABLE cost ADD COLUMN mode_ouverture INTEGER NULL`).run();
}

if (costColumns.length > 0 && !hasCostColumn('percentage')) {
  db.prepare(`ALTER TABLE cost ADD COLUMN percentage REAL NOT NULL DEFAULT 0`).run();
}

db.exec(`
  CREATE TABLE IF NOT EXISTS fond (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pourcentageFond REAL NOT NULL DEFAULT 30
  );

  INSERT INTO fond (id, pourcentageFond)
  VALUES (1, 30)
  ON CONFLICT(id) DO NOTHING;
`);

export default db;
