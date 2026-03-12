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

export type ReferenceItem = {
  deliveryDays?: number;
  unitCost?: number;
  optimalOrder?: number;
  minimalOrder?: number;
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

function validateReferenceHeaders(headers: string[]): {
  valid: boolean;
  error?: string;
  headerMap: Record<string, string>;
} {
  const normalized = headers.map((h) => h.trim().toLowerCase());

  if (
    !normalized.includes("номенклатура") &&
    !normalized.includes("nomenclature")
  ) {
    return {
      valid: false,
      error: 'Требуется колонка "Номенклатура"',
      headerMap: {},
    };
  }

  const headerMap: Record<string, string> = {};

  const mappings = {
    nomenclature: ["номенклатура", "nomenclature", "товар", "product"],
    deliveryDays: [
      "период доставки",
      "дней доставки",
      "delivery days",
      "delivery_days",
      "period",
    ],
    unitCost: [
      "цена",
      "стоимость",
      "price",
      "unit cost",
      "unit_cost",
      "цена, руб./ед",
    ],
    optimalOrder: [
      "оптимальный объем закупа",
      "оптимальный заказ",
      "optimal order",
      "optimal_order",
      "оптимальный объем",
    ],
    minimalOrder: [
      "минимальный объем закупа",
      "минимальный заказ",
      "minimum order",
      "минимальная объем",
      "минимальный объем",
    ],
  };

  for (const [field, possibleNames] of Object.entries(mappings)) {
    const found = normalized.find((header) => possibleNames.includes(header));
    if (found) {
      const originalHeader = headers[normalized.indexOf(found)];
      headerMap[originalHeader] = field;
    }
  }

  return { valid: true, headerMap };
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

export async function parseReferenceExcel(
  file: File,
): Promise<Map<string, ReferenceItem>> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("Файл не содержит листов");

  const referenceData = new Map<string, ReferenceItem>();
  const headerRow = worksheet.getRow(1);
  const headers = Array.isArray(headerRow.values)
    ? headerRow.values.slice(1).map(String)
    : [];

  const validation = validateReferenceHeaders(headers);
  if (!validation.valid) throw new Error(validation.error);

  const headerMap = validation.headerMap;
  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());

  const indices: Record<string, number> = {};
  Object.keys(headerMap).forEach((originalHeader) => {
    const field = headerMap[originalHeader];
    const idx = normalizedHeaders.indexOf(originalHeader.toLowerCase());
    if (idx !== -1) {
      indices[field] = idx;
    }
  });

  worksheet.eachRow((row, idx) => {
    if (idx === 1) return;

    const valuesArray = Array.isArray(row.values) ? row.values.slice(1) : [];

    const nomenclature = toStringSafe(valuesArray[indices["nomenclature"]]);
    if (!nomenclature) return;

    const item: ReferenceItem = {};

    if (indices["deliveryDays"] !== undefined) {
      const value = toNumberSafe(valuesArray[indices["deliveryDays"]]);
      if (value > 0) item.deliveryDays = value;
    }

    if (indices["unitCost"] !== undefined) {
      const value = toNumberSafe(valuesArray[indices["unitCost"]]);
      if (value > 0) item.unitCost = value;
    }

    if (indices["optimalOrder"] !== undefined) {
      const value = toNumberSafe(valuesArray[indices["optimalOrder"]]);
      if (value > 0) item.optimalOrder = value;
    }

    if (indices["minimalOrder"] !== undefined) {
      const value = toNumberSafe(valuesArray[indices["minimalOrder"]]);
      if (value > 0) item.minimalOrder = value;
    }

    referenceData.set(nomenclature, item);
  });

  if (referenceData.size === 0) {
    throw new Error("Справочник не содержит данных");
  }

  return referenceData;
}

export async function parseReferenceCSV(
  file: File,
): Promise<Map<string, ReferenceItem>> {
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

        const validation = validateReferenceHeaders(headers);
        if (!validation.valid) {
          reject(new Error(validation.error));
          return;
        }

        const headerMap = validation.headerMap;
        const referenceData = new Map<string, ReferenceItem>();

        for (const row of results.data as any[]) {
          try {
            const nomenclatureKey = Object.keys(headerMap).find(
              (k) => headerMap[k] === "nomenclature",
            );
            const nomenclature = toStringSafe(row[nomenclatureKey!]);
            if (!nomenclature) continue;

            const item: ReferenceItem = {};

            const deliveryDaysKey = Object.keys(headerMap).find(
              (k) => headerMap[k] === "deliveryDays",
            );
            if (deliveryDaysKey && row[deliveryDaysKey]) {
              const value = toNumberSafe(row[deliveryDaysKey]);
              if (value > 0) item.deliveryDays = value;
            }

            const unitCostKey = Object.keys(headerMap).find(
              (k) => headerMap[k] === "unitCost",
            );
            if (unitCostKey && row[unitCostKey]) {
              const value = toNumberSafe(row[unitCostKey]);
              if (value > 0) item.unitCost = value;
            }

            const optimalOrderKey = Object.keys(headerMap).find(
              (k) => headerMap[k] === "optimalOrder",
            );
            if (optimalOrderKey && row[optimalOrderKey]) {
              const value = toNumberSafe(row[optimalOrderKey]);
              if (value > 0) item.optimalOrder = value;
            }

            const minimalOrderKey = Object.keys(headerMap).find(
              (k) => headerMap[k] === "minimalOrder",
            );
            if (minimalOrderKey && row[minimalOrderKey]) {
              const value = toNumberSafe(row[minimalOrderKey]);
              if (value > 0) item.minimalOrder = value;
            }

            referenceData.set(nomenclature, item);
          } catch (e) {
            reject(new Error(`Ошибка обработки строки справочника: ${e}`));
            return;
          }
        }

        if (referenceData.size === 0) {
          reject(new Error("Справочник не содержит данных"));
          return;
        }

        resolve(referenceData);
      },
      error: (error) => {
        reject(new Error(`Ошибка чтения CSV: ${error.message}`));
      },
    });
  });
}
