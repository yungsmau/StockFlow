import { writeFile } from '@tauri-apps/plugin-fs';
import { save } from '@tauri-apps/plugin-dialog';

import ExcelJS from 'exceljs';
import type { ExportItem } from "../../App";

import "./ExportView.css";

interface ExportViewProps {
  data: ExportItem[];
  onClear: () => void;
  onRemoveItem?: (index: number) => void;
}

export default function ExportView({ 
  data, 
  onClear, 
  onRemoveItem
}: ExportViewProps) {
  const handleExport = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Результаты моделирования');

      sheet.columns = [
        { header: 'Номенклатура', key: 'product', width: 25 },
        { header: 'Поставка', key: 'initialStock', width: 12 },
        { header: 'Порог', key: 'threshold', width: 12 },
        { header: 'Дней доставки', key: 'deliveryDays', width: 15 },
        { header: 'Цена, руб/ед', key: 'unitCost', width: 15 },
        { header: 'Эффективность, %', key: 'efficiency', width: 18 },
        { header: 'Средний остаток (модель)', key: 'avgStock', width: 25 },
        { header: 'Средний остаток (факт)', key: 'actualAvgStock', width: 25 }
      ];

      const rows = data.map(item => ({
        product: item.product,
        initialStock: item.initialStock,
        threshold: item.threshold,
        deliveryDays: item.deliveryDays,
        unitCost: item.unitCost,
        efficiency: item.efficiency,
        avgStock: Math.round(item.avgStock),
        actualAvgStock: Math.round(item.actualAvgStock)
      }));

      sheet.addRows(rows);

      sheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1F77B4' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      const efficiencyColumn = sheet.getColumn('efficiency');
      efficiencyColumn.numFmt = '0.0';

      ['initialStock', 'threshold', 'deliveryDays', 'avgStock', 'actualAvgStock'].forEach(colKey => {
        const column = sheet.getColumn(colKey);
        column.numFmt = '#,##0';
      });

      const priceColumn = sheet.getColumn('unitCost');
      priceColumn.numFmt = '#,##0.00';

      sheet.columns.forEach(column => {
        if (column.header) {
          const maxLength = Math.max(
            column.header.toString().length,
            ...rows.map(row => row[column.key as keyof typeof rows[0]]?.toString().length || 0)
          );
          column.width = Math.min(maxLength + 2, 30);
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();

      const filePath = await save({
        filters: [{ name: 'Excel файл', extensions: ['xlsx'] }],
        defaultPath: 'Результаты_моделирования.xlsx'
      });

      if (filePath) {
        await writeFile(filePath, new Uint8Array(buffer));
        console.log('Файл успешно сохранён:', filePath);
      }
    } catch (error) {
      console.error('Ошибка при экспорте Excel-файла:', error);
      alert('Произошла ошибка при сохранении файла. Проверьте консоль для подробностей.');
    }
  };

  return (
    <div className="export-view">
      <div className="export-header">
        <h2>Экспорт результатов моделирования</h2>
        <p>Предварительный просмотр данных для сохранения</p>
      </div>

      {data.length === 0 ? (
        <div className="export-empty">
          <p>Нет данных для экспорта</p>
        </div>
      ) : (
        <>
          <div className="export-table-container">
            <div className="export-table-wrapper">
              <table className="export-table">
                <thead>
                  <tr>
                    <th>Номенклатура</th>
                    <th>Поставка</th>
                    <th>Порог</th>
                    <th>Дней доставки</th>
                    <th>Цена</th>
                    <th>Эффективность</th>
                    <th>Средний остаток (модель)</th>
                    <th>Средний остаток (факт)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={index}>
                      <td>{item.product}</td>
                      <td>{item.initialStock}</td>
                      <td>{item.threshold}</td>
                      <td>{item.deliveryDays}</td>
                      <td>{item.unitCost}</td>
                      <td>{(item.efficiency).toFixed(1)}%</td>
                      <td>{Math.round(item.avgStock)}</td>
                      <td>{Math.round(item.actualAvgStock)}</td>
                      <td>
                        <button 
                          className="export-table-delete-btn"
                          onClick={() => onRemoveItem?.(index)}
                          title="Удалить из экспорта"
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.5 4.99999H4.16667M4.16667 4.99999H17.5M4.16667 4.99999L4.16667 16.6667C4.16667 17.1087 4.34226 17.5326 4.65482 17.8452C4.96738 18.1577 5.39131 18.3333 5.83333 18.3333H14.1667C14.6087 18.3333 15.0326 18.1577 15.3452 17.8452C15.6577 17.5326 15.8333 17.1087 15.8333 16.6667V4.99999M6.66667 4.99999V3.33332C6.66667 2.8913 6.84226 2.46737 7.15482 2.15481C7.46738 1.84225 7.89131 1.66666 8.33333 1.66666H11.6667C12.1087 1.66666 12.5326 1.84225 12.8452 2.15481C13.1577 2.46737 13.3333 2.8913 13.3333 3.33332V4.99999" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="export-actions">
            <button onClick={onClear} className="export-clear-btn">
              Очистить всё
            </button>
            <button onClick={handleExport} className="export-save-btn">
              Сохранить таблицу
            </button>
          </div>
        </>
      )}
    </div>
  );
}