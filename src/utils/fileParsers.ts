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

export type UploadedFile = {
  name: string;
  format: string;
  data: RowData[];
};

export type ReferenceItem = {
  deliveryDays?: number;
  unitCost?: number;
  optimalOrder?: number;
  minimalOrder?: number;
};

// === Типы для файла плана ===
export type PlanItem = {
  nomenclature: string;
  month: string; // "январь 2025"
  monthDate: Date; // 2025-01-01 (для сортировки/расчётов)
  plannedExpense: number;
};

export type DailyPlanItem = {
  nomenclature: string;
  date: string; // "2025-01-01"
  planned_expense: number;
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

// === Парсеры для файла истории ===
export type HistoryItem = {
  processedAt: string;
  nomenclature: string;
  supply: number;
  threshold: number;
  unitCost: number;
  deliveryDays: number;
  avgStockUnits: number;
  avgStockRub: number;
  efficiencyPercent: number;
  efficiencyRub: number;
  source?: "internal" | "external";
};

function validateHistoryHeaders(headers: string[]): {
  valid: boolean;
  error?: string;
  headerMap: Record<string, string>;
} {
  const normalized = headers.map((h) => h.trim().toLowerCase());

  // Обязательные колонки
  const required = [
    "номенклатура",
    "поставка",
    "порог",
    "цена",
    "срок поставки",
  ];
  const missing = required.filter(
    (req) => !normalized.some((h) => h.includes(req)),
  );

  if (missing.length > 0) {
    return {
      valid: false,
      error: `Отсутствуют обязательные колонки: ${missing.join(", ")}`,
      headerMap: {},
    };
  }

  const headerMap: Record<string, string> = {};
  const mappings: Record<string, string[]> = {
    processedAt: [
      "дата обработки",
      "дата",
      "обработано",
      "processed_at",
      "processed at",
    ],
    nomenclature: [
      "номенклатура",
      "товар",
      "продукт",
      "nomenclature",
      "product",
    ],
    supply: [
      "поставка",
      "поставка, ед.",
      "поставка (ед.)",
      "supply",
      "initial_stock",
    ],
    threshold: [
      "порог",
      "порог, ед.",
      "порог (ед.)",
      "threshold",
      "мин. остаток",
    ],
    unitCost: [
      "цена",
      "цена, руб./ед.",
      "цена (руб./ед.)",
      "unit_cost",
      "price",
    ],
    deliveryDays: [
      "срок поставки",
      "срок поставки, дни",
      "дней доставки",
      "delivery_days",
      "delivery days",
    ],
    avgStockUnits: [
      "ср. дневной остаток, ед.",
      "средний остаток, ед.",
      "avg_stock_units",
      "avg stock",
    ],
    avgStockRub: [
      "ср. дневной остаток, руб.",
      "средний остаток, руб.",
      "avg_stock_rub",
    ],
    efficiencyPercent: [
      "эффективность, %",
      "эффективность (проценты)",
      "efficiency_percent",
      "efficiency %",
    ],
    efficiencyRub: [
      "эффективность, руб.",
      "эффективность (рубли)",
      "efficiency_rub",
      "efficiency rub",
    ],
  };

  for (const [field, possibleNames] of Object.entries(mappings)) {
    const found = normalized.find((header) =>
      possibleNames.some((name) => header.includes(name)),
    );
    if (found) {
      const originalHeader = headers[normalized.indexOf(found)];
      headerMap[originalHeader] = field;
    }
  }

  return { valid: true, headerMap };
}

export async function parseHistoryExcel(file: File): Promise<HistoryItem[]> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("Файл не содержит листов");

  const rows: HistoryItem[] = [];
  const headerRow = worksheet.getRow(1);
  const headers = Array.isArray(headerRow.values)
    ? headerRow.values.slice(1).map(String)
    : [];

  const validation = validateHistoryHeaders(headers);
  if (!validation.valid) throw new Error(validation.error);

  const headerMap = validation.headerMap;
  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());

  const indices: Record<string, number> = {};
  Object.entries(headerMap).forEach(([originalHeader, field]) => {
    const idx = normalizedHeaders.findIndex(
      (h) => h === originalHeader.toLowerCase(),
    );
    if (idx !== -1) {
      indices[field] = idx;
    }
  });

  worksheet.eachRow((row, idx) => {
    if (idx === 1) return;

    const valuesArray = Array.isArray(row.values) ? row.values.slice(1) : [];

    const item: HistoryItem = {
      processedAt: toStringSafe(valuesArray[indices["processedAt"]]),
      nomenclature: toStringSafe(valuesArray[indices["nomenclature"]]),
      supply: toNumberSafe(valuesArray[indices["supply"]]),
      threshold: toNumberSafe(valuesArray[indices["threshold"]]),
      unitCost: toNumberSafe(valuesArray[indices["unitCost"]]),
      deliveryDays: toNumberSafe(valuesArray[indices["deliveryDays"]]),
      avgStockUnits: toNumberSafe(valuesArray[indices["avgStockUnits"]]),
      avgStockRub: toNumberSafe(valuesArray[indices["avgStockRub"]]),
      efficiencyPercent: toNumberSafe(
        valuesArray[indices["efficiencyPercent"]],
      ),
      efficiencyRub: toNumberSafe(valuesArray[indices["efficiencyRub"]]),
      source: "external",
    };

    if (item.nomenclature) {
      rows.push(item);
    }
  });

  if (rows.length === 0) {
    throw new Error("Файл истории не содержит данных");
  }

  return rows;
}

