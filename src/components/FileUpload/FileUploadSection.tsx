import { useState, useEffect } from 'react';
import { readTextFile, readFile } from '@tauri-apps/plugin-fs';

import UploadArea from './UploadArea';
import FileList from './FileList';
import UploadPlaceholder from './UploadPlaceholder';

import './FileUploadButtons.css';
import './FileUploadField.css';

interface RowData {
  nomenclature: string;
  date: string;
  income: number;
  expense: number;
  stock: number;
}

interface ReferenceItem {
  deliveryDays?: number;
  unitCost?: number;
  optimalOrder?: number;
}

interface FileUploadSectionProps {
  isBlocked?: boolean;
  uploadedFiles: { name: string; format: string }[];
  uploadedReferenceFiles: { name: string; format: string }[];
  onFileAdd: (file: { name: string; format: string; data: RowData[] }) => void;
  onReferenceDataAdd: (
    data: Map<string, ReferenceItem>,
    fileName: string,
    format: string
  ) => void;
  onRemoveFile: (index: number) => void;
  onRemoveReferenceFile: (index: number) => void;
  onCancelAll: () => void;
  onAnalyzeClick?: () => void;
}

const MAX_FILES = 5;

const isReferenceFile = (fileName: string): boolean => {
  const lowerName = fileName.toLowerCase();
  return lowerName.includes('справочник') || 
         lowerName.includes('reference');
};

export default function FileUploadSection({
  isBlocked = false,
  uploadedFiles,
  uploadedReferenceFiles,
  onFileAdd,
  onReferenceDataAdd,
  onRemoveFile,
  onRemoveReferenceFile,
  onCancelAll,
  onAnalyzeClick
}: FileUploadSectionProps) {
  const [processing, setProcessing] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  
  // Сохраняем предыдущее количество файлов для сравнения
  const [prevFilesCount, setPrevFilesCount] = useState(0);

  // Сбрасываем ошибку ТОЛЬКО при реальном изменении количества файлов
  useEffect(() => {
    const currentCount = uploadedFiles.length + uploadedReferenceFiles.length;
    
    // Если количество файлов изменилось (добавление/удаление)
    if (currentCount !== prevFilesCount && fileError) {
      setFileError(null);
      setPrevFilesCount(currentCount);
    }
    
    // Инициализация
    if (prevFilesCount === 0) {
      setPrevFilesCount(currentCount);
    }
  }, [uploadedFiles, uploadedReferenceFiles, fileError, prevFilesCount]);

  const getFileFormat = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return ext === 'csv' ? 'CSV' : ext === 'xls' ? 'XLS' : 'XLSX';
  };

  const isValidFileType = (filePath: string): boolean => {
    const name = filePath.toLowerCase();
    return name.endsWith('.csv') || name.endsWith('.xls') || name.endsWith('.xlsx');
  };

  const handleFilePath = async (filePaths: string[]) => {
    if (isBlocked || processing) return;

    // НЕ сбрасываем ошибку здесь — пусть показывается

    if (uploadedFiles.length + uploadedReferenceFiles.length + filePaths.length > MAX_FILES) {
      setFileError(`Можно загрузить не более ${MAX_FILES} файлов`);
      return;
    }

    setProcessing(true);

    try {
      for (const filePath of filePaths) {
        const fileName = filePath.split('/').pop() || 'файл';

        // Проверяем, загружен ли файл уже
        if (uploadedFiles.some((f) => f.name === fileName) || 
            uploadedReferenceFiles.some((f) => f.name === fileName)) {
          setFileError(`Файл "${fileName}" уже загружен`);
          continue;
        }

        if (!isValidFileType(filePath)) {
          throw new Error('Поддерживаются только файлы .csv, .xls, .xlsx');
        }

        if (isReferenceFile(fileName)) {
          let referenceData: Map<string, ReferenceItem>;
          if (filePath.toLowerCase().endsWith('.csv')) {
            const content = await readTextFile(filePath);
            const file = new File([content], fileName, { type: 'text/csv' });
            const { parseReferenceCSV } = await import('../../utils/fileParsers');
            referenceData = await parseReferenceCSV(file);
          } else {
            const uint8Array = await readFile(filePath);
            const file = new File([uint8Array], fileName, {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const { parseReferenceExcel } = await import('../../utils/fileParsers');
            referenceData = await parseReferenceExcel(file);
          }
          
          // ← ИЗМЕНЕНО: передаём имя и формат файла
          onReferenceDataAdd(referenceData, fileName, getFileFormat(fileName));
        } else {
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
      }
    } catch (err: any) {
      const message = err?.message || 'Неизвестная ошибка при обработке файла';
      setFileError(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleSelectClick = async () => {
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

  const handleRemove = (index: number, isReference: boolean) => {
    if (isReference) {
      onRemoveReferenceFile(index);
    } else {
      onRemoveFile(index);
    }
  };

  const allFiles = [
    ...uploadedFiles.map(f => ({ ...f, isReference: false })),
    ...uploadedReferenceFiles.map(f => ({ ...f, isReference: true }))
  ];

  const maxFilesReached = allFiles.length >= MAX_FILES;
  const hasDataFiles = uploadedFiles.length > 0;

  return (
    <div className="file-upload-section">
      <UploadArea
        isBlocked={isBlocked}
        processing={processing}
        onFileDrop={handleFilePath}
      >
        {/* Лоадер показывается ВСЕГДА при processing */}
        {processing && (
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
        
        {/* Основной контент */}
        {!processing && (
          <>
            {/* FileList показывается ВСЕГДА — блоки "Справочник/Данные" всегда видны */}
            <FileList
              files={allFiles}
              onRemove={handleRemove}
              onFileSelect={handleSelectClick}
              onAnalyzeClick={onAnalyzeClick}
              onCancelAll={onCancelAll}
              isBlocked={isBlocked}
              processing={processing}
              maxFilesReached={maxFilesReached}
              hasDataFiles={hasDataFiles}
            />
            
            {/* UploadPlaceholder показывается ТОЛЬКО когда нет файлов */}
            {allFiles.length === 0 && (
              <UploadPlaceholder
                isBlocked={isBlocked}
                onFileSelect={handleSelectClick}
                maxFilesReached={maxFilesReached}
              />
            )}
            
            {fileError && <div className="file-error-message">{fileError}</div>}
          </>
        )}
      </UploadArea>
    </div>
  );
}