import Modal from './Modal';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import ExcelJS from 'exceljs';

import './Modal.css'
import './HelpModal.css'

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
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
        { item: 'Номенклатура', date: '2025-01-01', in: 100, out: 20, stock: 80 },
        { item: 'Номенклатура', date: '2025-01-02', in: 0,   out: 15, stock: 65 },
        { item: 'Номенклатура', date: '2025-01-03', in: 50,  out: 10, stock: 105 },
        { item: 'Номенклатура', date: '2025-01-04', in: 0,   out: 25, stock: 80 },
        { item: 'Номенклатура', date: '2025-01-05', in: 30,  out: 5,  stock: 105 }
      ]);

      const buffer = await workbook.xlsx.writeBuffer();

      const filePath = await save({
        filters: [{ name: 'Excel файл', extensions: ['xlsx'] }],
        defaultPath: 'пример_данных.xlsx'
      });

      if (filePath) {
        await writeFile(filePath, new Uint8Array(buffer));
      }
    } catch (error) {
      console.error('Ошибка при генерации Excel-файла:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Справка" className="help-modal">
      <div className="help-modal__content">
        <h3 className="help-modal__heading">Как использовать приложение</h3>
        <ol className="help-modal__instructions">
          <li>Загрузите файл с данными в формате .xlsx, .csv, .xls</li>
          <li>Файл должен содержать столбцы: Номенклатура, Дата, Приход, Расход, Остаток</li>
          <li>В разделе "Анализ" подберите значения объема поставки и порога, используя рекомендованный начальный порог.</li>
          <li>После подбора параметров, сохраните их.</li>
          <li>В разделе "Экспорт" вы можете посмотреть и выгрузить подобранные параметры для номенклатуры.</li>
        </ol>

        <h3 className="help-modal__heading">Пример файла</h3>
        <p className="help-modal__description">Скачайте пример файла для быстрого начала работы:</p>
        <button className="help-modal__download-btn" onClick={downloadExample}>
          Пример
        </button>
      </div>
    </Modal>
  );
}
