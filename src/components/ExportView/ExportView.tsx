import { useState } from 'react';
import { writeFile } from '@tauri-apps/plugin-fs';
import { save } from '@tauri-apps/plugin-dialog';
import ExcelJS from 'exceljs';
import type { ExportItem } from "../../App";
import "./ExportView.css";
import { formatNumber, formatCurrency } from '../../utils/formatNumber';

interface ExtendedExportItem extends ExportItem {
  minimalOrder?: number;
  optimalOrder?: number;
  stockValue?: number;
  efficiencyAbs?: number;
}

async function exportToExcel(data: ExtendedExportItem[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Результаты моделирования');

  sheet.columns = [
    { header: 'Номенклатура', key: 'product', width: 25 },
    { header: 'Поставка, ед.', key: 'initialStock', width: 12 },
    { header: 'Порог, ед.', key: 'threshold', width: 12 },
    { header: 'Цена, руб./ед.', key: 'unitCost', width: 15 },
    { header: 'Срок поставки, дни', key: 'deliveryDays', width: 18 },
    { header: 'Минимальная объем, ед.', key: 'minimalOrder', width: 22 },
    { header: 'Оптимальный объем, ед.', key: 'optimalOrder', width: 22 },
    { header: 'Средний остаток (модель)', key: 'avgStock', width: 25 },
    { header: 'Стоимость остатка', key: 'stockValue', width: 18 },
    { header: 'Эффективность, %', key: 'efficiency', width: 18 },
    { header: 'Эффективность, руб.', key: 'efficiencyAbs', width: 18 }
  ];

  const rows = data.map(item => ({
    product: item.product,
    initialStock: item.initialStock,
    threshold: item.threshold,
    unitCost: item.unitCost,
    deliveryDays: item.deliveryDays,
    minimalOrder: item.minimalOrder !== undefined ? item.minimalOrder : '-',
    optimalOrder: item.optimalOrder !== undefined ? item.optimalOrder : '-',
    avgStock: Math.round(item.avgStock),
    stockValue: item.stockValue !== undefined ? item.stockValue : '-',
    efficiency: item.efficiency,
    efficiencyAbs: item.efficiencyAbs !== undefined ? item.efficiencyAbs : '-'
  }));

  sheet.addRows(rows);

  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F77B4' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Форматирование числовых колонок
  sheet.getColumn('efficiency').numFmt = '0.0';
  sheet.getColumn('efficiencyAbs').numFmt = '#,##0.00';
  sheet.getColumn('stockValue').numFmt = '#,##0.00';
  
  ['initialStock', 'threshold', 'deliveryDays', 'avgStock'].forEach(colKey => {
    sheet.getColumn(colKey).numFmt = '#,##0';
  });
  
  ['minimalOrder', 'optimalOrder'].forEach(colKey => {
    // Эти колонки могут содержать текст "-", поэтому не форматируем как числа
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

async function exportToCSV(data: ExtendedExportItem[]): Promise<void> {
  const headers = [
    'Номенклатура',
    'Поставка, ед.',
    'Порог, ед.',
    'Цена, руб./ед.',
    'Срок поставки, дни',
    'Минимальная поставка, ед.',
    'Оптимальная поставка, ед.',
    'Ср. днейвной остаток, ед.',
    'Стоимость остатка, руб.',
    'Эффективность, %',
    'Эффективность, руб.'
  ].map(escapeCsvValue);

  const rows = data.map(item =>
    [
      escapeCsvValue(item.product),
      item.initialStock,
      item.threshold,
      item.unitCost.toFixed(2),
      item.deliveryDays,
      item.minimalOrder !== undefined ? item.minimalOrder : '-',
      item.optimalOrder !== undefined ? item.optimalOrder : '-',
      Math.round(item.avgStock),
      item.stockValue !== undefined ? item.stockValue.toFixed(2) : '-',
      item.efficiency.toFixed(1),
      item.efficiencyAbs !== undefined ? item.efficiencyAbs.toFixed(2) : '-'
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

  const extendedData = data.map(item => {
    const minimalOrder = (item as any).minimalOrder;
    const optimalOrder = (item as any).optimalOrder;
    const stockValue = (item as any).stockValue;
    const efficiencyAbs = (item as any).efficiencyAbs;
    
    return {
      ...item,
      minimalOrder,
      optimalOrder,
      stockValue,
      efficiencyAbs
    } as ExtendedExportItem;
  });

  const handleExport = async (format: 'xlsx' | 'csv') => {
    if (data.length === 0) return;

    try {
      if (format === 'xlsx') {
        await exportToExcel(extendedData);
      } else {
        await exportToCSV(extendedData);
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
                    <th>Поставка, ед.</th>
                    <th>Порог, ед.</th>
                    <th>Цена, руб./ед.</th>
                    <th>Срок поставки, дни</th>
                    <th>Минимальная поставка, ед.</th>
                    <th>Оптимальная поставка, ед.</th>
                    <th>Ср. днейвной остаток, ед.</th>
                    <th>Стоимость остатка, руб.</th>
                    <th>Эффективность, %</th>
                    <th>Эффективность, руб.</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {extendedData.map((item, index) => (
                    <tr key={index}>
                      <td>{item.product}</td>
                      <td>{formatNumber(item.initialStock)}</td>
                      <td>{formatNumber(item.threshold)}</td>
                      <td>{formatCurrency(item.unitCost)}</td>
                      <td>{formatNumber(item.deliveryDays)}</td>
                      <td>{item.minimalOrder !== undefined ? formatNumber(item.minimalOrder) : '-'}</td>
                      <td>{item.optimalOrder !== undefined ? formatNumber(item.optimalOrder) : '-'}</td>
                      <td>{formatNumber(Math.round(item.avgStock))}</td>
                      <td>{item.stockValue !== undefined ? formatCurrency(item.stockValue) : '-'}</td>
                      <td>
                        <span className={getEfficiencyClass(item.efficiency)}>
                          {item.efficiency.toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <span className={getEfficiencyClass(item.efficiency)}>
                          {item.efficiencyAbs !== undefined ? formatCurrency(item.efficiencyAbs) : '-'}
                        </span>
                      </td>
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