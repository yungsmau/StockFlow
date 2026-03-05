import { useState } from 'react';
import { writeFile } from '@tauri-apps/plugin-fs';
import { save } from '@tauri-apps/plugin-dialog';
import ExcelJS from 'exceljs';
import type { ExportItem } from "../../App";
import "./ExportView.css";
import { formatNumber, formatCurrency } from '../../utils/formatNumber';

async function exportToExcel(data: ExportItem[]): Promise<void> {
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
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F77B4' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  sheet.getColumn('efficiency').numFmt = '0.0';
  ['initialStock', 'threshold', 'deliveryDays', 'avgStock', 'actualAvgStock'].forEach(colKey => {
    sheet.getColumn(colKey).numFmt = '#,##0';
  });
  sheet.getColumn('unitCost').numFmt = '#,##0.00';

  const buffer = await workbook.xlsx.writeBuffer();
  const filePath = await save({
    filters: [{ name: 'Excel файл', extensions: ['xlsx'] }],
    defaultPath: 'Результаты_моделирования.xlsx'
  });

  if (filePath) {
    await writeFile(filePath, new Uint8Array(buffer));
  }
}

function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

async function exportToCSV(data: ExportItem[]): Promise<void> {
  const headers = [
    'Номенклатура',
    'Поставка',
    'Порог',
    'Дней доставки',
    'Цена, руб/ед',
    'Эффективность, %',
    'Средний остаток (модель)',
    'Средний остаток (факт)'
  ].map(escapeCsvValue);

  const rows = data.map(item =>
    [
      escapeCsvValue(item.product),
      item.initialStock,
      item.threshold,
      item.deliveryDays,
      item.unitCost.toFixed(2),
      item.efficiency.toFixed(1),
      Math.round(item.avgStock),
      Math.round(item.actualAvgStock)
    ].join(',')
  );

  const csvContent = [headers.join(','), ...rows].join('\n');
  const filePath = await save({
    filters: [{ name: 'CSV файл', extensions: ['csv'] }],
    defaultPath: 'Результаты_моделирования.csv'
  });

  if (filePath) {
    await writeFile(filePath, new TextEncoder().encode(csvContent));
  }
}

interface ExportViewProps {
  data: ExportItem[];
  onClear: () => void;
  onRemoveItem?: (index: number) => void;
}

export default function ExportView({ data, onClear, onRemoveItem }: ExportViewProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleExport = async (format: 'xlsx' | 'csv') => {
    if (data.length === 0) return;

    try {
      if (format === 'xlsx') {
        await exportToExcel(data);
      } else {
        await exportToCSV(data);
      }
    } catch (error) {
      console.error(`Ошибка при экспорте в ${format}:`, error);
      alert(`Не удалось сохранить файл в формате ${format.toUpperCase()}`);
    }
  };

  // Определяем класс для цветовой индикации эффективности
  const getEfficiencyClass = (value: number): string => {
    if (value > 0) return 'efficiency-positive';
    if (value < 0) return 'efficiency-negative';
    return 'efficiency-neutral';
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
                      <td>{formatNumber(item.initialStock)}</td>
                      <td>{formatNumber(item.threshold)}</td>
                      <td>{formatNumber(item.deliveryDays)}</td>
                      <td>{formatCurrency(item.unitCost)}</td>
                      <td>
                        <span className={getEfficiencyClass(item.efficiency)}>
                          {item.efficiency.toFixed(1)}%
                        </span>
                      </td>
                      <td>{formatNumber(Math.round(item.avgStock))}</td>
                      <td>{formatNumber(Math.round(item.actualAvgStock))}</td>
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
            <div className="export-save-wrapper">
              <div
                className="export-save-dropdown"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <button
                  className="export-save-btn"
                  onClick={() => handleExport('xlsx')}
                >
                  Сохранить
                </button>

                {isHovered && (
                  <div className="export-format-menu">
                    <button
                      onClick={() => handleExport('xlsx')}
                      className="export-format-option export-format-option--xlsx"
                    >
                      xlsx
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      className="export-format-option export-format-option--csv"
                    >
                      csv
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}