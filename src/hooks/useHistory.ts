import { useEffect, useState } from "react";
import Database from "@tauri-apps/plugin-sql";

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

let dbInstance: Database | null = null;

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initDb = async () => {
      try {
        dbInstance = await Database.load("sqlite:stockflow.db");

        const rows = await dbInstance.select(
          "SELECT * FROM processed_items ORDER BY processed_at DESC",
        );
        setItems(rows as HistoryItem[]);
      } catch (e) {
        console.error("Failed to initialize history:", e);
      } finally {
        setLoading(false);
      }
    };

    initDb();
  }, []);

  const saveItem = async (item: Omit<HistoryItem, "id" | "processed_at">) => {
    if (!dbInstance) return;

    try {
      await dbInstance.execute(
        `INSERT INTO processed_items (
          product, initial_stock, threshold, delivery_days,
          unit_cost, efficiency, avg_stock, actual_avg_stock
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          item.product,
          item.initial_stock,
          item.threshold,
          item.delivery_days,
          item.unit_cost,
          item.efficiency,
          item.avg_stock,
          item.actual_avg_stock,
        ],
      );

      const rows = await dbInstance.select(
        "SELECT * FROM processed_items ORDER BY processed_at DESC",
      );
      setItems(rows as HistoryItem[]);
    } catch (e) {
      console.error("Failed to save history item:", e);
    }
  };

  const getLastProcessed = (product: string): HistoryItem | undefined => {
    return items.find((item) => item.product === product);
  };

  return {
    items,
    loading,
    saveItem,
    getLastProcessed,
  };
}
