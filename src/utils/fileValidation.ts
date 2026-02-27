export function validateHeaders(headers: string[]) {
  const headerMap: Record<string, string> = {
    номенклатура: "nomenclature",
    название: "nomenclature",
    name: "nomenclature",
    nomenclature: "nomenclature",

    дата: "date",
    date: "date",

    приход: "income",
    доход: "income",
    income: "income",

    расход: "expense",
    траты: "expense",
    expense: "expense",

    остаток: "stock",
    баланс: "stock",
    stock: "stock",
    balance: "stock",
  };

  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());
  const requiredKeys = ["nomenclature", "date", "income", "expense", "stock"];

  const foundKeys = new Set<string>();
  for (const header of normalizedHeaders) {
    if (headerMap[header]) {
      foundKeys.add(headerMap[header]);
    }
  }

  const missing = requiredKeys.filter((key) => !foundKeys.has(key));

  if (missing.length === 0) {
    return { valid: true, headerMap };
  } else {
    return {
      valid: false,
      error: `Отсутствуют обязательные столбцы. Ожидаются: Номенклатура, Дата, Приход, Расход, Остаток`,
    };
  }
}