export async function parseHistoryCSV(file: File): Promise<HistoryItem[]> {
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

        const validation = validateHistoryHeaders(headers);
        if (!validation.valid) {
          reject(new Error(validation.error));
          return;
        }

        const headerMap = validation.headerMap;
        const data: HistoryItem[] = [];

        for (const row of results.data as any[]) {
          try {
            const item: HistoryItem = {
              processedAt: toStringSafe(
                row[
                  Object.keys(headerMap).find(
                    (k) => headerMap[k] === "processedAt",
                  )!
                ],
              ),
              nomenclature: toStringSafe(
                row[
                  Object.keys(headerMap).find(
                    (k) => headerMap[k] === "nomenclature",
                  )!
                ],
              ),
              supply: toNumberSafe(
                row[
                  Object.keys(headerMap).find((k) => headerMap[k] === "supply")!
                ],
              ),
              threshold: toNumberSafe(
                row[
                  Object.keys(headerMap).find(
                    (k) => headerMap[k] === "threshold",
                  )!
                ],
              ),
              unitCost: toNumberSafe(
                row[
                  Object.keys(headerMap).find(
                    (k) => headerMap[k] === "unitCost",
                  )!
                ],
              ),
              deliveryDays: toNumberSafe(
                row[
                  Object.keys(headerMap).find(
                    (k) => headerMap[k] === "deliveryDays",
                  )!
                ],
              ),
              avgStockUnits: toNumberSafe(
                row[
                  Object.keys(headerMap).find(
                    (k) => headerMap[k] === "avgStockUnits",
                  )!
                ],
              ),
              avgStockRub: toNumberSafe(
                row[
                  Object.keys(headerMap).find(
                    (k) => headerMap[k] === "avgStockRub",
                  )!
                ],
              ),
              efficiencyPercent: toNumberSafe(
                row[
                  Object.keys(headerMap).find(
                    (k) => headerMap[k] === "efficiencyPercent",
                  )!
                ],
              ),
              efficiencyRub: toNumberSafe(
                row[
                  Object.keys(headerMap).find(
                    (k) => headerMap[k] === "efficiencyRub",
                  )!
                ],
              ),
              source: "external",
            };

            if (item.nomenclature) {
              data.push(item);
            }
          } catch (e) {
            reject(new Error(`Ошибка обработки строки истории: ${e}`));
            return;
          }
        }

        if (data.length === 0) {
          reject(new Error("Файл истории не содержит данных"));
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

// === Хелпер для определения типа файла ===
export function detectFileType(
  fileName: string,
): "data" | "reference" | "history" {
  const lower = fileName.toLowerCase();

  if (
    lower.includes("история") ||
    lower.includes("history") ||
    lower.includes("shared")
  ) {
    return "history";
  }

  if (lower.includes("справочник") || lower.includes("reference")) {
    return "reference";
  }

  return "data";
}

// ✅ Парсинг русского месяца в полном формате: "январь 2025" → Date
export function parseRussianMonthFull(monthStr: string): Date | null {
  try {
    const normalized = monthStr.trim().toLowerCase();
    const monthMap: Record<string, number> = {
      январь: 0,
      февраль: 1,
      март: 2,
      апрель: 3,
      май: 4,
      июнь: 5,
      июль: 6,
      август: 7,
      сентябрь: 8,
      октябрь: 9,
      ноябрь: 10,
      декабрь: 11,
    };

    let monthIndex: number | null = null;
    for (const [name, index] of Object.entries(monthMap)) {
      if (normalized.includes(name)) {
        monthIndex = index;
        break;
      }
    }
    if (monthIndex === null) return null;

    const yearMatch = normalized.match(/(20\d{2}|\d{2})$/);
    if (!yearMatch) return null;

    let year = parseInt(yearMatch[1], 10);
    if (year < 100) year = year >= 50 ? 1900 + year : 2000 + year;

    // ✅ Создаём дату в UTC (не локальное время!)
    return new Date(Date.UTC(year, monthIndex, 1));
  } catch {
    return null;
  }
}

// ✅ Валидация заголовков для файла плана
function validatePlanHeaders(headers: string[]): {
  valid: boolean;
  error?: string;
  headerMap: Record<string, string>;
} {
  const normalized = headers.map((h) => h.trim().toLowerCase());

  // Обязательные колонки
  const required = ["номенклатура", "плановый расход"];
  const hasDate = normalized.some(
    (h) =>
      h.includes("дата") ||
      h.includes("месяц") ||
      h.includes("date") ||
      h.includes("month"),
  );

  if (!hasDate) {
    return {
      valid: false,
      error: "Требуется колонка с датой/месяцем",
      headerMap: {},
    };
  }

  const missing = required.filter(
    (req) => !normalized.some((h) => h.includes(req)),
  );

  if (missing.length > 0) {
    return {
      valid: false,
      error: `Отсутствуют обязательные колонки: ${missing.join(", ")}`,
      headerMap: {},
    };
  }

  const headerMap: Record<string, string> = {};
  const mappings: Record<string, string[]> = {
    month: ["дата", "месяц", "период", "date", "month", "period"],
    nomenclature: [
      "номенклатура",
      "товар",
      "продукт",
      "nomenclature",
      "product",
      "item",
    ],
    plannedExpense: [
      "плановый расход",
      "план расход",
      "план",
      "расход план",
      "planned expense",
      "planned_consumption",
      "plan",
      "forecast",
    ],
  };

  for (const [field, possibleNames] of Object.entries(mappings)) {
    const found = normalized.find((header) =>
      possibleNames.some((name) => header.includes(name)),
    );
    if (found) {
      const originalHeader = headers[normalized.indexOf(found)];
      headerMap[originalHeader] = field;
    }
  }

  return { valid: true, headerMap };
}

// ✅ Парсер Excel для файла плана
export async function parsePlanExcel(file: File): Promise<PlanItem[]> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("Файл не содержит листов");

  const rows: PlanItem[] = [];
  const headerRow = worksheet.getRow(1);
  const headers = Array.isArray(headerRow.values)
    ? headerRow.values.slice(1).map(String)
    : [];

  const validation = validatePlanHeaders(headers);
  if (!validation.valid) throw new Error(validation.error);

  const headerMap = validation.headerMap;
  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());

  const indices: Record<string, number> = {};
  Object.entries(headerMap).forEach(([originalHeader, field]) => {
    const idx = normalizedHeaders.findIndex(
      (h) => h === originalHeader.toLowerCase(),
    );
    if (idx !== -1) {
      indices[field] = idx;
    }
  });

  worksheet.eachRow((row, idx) => {
    if (idx === 1) return;

    const valuesArray = Array.isArray(row.values) ? row.values.slice(1) : [];

    const monthRaw = toStringSafe(valuesArray[indices["month"]]);
    const nomenclature = toStringSafe(valuesArray[indices["nomenclature"]]);
    const plannedExpense = toNumberSafe(valuesArray[indices["plannedExpense"]]);

    if (!monthRaw || !nomenclature) return;

    const monthDate = parseRussianMonthFull(monthRaw);

    if (monthDate) {
      rows.push({
        nomenclature,
        month: monthRaw,
        monthDate,
        plannedExpense,
      });
    }
  });

  if (rows.length === 0) {
    throw new Error("Файл плана не содержит данных");
  }

  // Сортируем по дате
  return rows.sort((a, b) => a.monthDate.getTime() - b.monthDate.getTime());
}

