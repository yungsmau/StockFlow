import ExcelJS from "exceljs";
import { validateHeaders } from "./fileValidation";

export type RowData = {
  nomenclature: string;
  date: string;
  income: number;
  expense: number;
  stock: number;
};

function toStringSafe(value: any): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().split("T")[0];
  return String(value).trim();
}

function toNumberSafe(value: any): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(String(value).replace(",", "."));
  return isNaN(n) ? 0 : n;
}

export async function parseExcel(file: File): Promise<RowData[]> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("Файл не содержит листов");

  const rows: RowData[] = [];
  const headerRow = worksheet.getRow(1);
  const headers = Array.isArray(headerRow.values)
    ? headerRow.values.slice(1).map(String)
    : [];

  const validation = validateHeaders(headers);
  if (!validation.valid) throw new Error(validation.error);

  // Получаем маппинг заголовков
  const headerMap = validation.headerMap!;
  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());

  // Находим индексы по маппингу
  const nomenclatureIdx = normalizedHeaders.findIndex(
    (h) => headerMap[h] === "nomenclature",
  );
  const dateIdx = normalizedHeaders.findIndex((h) => headerMap[h] === "date");
  const incomeIdx = normalizedHeaders.findIndex(
    (h) => headerMap[h] === "income",
  );
  const expenseIdx = normalizedHeaders.findIndex(
    (h) => headerMap[h] === "expense",
  );
  const stockIdx = normalizedHeaders.findIndex((h) => headerMap[h] === "stock");

  worksheet.eachRow((row, idx) => {
    if (idx === 1) return;

    const valuesArray = Array.isArray(row.values) ? row.values.slice(1) : [];

    rows.push({
      nomenclature: toStringSafe(valuesArray[nomenclatureIdx]),
      date: toStringSafe(valuesArray[dateIdx]),
      income: toNumberSafe(valuesArray[incomeIdx]),
      expense: toNumberSafe(valuesArray[expenseIdx]),
      stock: toNumberSafe(valuesArray[stockIdx]),
    });
  });

  if (rows.length === 0) {
    throw new Error("Файл не содержит данных");
  }

  return rows;
}

export async function parseCSV(file: File): Promise<RowData[]> {
  const text = await file.text();
  const lines = text.split("\n").filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    throw new Error(
      "Файл слишком короткий. Нужны заголовки и хотя бы одна строка данных.",
    );
  }

  const headers = lines[0].split(",").map((h) => h.trim());
  const validation = validateHeaders(headers);
  if (!validation.valid) throw new Error(validation.error);

  const headerMap = validation.headerMap!;
  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());

  const nomenclatureIdx = normalizedHeaders.findIndex(
    (h) => headerMap[h] === "nomenclature",
  );
  const dateIdx = normalizedHeaders.findIndex((h) => headerMap[h] === "date");
  const incomeIdx = normalizedHeaders.findIndex(
    (h) => headerMap[h] === "income",
  );
  const expenseIdx = normalizedHeaders.findIndex(
    (h) => headerMap[h] === "expense",
  );
  const stockIdx = normalizedHeaders.findIndex((h) => headerMap[h] === "stock");

  const data = lines.slice(1).map((line) => {
    const cols = line.split(",").map((col) => col.trim());
    return {
      nomenclature: toStringSafe(cols[nomenclatureIdx]),
      date: toStringSafe(cols[dateIdx]),
      income: toNumberSafe(cols[incomeIdx]),
      expense: toNumberSafe(cols[expenseIdx]),
      stock: toNumberSafe(cols[stockIdx]),
    };
  });

  return data;
}
