CREATE TABLE IF NOT EXISTS processed_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product TEXT NOT NULL UNIQUE,
    initial_stock INTEGER NOT NULL,
    threshold INTEGER NOT NULL,
    delivery_days INTEGER NOT NULL,
    unit_cost REAL NOT NULL,
    efficiency REAL NOT NULL,
    avg_stock REAL NOT NULL,
    actual_avg_stock REAL NOT NULL,
    processed_at TEXT DEFAULT CURRENT_TIMESTAMP
);