// ✅ Парсер CSV для файла плана
export async function parsePlanCSV(file: File): Promise<PlanItem[]> {
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

        const validation = validatePlanHeaders(headers);
        if (!validation.valid) {
          reject(new Error(validation.error));
          return;
        }

        const headerMap = validation.headerMap;
        const data: PlanItem[] = [];

        for (const row of results.data as any[]) {
          try {
            const monthRaw = toStringSafe(
              row[
                Object.keys(headerMap).find((k) => headerMap[k] === "month")!
              ],
            );
            const nomenclature = toStringSafe(
              row[
                Object.keys(headerMap).find(
                  (k) => headerMap[k] === "nomenclature",
                )!
              ],
            );
            const plannedExpense = toNumberSafe(
              row[
                Object.keys(headerMap).find(
                  (k) => headerMap[k] === "plannedExpense",
                )!
              ],
            );

            if (!monthRaw || !nomenclature) continue;

            const monthDate = parseRussianMonthFull(monthRaw);

            if (monthDate) {
              data.push({
                nomenclature,
                month: monthRaw,
                monthDate,
                plannedExpense,
              });
            }
          } catch (e) {
            reject(new Error(`Ошибка обработки строки плана: ${e}`));
            return;
          }
        }

        if (data.length === 0) {
          reject(new Error("Файл плана не содержит данных"));
          return;
        }

        resolve(
          data.sort((a, b) => a.monthDate.getTime() - b.monthDate.getTime()),
        );
      },
      error: (error) => {
        reject(new Error(`Ошибка чтения CSV: ${error.message}`));
      },
    });
  });
}
