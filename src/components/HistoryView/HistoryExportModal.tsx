import { useState } from 'react';
import { writeFile } from '@tauri-apps/plugin-fs';
import { save } from '@tauri-apps/plugin-dialog';
import ExcelJS from 'exceljs';
import type { ExportHistoryItem } from '../../utils/historyService';

interface HistoryExportModalProps {
  isOpen: boolean;
  selectedItems: ExportHistoryItem[];
  onClose: () => void;
}

function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export default function HistoryExportModal({
  isOpen,
  selectedItems,
  onClose
}: HistoryExportModalProps) {
  const [isClearing, setIsClearing] = useState(false);

  if (!isOpen) return null;

  const exportToExcel = async () => {
    setIsClearing(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('История обработки');

      sheet.columns = [
        { header: 'Дата обработки', key: 'processedAt', width: 20 },
        { header: 'Номенклатура', key: 'product', width: 25 },
        { header: 'Поставка, ед.', key: 'initialStock', width: 12 },
        { header: 'Порог, ед.', key: 'threshold', width: 12 },
        { header: 'Цена, руб./ед.', key: 'unitCost', width: 15 },
        { header: 'Срок поставки, дни', key: 'deliveryDays', width: 18 },
        { header: 'Ср. дневной остаток, ед.', key: 'avgStock', width: 25 },
        { header: 'Ср. дневной остаток, руб.', key: 'stockValue', width: 18 },
        { header: 'Эффективность, %', key: 'efficiency', width: 18 },
        { header: 'Эффективность, руб.', key: 'efficiencyAbs', width: 18 }
      ];

      const rows = selectedItems.map(item => ({
        processedAt: item.processedAt,
        product: item.product,
        initialStock: item.initialStock,
        threshold: item.threshold,
        unitCost: item.unitCost,
        deliveryDays: item.deliveryDays,
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

      sheet.getColumn('efficiency').numFmt = '0.0';
      sheet.getColumn('efficiencyAbs').numFmt = '#,##0.00';
      sheet.getColumn('stockValue').numFmt = '#,##0.00';
      
      ['initialStock', 'threshold', 'deliveryDays', 'avgStock'].forEach(colKey => {
        sheet.getColumn(colKey).numFmt = '#,##0';
      });
      
      sheet.getColumn('unitCost').numFmt = '#,##0.00';

      const buffer = await workbook.xlsx.writeBuffer();
      const filePath = await save({
        filters: [{ name: 'Excel файл', extensions: ['xlsx'] }],
        defaultPath: 'История_обработки.xlsx'
      });

      if (filePath) {
        await writeFile(filePath, new Uint8Array(buffer));
      }
    } catch (err) {
      console.error('Ошибка при экспорте в Excel:', err);
      alert('Не удалось сохранить Excel-файл');
    } finally {
      setIsClearing(false);
      onClose();
    }
  };

  const exportToCSV = async () => {
    setIsClearing(true);
    try {
      const headers = [
        'Дата обработки',
        'Номенклатура',
        'Поставка, ед.',
        'Порог, ед.',
        'Цена, руб./ед.',
        'Срок поставки, дни',
        'Ср. дневной остаток, ед.',
        'Ср. дневной остаток, руб.',
        'Эффективность, %',
        'Эффективность, руб.'
      ].map(escapeCsvValue);

      const rows = selectedItems.map(item =>
        [
          escapeCsvValue(item.processedAt),
          escapeCsvValue(item.product),
          item.initialStock,
          item.threshold,
          item.unitCost.toFixed(2),
          item.deliveryDays,
          Math.round(item.avgStock),
          item.stockValue !== undefined ? item.stockValue.toFixed(2) : '-',
          item.efficiency.toFixed(1),
          item.efficiencyAbs !== undefined ? item.efficiencyAbs.toFixed(2) : '-'
        ].join(',')
      );

      const csvContent = [headers.join(','), ...rows].join('\n');
      const filePath = await save({
        filters: [{ name: 'CSV файл', extensions: ['csv'] }],
        defaultPath: 'История_обработки.csv'
      });

      if (filePath) {
        await writeFile(filePath, new TextEncoder().encode(csvContent));
      }
    } catch (err) {
      console.error('Ошибка при экспорте в CSV:', err);
      alert('Не удалось сохранить CSV-файл');
    } finally {
      setIsClearing(false);
      onClose();
    }
  };

  return (
    <div className="history-confirm-overlay" onClick={onClose}>
      <div className="history-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Выберите формат экспорта</h3>
        <div className="history-export-options">
          <button 
            className="history-export-option history-export-xlsx"
            onClick={exportToExcel}
            disabled={isClearing}
          >
            Excel (.xlsx)
          </button>
          <button 
            className="history-export-option history-export-csv"
            onClick={exportToCSV}
            disabled={isClearing}
          >
            CSV (.csv)
          </button>
        </div>
        <button 
          className="history-export-cancel"
          onClick={onClose}
          disabled={isClearing}
        >
          Отмена
        </button>
      </div>
    </div>
  );
}