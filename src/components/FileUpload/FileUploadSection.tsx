import { useState, useEffect } from 'react';
import { readTextFile, readFile } from '@tauri-apps/plugin-fs';

import UploadArea from './UploadArea';
import FileList from './FileList';
import UploadPlaceholder from './UploadPlaceholder';

import './FileUploadButtons.css';
import './FileUploadField.css';

import type { RowData, ReferenceItem, HistoryItem } from '../../utils/fileParsers';
import {
  parseCSV,
  parseExcel,
  parseReferenceCSV,
  parseReferenceExcel,
  parseHistoryCSV,
  parseHistoryExcel,
  detectFileType,
} from '../../utils/fileParsers';

interface FileUploadSectionProps {
  isBlocked?: boolean;
  uploadedFiles: { name: string; format: string }[];
  uploadedReferenceFiles: { name: string; format: string }[];
  uploadedHistoryFiles: { name: string; format: string }[];
  onFileAdd: (file: { name: string; format: string; data: RowData[] }) => void;
  onReferenceDataAdd: (
    data: Map<string, ReferenceItem>,
    fileName: string,
    format: string
  ) => void;
  onHistoryDataAdd: (data: HistoryItem[], fileName: string, format: string) => void;
  onRemoveFile: (index: number) => void;
  onRemoveReferenceFile: (index: number) => void;
  onRemoveHistoryFile: (index: number) => void;
  onCancelAll: () => void;
  onAnalyzeClick?: () => void;
}

const MAX_FILES = 5;

export default function FileUploadSection({
  isBlocked = false,
  uploadedFiles,
  uploadedReferenceFiles,
  uploadedHistoryFiles,
  onFileAdd,
  onReferenceDataAdd,
  onHistoryDataAdd,
  onRemoveFile,
  onRemoveReferenceFile,
  onRemoveHistoryFile,
  onCancelAll,
  onAnalyzeClick
}: FileUploadSectionProps) {
  const [processing, setProcessing] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  
  const [prevFilesCount, setPrevFilesCount] = useState(0);

  useEffect(() => {
    const currentCount = uploadedFiles.length + uploadedReferenceFiles.length + uploadedHistoryFiles.length;
    
    if (currentCount !== prevFilesCount && fileError) {
      setFileError(null);
      setPrevFilesCount(currentCount);
    }
    
    if (prevFilesCount === 0) {
      setPrevFilesCount(currentCount);
    }
  }, [uploadedFiles, uploadedReferenceFiles, uploadedHistoryFiles, fileError, prevFilesCount]);

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

    const totalFiles = uploadedFiles.length + uploadedReferenceFiles.length + uploadedHistoryFiles.length;
    if (totalFiles + filePaths.length > MAX_FILES) {
      setFileError(`Можно загрузить не более ${MAX_FILES} файлов`);
      return;
    }

    setProcessing(true);

    try {
      for (const filePath of filePaths) {
        const fileName = filePath.split('/').pop() || 'файл';
        const fileType = detectFileType(fileName);

        const allFileNames = [...uploadedFiles, ...uploadedReferenceFiles, ...uploadedHistoryFiles].map(f => f.name);
        if (allFileNames.includes(fileName)) {
          setFileError(`Файл "${fileName}" уже загружен`);
          continue;
        }

        if (!isValidFileType(filePath)) {
          throw new Error('Поддерживаются только файлы .csv, .xls, .xlsx');
        }

        if (fileType === 'history') {
          let historyData: HistoryItem[];
          
          if (filePath.toLowerCase().endsWith('.csv')) {
            const content = await readTextFile(filePath);
            const file = new File([content], fileName, { type: 'text/csv' });
            historyData = await parseHistoryCSV(file);
          } else {
            const uint8Array = await readFile(filePath);
            const file = new File([uint8Array], fileName, {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            historyData = await parseHistoryExcel(file);
          }
          
          onHistoryDataAdd(historyData, fileName, getFileFormat(fileName));
          
        } else if (fileType === 'reference') {
          let referenceData: Map<string, ReferenceItem>;
          
          if (filePath.toLowerCase().endsWith('.csv')) {
            const content = await readTextFile(filePath);
            const file = new File([content], fileName, { type: 'text/csv' });
            referenceData = await parseReferenceCSV(file);
          } else {
            const uint8Array = await readFile(filePath);
            const file = new File([uint8Array], fileName, {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            referenceData = await parseReferenceExcel(file);
          }
          
          onReferenceDataAdd(referenceData, fileName, getFileFormat(fileName));
          
        } else {
          let data: RowData[];
          
          if (filePath.toLowerCase().endsWith('.csv')) {
            const content = await readTextFile(filePath);
            const file = new File([content], fileName, { type: 'text/csv' });
            data = await parseCSV(file);
          } else {
            const uint8Array = await readFile(filePath);
            const file = new File([uint8Array], fileName, {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
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

  const handleRemove = (index: number, isReference: boolean, isHistory?: boolean) => {
    if (isHistory) {
      onRemoveHistoryFile(index);
    } else if (isReference) {
      onRemoveReferenceFile(index);
    } else {
      onRemoveFile(index);
    }
  };

  const allFiles = [
    ...uploadedFiles.map(f => ({ ...f, isReference: false, isHistory: false })),
    ...uploadedReferenceFiles.map(f => ({ ...f, isReference: true, isHistory: false })),
    ...uploadedHistoryFiles.map(f => ({ ...f, isReference: false, isHistory: true })),
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
        
        {!processing && (
          <>
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