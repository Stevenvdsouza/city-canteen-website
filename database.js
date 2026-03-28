const sqlite3 = require('sqlite3').verbose();
const path    = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'restaurant.db'));

db.serialize(() => {
  //menu
  db.run(`CREATE TABLE IF NOT EXISTS menu (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    description TEXT,
    price       REAL    NOT NULL,
    category    TEXT    NOT NULL,
    image_url   TEXT,
    available   INTEGER NOT NULL DEFAULT 1
  )`);

  //orders
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    items_json      TEXT    NOT NULL,
    total           REAL    NOT NULL,
    status          TEXT    NOT NULL DEFAULT 'pending',
    customer_name   TEXT    DEFAULT '',
    customer_phone  TEXT    DEFAULT '',
    table_number    TEXT    DEFAULT '',
    call_staff      INTEGER NOT NULL DEFAULT 0,
    table_note      TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
  )`);

  //reser
  db.run(`CREATE TABLE IF NOT EXISTS reservations (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    contact    TEXT NOT NULL,
    date       TEXT NOT NULL,
    time       TEXT NOT NULL,
    guests     INTEGER NOT NULL,
    note       TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  )`);

  //staff
  db.run(`CREATE TABLE IF NOT EXISTS staff_codes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    code       TEXT NOT NULL UNIQUE,
    label      TEXT NOT NULL DEFAULT 'Staff',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  )`);

});

module.exports = db;
