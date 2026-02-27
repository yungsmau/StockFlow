import React, { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { readTextFile, readFile } from '@tauri-apps/plugin-fs';

import './FileUploadButtons.css'
import './FileUploadField.css'

interface RowData {
  nomenclature: string;
  date: string;
  income: number;
  expense: number;
  stock: number;
}

interface FileUploadSectionProps {
  isBlocked?: boolean;
  uploadedFiles: { name: string; format: string }[];
  onFileAdd: (file: { name: string; format: string; data: RowData[] }) => void;
  onRemoveFile: (index: number) => void;
  onCancelAll: () => void;
  onAnalyzeClick?: () => void;
}

const MAX_FILES = 5;

export default function FileUploadSection({
  isBlocked = false,
  uploadedFiles,
  onFileAdd,
  onRemoveFile,
  onCancelAll,
  onAnalyzeClick
}: FileUploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const getFileFormat = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return ext === 'csv' ? 'CSV' : ext === 'xls' ? 'XLS' : 'XLSX';
  };

  const isValidFileType = (filePath: string): boolean => {
    const name = filePath.toLowerCase();
    return name.endsWith('.csv') || name.endsWith('.xls') || name.endsWith('.xlsx');
  };

  const handleFilePath = async (filePaths: string[] | string) => {
    if (isBlocked || processing) return;

    const paths = Array.isArray(filePaths) ? filePaths : [filePaths];

    if (uploadedFiles.length + paths.length > MAX_FILES) {
      setFileError(`Можно загрузить не более ${MAX_FILES} файлов`);
      return;
    }

    setProcessing(true);
    setFileError(null);

    try {
      for (const filePath of paths) {
        const fileName = filePath.split('/').pop() || 'файл';

        if (uploadedFiles.some((f) => f.name === fileName)) {
          setFileError(`Файл "${fileName}" уже загружен`);
          continue;
        }

        if (!isValidFileType(filePath)) {
          throw new Error('Поддерживаются только файлы .csv, .xls, .xlsx');
        }

        let data: RowData[];
        if (filePath.toLowerCase().endsWith('.csv')) {
          const content = await readTextFile(filePath);
          const file = new File([content], fileName, { type: 'text/csv' });
          const { parseCSV } = await import('../../utils/fileParsers');
          data = await parseCSV(file);
        } else {
          const uint8Array = await readFile(filePath);
          const file = new File([uint8Array], fileName, {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });
          const { parseExcel } = await import('../../utils/fileParsers');
          data = await parseExcel(file);
        }

        const requiredFields: (keyof RowData)[] = ['nomenclature', 'date', 'income', 'expense', 'stock'];
        for (const row of data) {
          for (const field of requiredFields) {
            if (row[field] === undefined || row[field] === null) {
              throw new Error(`Файл некорректен: отсутствует поле "${field}"`);
            }
          }
        }

        onFileAdd({
          name: fileName,
          format: getFileFormat(fileName),
          data
        });
      }
    } catch (err: any) {
      const message = err?.message || 'Неизвестная ошибка при обработке файла';
      setFileError(message);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    const unlisten = getCurrentWindow().onDragDropEvent(async (event) => {
      if (isBlocked || processing) return;

      switch (event.payload.type) {
        case 'enter':
          setIsDragging(true);
          break;
        case 'leave':
          setIsDragging(false);
          break;
        case 'drop':
          setIsDragging(false);
          const paths = event.payload.paths;
          if (paths?.length) {
            await handleFilePath(paths);
          }
          break;
      }
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, [isBlocked, processing, uploadedFiles]);

  const handleSelectClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isBlocked || processing) return;

    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        multiple: true,
        filters: [{ name: 'Supported Files', extensions: ['csv', 'xls', 'xlsx'] }]
      });

      if (selected) {
        const paths = Array.isArray(selected) ? selected : [selected];
        await handleFilePath(paths);
      }
    } catch {
      setFileError('Ошибка выбора файла.');
    }
  };

  return (
    <div className="file-upload-section">
      <div
        className={`upload-field ${isDragging ? 'upload-field--drag-over' : ''} ${
          isBlocked ? 'upload-field--disabled' : ''
        } ${processing ? 'upload-field--processing' : ''}`}
      >
        {isBlocked && (
          <div className="upload-field__blocked-overlay">
            <p className="upload-field__blocked-text">Обновите приложение для продолжения работы</p>
          </div>
        )}

        {uploadedFiles.length > 0 && (
          <>
            <div className="uploaded-files-list">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="uploaded-file-card">
                  <div className="uploaded-file-card__name" title={file.name}>
                    {file.name}
                  </div>
                  <div className={`uploaded-file-card__format uploaded-file-card__format--${file.format.toLowerCase()}`}>
                    {file.format}
                  </div>
                  <button
                    className="uploaded-file-card__remove-button"
                    onClick={() => onRemoveFile(index)}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.5 4.99999H4.16667M4.16667 4.99999H17.5M4.16667 4.99999L4.16667 16.6667C4.16667 17.1087 4.34226 17.5326 4.65482 17.8452C4.96738 18.1577 5.39131 18.3333 5.83333 18.3333H14.1667C14.6087 18.3333 15.0326 18.1577 15.3452 17.8452C15.6577 17.5326 15.8333 17.1087 15.8333 16.6667V4.99999M6.66667 4.99999V3.33332C6.66667 2.8913 6.84226 2.46737 7.15482 2.15481C7.46738 1.84225 7.89131 1.66666 8.33333 1.66666H11.6667C12.1087 1.66666 12.5326 1.84225 12.8452 2.15481C13.1577 2.46737 13.3333 2.8913 13.3333 3.33332V4.99999" stroke="#1E1E1E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="upload-field__buttons">
              <button
                type="button"
                className="upload-field__select-button"
                onClick={handleSelectClick}
                disabled={isBlocked || processing || uploadedFiles.length >= MAX_FILES}
              >
                Выбрать файл
              </button>
              <button
                type="button"
                className="upload-field__analyze-button"
                onClick={onAnalyzeClick}
                disabled={!onAnalyzeClick || uploadedFiles.length === 0 || processing || isBlocked}
              >
                Анализ
              </button>
              <button
                type="button"
                className="upload-field__cancel-button"
                onClick={onCancelAll}
                disabled={uploadedFiles.length === 0 || processing}
              >
                Отмена
              </button>
            </div>
          </>
        )}

        {!uploadedFiles.length && processing && (
          <>
            <svg
              width="60"
              height="60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="16 16 12 12 8 16"></polyline>
              <line x1="12" y1="12" x2="12" y2="21"></line>
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"></path>
            </svg>
            <div className="upload-field__loading-state">
              <div className="upload-field__spinner"></div>
              <div className="upload-field__loading-text">Загрузка файла...</div>
            </div>
          </>
        )}

        {!uploadedFiles.length && !processing && (
          <>
            <svg
              width="60"
              height="60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="16 16 12 12 8 16"></polyline>
              <line x1="12" y1="12" x2="12" y2="21"></line>
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"></path>
            </svg>
            <div className="upload-field__bottom-content">
              <div className="upload-field__description">
                <div className="upload-field__instruction">Перетащите файл сюда</div>
                <div className="upload-field__formats">CSV / XLS / XLSX</div>
              </div>
              <button
                type="button"
                className="upload-field__select-button"
                onClick={handleSelectClick}
                disabled={isBlocked || uploadedFiles.length >= MAX_FILES}
              >
                Выбрать файл
              </button>
            </div>
          </>
        )}

        {fileError && <div className="file-error-message">{fileError}</div>}
      </div>
    </div>
  );
}