import Modal from '../Modal';
import UsageGuide from './UsageGuide';
import ParametersGuide from './ParametersGuide';
import { useState } from 'react';
import ExcelJS from 'exceljs';

import '../Modal.css';
import './HelpModal.css';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [view, setView] = useState<'menu' | 'usage' | 'parameters'>('menu');

  const downloadExample = async () => {
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
        { item: 'Товар А', date: '2025-01-01', in: 100, out: 20, stock: 80 },
        { item: 'Товар А', date: '2025-01-02', in: 0,   out: 15, stock: 65 },
        { item: 'Товар А', date: '2025-01-03', in: 50,  out: 10, stock: 105 },
        { item: 'Товар А', date: '2025-01-04', in: 0,   out: 25, stock: 80 },
        { item: 'Товар А', date: '2025-01-05', in: 30,  out: 5,  stock: 105 }
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

  const downloadReferenceExample = async () => {
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

  const renderContent = () => {
    switch (view) {
      case 'usage':
        return <UsageGuide 
          onDownloadExample={downloadExample} 
          onDownloadReferenceExample={downloadReferenceExample}
        />;
      case 'parameters':
        return <ParametersGuide />;
      case 'menu':
      default:
        return (
          <div className="help-modal__menu">
            <button
              className="help-modal__menu-btn"
              onClick={() => setView('usage')}
            >
              Использование приложения
            </button>
            <button
              className="help-modal__menu-btn"
              onClick={() => setView('parameters')}
            >
              Параметры моделирования
            </button>
          </div>
        );
    }
  };

  const handleBack = () => {
    if (view !== 'menu') {
      setView('menu');
    }
  };

  const handleClose = () => {
    setView('menu');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Справка"
      className="help-modal"
      onBack={view !== 'menu' ? handleBack : undefined}
    >
      <div className="help-modal__scrollable">
        <div className="help-modal__content">
          {renderContent()}
        </div>
      </div>
    </Modal>
  );
}