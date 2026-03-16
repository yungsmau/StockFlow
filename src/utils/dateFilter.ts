import { invoke } from "@tauri-apps/api/core";
import type { UploadedFile } from "./fileParsers";

export interface DateRange {
  from: string;
  to: string;
}

export interface DateFilter {
  enabled: boolean;
  range: DateRange | null;
}

export interface DateRangeResponse {
  min: string;
  max: string;
}

export async function getDateRangeForProduct(
  files: UploadedFile[],
  productName: string,
): Promise<DateRangeResponse | null> {
  try {
    const result = await invoke<{ min: string | null; max: string | null }>(
      "get_date_range_for_product",
      { files, productName },
    );

    if (result.min && result.max) {
      return { min: result.min, max: result.max };
    }
    return null;
  } catch (error) {
    console.error("Failed to get date range from Rust:", error);
    return null;
  }
}

export function parseDateSafe(dateStr: string): Date | null {
  try {
    if (!dateStr || typeof dateStr !== "string") return null;

    let normalized = dateStr.trim();

    if (/^\d{2}\.\d{2}\.\d{4}$/.test(normalized)) {
      const [day, month, year] = normalized.split(".");
      normalized = `${year}-${month}-${day}`;
    }

    if (normalized.includes(" ") && !normalized.includes("T")) {
      normalized = normalized.replace(" ", "T");
    }

    const d = new Date(normalized);
    if (isNaN(d.getTime())) return null;

    d.setHours(0, 0, 0, 0);

    return d;
  } catch {
    return null;
  }
}

export function filterDataByDate(
  files: UploadedFile[],
  from: string,
  to: string,
): UploadedFile[] {
  const fromDate = new Date(from);
  fromDate.setHours(0, 0, 0, 0);

  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  return files
    .map((file) => ({
      ...file,
      data: file.data.filter((row) => {
        const rowDate = parseDateSafe(row.date);
        if (!rowDate) return false;
        return rowDate >= fromDate && rowDate <= toDate;
      }),
    }))
    .filter((file) => file.data.length > 0);
}
