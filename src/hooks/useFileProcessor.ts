import { readTextFile } from "@tauri-apps/plugin-fs";

export interface StockData {
  date: string;
  income: number;
  expense: number;
  balance: number;
}

export interface FileProcessingResult {
  success: boolean;
  data?: StockData[];
  error?: string;
}

export function useFileProcessor() {
  const processCsvFile = async (
    filePath: string,
  ): Promise<FileProcessingResult> => {
    try {
      const content = await readTextFile(filePath);

      const lines = content.trim().split("\n");
      if (lines.length < 2) {
        return {
          success: false,
          error:
            "Файл слишком короткий. Нужны заголовки и хотя бы одна строка данных.",
        };
      }

      const headers = lines[0].split(",").map((h) => h.trim());
      const requiredColumns = ["Дата", "Приход", "Расход", "Остаток"];

      for (const col of requiredColumns) {
        if (!headers.includes(col)) {
          return {
            success: false,
            error: `Отсутствует обязательный столбец: "${col}". Ожидаются столбцы: ${requiredColumns.join(", ")}`,
          };
        }
      }

      const dateIndex = headers.indexOf("Дата");
      const incomeIndex = headers.indexOf("Приход");
      const expenseIndex = headers.indexOf("Расход");
      const balanceIndex = headers.indexOf("Остаток");

      const data: StockData[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCsvLine(line);

        if (
          values.length <
          Math.max(dateIndex, incomeIndex, expenseIndex, balanceIndex) + 1
        ) {
          return {
            success: false,
            error: `Недостаточно данных в строке ${i + 1}. Ожидаются 4 столбца.`,
          };
        }

        const date = values[dateIndex];
        if (!isValidDate(date)) {
          return {
            success: false,
            error: `Неверный формат даты в строке ${i + 1}: "${date}". Ожидается YYYY-MM-DD.`,
          };
        }

        const income = parseNumber(values[incomeIndex], "Приход", i + 1);
        const expense = parseNumber(values[expenseIndex], "Расход", i + 1);
        const balance = parseNumber(values[balanceIndex], "Остаток", i + 1);

        if (income === null || expense === null || balance === null) {
          return {
            success: false,
            error: `Ошибка в строке ${i + 1}: некорректные числовые значения.`,
          };
        }

        data.push({
          date,
          income,
          expense,
          balance,
        });
      }

      if (data.length === 0) {
        return { success: false, error: "Файл не содержит данных." };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Ошибка при обработке файла:", error);
      return {
        success: false,
        error: "Не удалось прочитать файл. Убедитесь, что это CSV-файл.",
      };
    }
  };

  return { processCsvFile };
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i++;
    } else if (char === '"' && inQuotes) {
      inQuotes = false;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date.toISOString().slice(0, 10) === dateString;
}

function parseNumber(
  value: string,
  fieldName: string,
  line: number,
): number | null {
  if (value === "") return 0;

  const num = Number(value.replace(",", "."));
  if (isNaN(num)) {
    console.error(
      `Неверное число в поле ${fieldName}, строка ${line}: "${value}"`,
    );
    return null;
  }
  return num;
}
