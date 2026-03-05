import Database from "@tauri-apps/plugin-sql";

// SQL для создания таблицы (идемпотентный запрос)
const CREATE_TABLE_SQL = `
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
  )
`;

// Интерфейс для данных истории (snake_case - как в БД)
export interface HistoryItem {
  id: number;
  product: string;
  initial_stock: number;
  threshold: number;
  delivery_days: number;
  unit_cost: number;
  efficiency: number;
  avg_stock: number;
  actual_avg_stock: number;
  processed_at: string;
}

// Интерфейс для экспорта (camelCase)
export interface ExportHistoryItem {
  id: number;
  product: string;
  initialStock: number;
  threshold: number;
  deliveryDays: number;
  unitCost: number;
  efficiency: number;
  avgStock: number;
  actualAvgStock: number;
  processedAt: string;
}

// Преобразование из snake_case в camelCase
export const dbToHistoryItem = (dbItem: HistoryItem): ExportHistoryItem => ({
  id: dbItem.id,
  product: dbItem.product,
  initialStock: dbItem.initial_stock,
  threshold: dbItem.threshold,
  deliveryDays: dbItem.delivery_days,
  unitCost: dbItem.unit_cost,
  efficiency: dbItem.efficiency,
  avgStock: dbItem.avg_stock,
  actualAvgStock: dbItem.actual_avg_stock,
  processedAt: dbItem.processed_at,
});

// Получение экземпляра БД
const getDatabase = async (): Promise<Database> => {
  const db = await Database.load("sqlite:stockflow.db");
  await db.execute(CREATE_TABLE_SQL);
  return db;
};

// Сохранение/обновление записи
export const saveHistoryItem = async (
  product: string,
  initialStock: number,
  threshold: number,
  deliveryDays: number,
  unitCost: number,
  efficiency: number,
  avgStock: number,
  actualAvgStock: number,
): Promise<void> => {
  const db = await getDatabase();

  await db.execute(
    `INSERT INTO processed_items (
      product, initial_stock, threshold, delivery_days,
      unit_cost, efficiency, avg_stock, actual_avg_stock
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT(product) DO UPDATE SET
      initial_stock = excluded.initial_stock,
      threshold = excluded.threshold,
      delivery_days = excluded.delivery_days,
      unit_cost = excluded.unit_cost,
      efficiency = excluded.efficiency,
      avg_stock = excluded.avg_stock,
      actual_avg_stock = excluded.actual_avg_stock,
      processed_at = CURRENT_TIMESTAMP`,
    [
      product,
      initialStock,
      threshold,
      deliveryDays,
      unitCost,
      efficiency,
      avgStock,
      actualAvgStock,
    ],
  );
};

// Загрузка всех записей
export const loadHistoryItems = async (): Promise<ExportHistoryItem[]> => {
  const db = await getDatabase();

  // Явное приведение типа
  const rows = (await db.select(
    "SELECT * FROM processed_items ORDER BY processed_at DESC",
  )) as HistoryItem[];

  return rows.map(dbToHistoryItem);
};

// Очистка всей истории
export const clearHistory = async (): Promise<void> => {
  const db = await getDatabase();
  await db.execute("DELETE FROM processed_items");
};

// Получение последней обработки по номенклатуре
export const getLastProcessed = async (
  product: string,
): Promise<ExportHistoryItem | null> => {
  const db = await getDatabase();

  // Явное приведение типа
  const rows = (await db.select(
    "SELECT * FROM processed_items WHERE product = $1 ORDER BY processed_at DESC LIMIT 1",
    [product],
  )) as HistoryItem[];

  if (rows.length === 0) return null;
  return dbToHistoryItem(rows[0]);
};

// Удаление записи по номенклатуре
export const deleteHistoryItem = async (product: string): Promise<void> => {
  const db = await getDatabase();
  await db.execute("DELETE FROM processed_items WHERE product = $1", [product]);
};
