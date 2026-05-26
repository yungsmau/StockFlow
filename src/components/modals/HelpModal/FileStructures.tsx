import ExcelJS from 'exceljs';

export const downloadExample = async () => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Данные');
    sheet.columns = [
      { header: 'Номенклатура', key: 'item', width: 15 },
      { header: 'Дата', key: 'date', width: 15 },
      { header: 'Приход', key: 'in', width: 10 },
      { header: 'Расход', key: 'out', width: 10 },
      { header: 'Остаток', key: 'stock', width: 10 }
    ];
    sheet.addRows([
      { item: 'Товар А', date: '01-01-2025', in: 100, out: 20, stock: 80 },
      { item: 'Товар А', date: '01-02-2025', in: 0,   out: 15, stock: 65 },
      { item: 'Товар А', date: '02-02-2025', in: 50,  out: 10, stock: 105 },
      { item: 'Товар А', date: '03-02-2025', in: 0,   out: 25, stock: 80 },
      { item: 'Товар А', date: '01-04-2025', in: 30,  out: 5,  stock: 105 }
    ]);
    const buffer = await workbook.xlsx.writeBuffer();
    const filePath = await (await import('@tauri-apps/plugin-dialog')).save({
      filters: [{ name: 'Excel файл', extensions: ['xlsx'] }],
      defaultPath: 'пример_данных.xlsx'
    });
    if (filePath) {
      await (await import('@tauri-apps/plugin-fs')).writeFile(filePath, new Uint8Array(buffer));
    }
  } catch (error) {
    console.error('Ошибка при генерации Excel-файла:', error);
  }
};

export const downloadReferenceExample = async () => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Справочник');
    sheet.columns = [
      { header: 'Номенклатура', key: 'nomenclature', width: 25 },
      { header: 'Минимальный объем закупа', key: 'minimalOrder', width: 20 },
      { header: 'Оптимальный объем закупа', key: 'optimalOrder', width: 20 },
      { header: 'Цена', key: 'unitCost', width: 15 },
      { header: 'Период доставки', key: 'deliveryDays', width: 15 }
    ];
    sheet.addRows([
      { nomenclature: 'Товар А', minimalOrder: 500, optimalOrder: 1000, unitCost: 12.50, deliveryDays: 5 },
      { nomenclature: 'Товар Б', minimalOrder: 200, optimalOrder: 800, unitCost: 8.75, deliveryDays: 3 },
      { nomenclature: 'Товар В', minimalOrder: 1000, optimalOrder: 2000, unitCost: 15.20, deliveryDays: 7 }
    ]);
    const buffer = await workbook.xlsx.writeBuffer();
    const filePath = await (await import('@tauri-apps/plugin-dialog')).save({
      filters: [{ name: 'Excel файл', extensions: ['xlsx'] }],
      defaultPath: 'справочник_пример.xlsx'
    });
    if (filePath) {
      await (await import('@tauri-apps/plugin-fs')).writeFile(filePath, new Uint8Array(buffer));
    }
  } catch (error) {
    console.error('Ошибка при генерации справочника:', error);
  }
};

export const downloadPlanExample = async () => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('План');
    sheet.columns = [
      { header: 'Дата', key: 'date', width: 15 },
      { header: 'Номенклатура', key: 'item', width: 15 },
      { header: 'Плановый расход', key: 'planOut', width: 15 },
    ];
    sheet.addRows([
      {date: 'январь 2025', item: 'Товар А', planOut: 100 },
      {date: 'февраль 2025', item: 'Товар А', planOut: 100 },
      {date: 'март 2025', item: 'Товар А', planOut: 100 },
      {date: 'апрель 2025', item: 'Товар А', planOut: 100 },
      {date: 'май 2025', item: 'Товар А', planOut: 100 },
    ]);
    const buffer = await workbook.xlsx.writeBuffer();
    const filePath = await (await import('@tauri-apps/plugin-dialog')).save({
      filters: [{ name: 'Excel файл', extensions: ['xlsx'] }],
      defaultPath: 'пример_плана.xlsx'
    });
    if (filePath) {
      await (await import('@tauri-apps/plugin-fs')).writeFile(filePath, new Uint8Array(buffer));
    }
  } catch (error) {
    console.error('Ошибка при генерации Excel-файла:', error);
  }
};