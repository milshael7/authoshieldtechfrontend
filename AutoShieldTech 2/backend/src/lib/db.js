const fs = require("fs");
const path = require("path");

const DB_PATH =
  (process.env.DB_PATH && String(process.env.DB_PATH).trim()) ||
  path.join(__dirname, "..", "data", "db.json");

function defaultDb() {
  return { users: [], companies: [], audit: [], notifications: [] };
}

function ensureDb() {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb(), null, 2), "utf8");
      console.log("Database initialized at:", DB_PATH);
      return;
    }

    const raw = fs.readFileSync(DB_PATH, "utf8");
    if (!raw || !raw.trim()) {
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb(), null, 2), "utf8");
      console.log("Database repaired (empty) at:", DB_PATH);
      return;
    }

    try {
      JSON.parse(raw);
    } catch (e) {
      const backup = `${DB_PATH}.corrupt.${Date.now()}.bak`;
      fs.writeFileSync(backup, raw, "utf8");
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb(), null, 2), "utf8");
      console.error("Database corrupted; backed up to:", backup, "and reset DB.");
    }
  } catch (error) {
    console.error("Error ensuring database:", error);
    throw error;
  }
}

function readDb() {
  try {
    ensureDb();
    const db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
    return { ...defaultDb(), ...(db || {}) };
  } catch (error) {
    console.error("Error reading database:", error);
    throw error;
  }
}

function writeDb(db) {
  try {
    ensureDb();
    const safe = { ...defaultDb(), ...(db || {}) };
    fs.writeFileSync(DB_PATH, JSON.stringify(safe, null, 2), "utf8");
    console.log("Database updated successfully.");
  } catch (error) {
    console.error("Error writing to database:", error);
    throw error;
  }
}

module.exports = { DB_PATH, ensureDb, readDb, writeDb };
