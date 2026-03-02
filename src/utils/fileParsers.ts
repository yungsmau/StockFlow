import ExcelJS from "exceljs";
import Papa from "papaparse";
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

  const headerMap = validation.headerMap!;
  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());

  const nomenclatureKey = Object.keys(headerMap).find(
    (k) => headerMap[k] === "nomenclature",
  );
  const dateKey = Object.keys(headerMap).find((k) => headerMap[k] === "date");
  const incomeKey = Object.keys(headerMap).find(
    (k) => headerMap[k] === "income",
  );
  const expenseKey = Object.keys(headerMap).find(
    (k) => headerMap[k] === "expense",
  );
  const stockKey = Object.keys(headerMap).find((k) => headerMap[k] === "stock");

  if (!nomenclatureKey || !dateKey || !incomeKey || !expenseKey || !stockKey) {
    throw new Error("Не удалось сопоставить все обязательные колонки");
  }

  const nomenclatureIdx = normalizedHeaders.indexOf(
    nomenclatureKey.toLowerCase(),
  );
  const dateIdx = normalizedHeaders.indexOf(dateKey.toLowerCase());
  const incomeIdx = normalizedHeaders.indexOf(incomeKey.toLowerCase());
  const expenseIdx = normalizedHeaders.indexOf(expenseKey.toLowerCase());
  const stockIdx = normalizedHeaders.indexOf(stockKey.toLowerCase());

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
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
      dynamicTyping: false,
      complete: (results) => {
        if (results.errors.length > 0) {
          const criticalErrors = results.errors.filter(
            (e) => e.type !== "FieldMismatch",
          );
          if (criticalErrors.length > 0) {
            reject(
              new Error(`Ошибка парсинга CSV: ${criticalErrors[0].message}`),
            );
            return;
          }
        }

        const headers = results.meta.fields || [];
        if (headers.length === 0) {
          reject(new Error("Файл CSV не содержит заголовков"));
          return;
        }

        const validation = validateHeaders(headers);
        if (!validation.valid) {
          reject(new Error(validation.error));
          return;
        }

        const typeToHeader: Record<string, string> = {};
        const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());

        for (let i = 0; i < headers.length; i++) {
          const origHeader = headers[i];
          const normHeader = normalizedHeaders[i];
          const fieldType = validation.headerMap[normHeader];
          if (fieldType) {
            typeToHeader[fieldType] = origHeader;
          }
        }

        const data: RowData[] = [];

        for (const row of results.data as any[]) {
          try {
            const mappedRow: RowData = {
              nomenclature: toStringSafe(row[typeToHeader["nomenclature"]]),
              date: toStringSafe(row[typeToHeader["date"]]),
              income: toNumberSafe(row[typeToHeader["income"]]),
              expense: toNumberSafe(row[typeToHeader["expense"]]),
              stock: toNumberSafe(row[typeToHeader["stock"]]),
            };
            data.push(mappedRow);
          } catch (e) {
            reject(new Error(`Ошибка обработки строки данных: ${e}`));
            return;
          }
        }

        if (data.length === 0) {
          reject(new Error("Файл не содержит данных"));
          return;
        }

        resolve(data);
      },
      error: (error) => {
        reject(new Error(`Ошибка чтения CSV: ${error.message}`));
      },
    });
  });
}
