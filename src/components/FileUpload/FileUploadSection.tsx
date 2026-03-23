// src/components/FileUpload/FileUploadSection.tsx
import { useState, useEffect, useRef } from 'react';
import { readTextFile, readFile } from '@tauri-apps/plugin-fs';

import UploadArea from './UploadArea';
import SimpleFileList from './SimpleFileList';
import DetailedFileList from './DetailedFileList';
import UploadPlaceholder from './UploadPlaceholder';
import ToggleSwitch from '../UI/ToggleSwitch/ToggleSwitch';

import './FileUploadButtons.css';
import './FileUploadField.css';

// ✅ Импорт типов и парсеров для плана
import type { 
  RowData, 
  ReferenceItem, 
  HistoryItem,
  PlanItem 
} from '../../utils/fileParsers';
import {
  parseCSV,
  parseExcel,
  parseReferenceCSV,
  parseReferenceExcel,
  parseHistoryCSV,
  parseHistoryExcel,
  parsePlanCSV,      // ✅ Новый парсер
  parsePlanExcel,    // ✅ Новый парсер
  detectFileType,
} from '../../utils/fileParsers';

interface ExtendedFileItem {
  name: string;
  format: string;
  isReference?: boolean;
  isHistory?: boolean;
  isPlan?: boolean;  // ✅ Флаг для файлов плана
  originalIndex: number;
}

interface FileUploadSectionProps {
  isBlocked?: boolean;
  uploadedFiles: { name: string; format: string }[];
  uploadedReferenceFiles: { name: string; format: string }[];
  uploadedHistoryFiles: { name: string; format: string }[];
  uploadedPlanFiles?: { name: string; format: string }[]; // ✅ Опционально
  onFileAdd: (file: { name: string; format: string; path: string; data: RowData[] }) => void;
  onReferenceDataAdd: (
    data: Map<string, ReferenceItem>,
    fileName: string,
    format: string
  ) => void;
  onHistoryDataAdd: ( data: HistoryItem[], fileName: string, format: string) => void;
  onPlanDataAdd?: ( data: PlanItem[], fileName: string, format: string) => void; // ✅ Опционально
  onRemoveFile: (index: number) => void;
  onRemoveReferenceFile: (index: number) => void;
  onRemoveHistoryFile: (index: number) => void;
  onRemovePlanFile?: (index: number) => void; // ✅ Опционально
  onCancelAll: () => void;
  onAnalyzeClick?: () => void;
}

const MAX_FILES = 5;
const TOGGLE_STORAGE_KEY = 'uploadViewMode';

export default function FileUploadSection({
  isBlocked = false,
  uploadedFiles,
  uploadedReferenceFiles,
  uploadedHistoryFiles,
  uploadedPlanFiles = [], // ✅ Дефолт: пустой массив
  onFileAdd,
  onReferenceDataAdd,
  onHistoryDataAdd,
  onPlanDataAdd = () => {}, // ✅ Дефолт: пустая функция
  onRemoveFile,
  onRemoveReferenceFile,
  onRemoveHistoryFile,
  onRemovePlanFile = () => {}, // ✅ Дефолт: пустая функция
  onCancelAll,
  onAnalyzeClick
}: FileUploadSectionProps) {
  const [processing, setProcessing] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [prevFilesCount, setPrevFilesCount] = useState(0);
  
  const processingFilesRef = useRef<Set<string>>(new Set());
  const processingStartTimeRef = useRef<number>(0);
  
  const [viewMode, setViewMode] = useState<'simple' | 'detailed'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(TOGGLE_STORAGE_KEY);
      return (saved === 'detailed') ? 'detailed' : 'simple';
    }
    return 'simple';
  });

  useEffect(() => {
    localStorage.setItem(TOGGLE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    // ✅ Учитываем файлы плана в подсчёте
    const currentCount = uploadedFiles.length + uploadedReferenceFiles.length + uploadedHistoryFiles.length + uploadedPlanFiles.length;
    
    if (currentCount !== prevFilesCount && fileError) {
      setFileError(null);
      setPrevFilesCount(currentCount);
    }
    
    if (prevFilesCount === 0) {
      setPrevFilesCount(currentCount);
    }
  }, [uploadedFiles, uploadedReferenceFiles, uploadedHistoryFiles, uploadedPlanFiles, fileError, prevFilesCount]);

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

    // ✅ Учитываем файлы плана в лимите
    const totalFiles = uploadedFiles.length + uploadedReferenceFiles.length + uploadedHistoryFiles.length + uploadedPlanFiles.length;
    if (totalFiles + filePaths.length > MAX_FILES) {
      setFileError(`Можно загрузить не более ${MAX_FILES} файлов`);
      return;
    }

    processingStartTimeRef.current = Date.now();
    setProcessing(true);

    try {
      for (const filePath of filePaths) {
        const fileName = filePath.split('/').pop() || 'файл';
        
        // ✅ Проверяем все типы файлов на дубликаты
        const allFileNames = [
          ...uploadedFiles, 
          ...uploadedReferenceFiles, 
          ...uploadedHistoryFiles,
          ...uploadedPlanFiles
        ].map(f => f.name);
        
        if (allFileNames.includes(fileName)) {
          setFileError(`Файл "${fileName}" уже загружен`);
          continue;
        }

        if (processingFilesRef.current.has(fileName)) {
          continue;
        }
        processingFilesRef.current.add(fileName);

        if (!isValidFileType(filePath)) {
          processingFilesRef.current.delete(fileName);
          throw new Error('Поддерживаются только файлы .csv, .xls, .xlsx');
        }

        try {
          // ✅ Определяем тип файла по имени (как для history/reference)
          const isPlanFile = fileName.toLowerCase().includes('план') || fileName.toLowerCase().includes('plan');
          const isHistoryFile = fileName.toLowerCase().includes('история') || fileName.toLowerCase().includes('history');
          const isReferenceFile = fileName.toLowerCase().includes('справочник') || fileName.toLowerCase().includes('reference');

          if (isPlanFile) {
            // ✅ Обработка файла плана (по аналогии с историей/справочником)
            let planData: PlanItem[];
            if (filePath.toLowerCase().endsWith('.csv')) {
              const content = await readTextFile(filePath);
              const file = new File([content], fileName, { type: 'text/csv' });
              planData = await parsePlanCSV(file);
            } else {
              const uint8Array = await readFile(filePath);
              const file = new File([uint8Array], fileName, {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              });
              planData = await parsePlanExcel(file);
            }
            // ✅ Вызываем колбэк с данными и форматом (как для истории)
            onPlanDataAdd(planData, fileName, getFileFormat(fileName));
            
          } else if (isHistoryFile) {
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
            
          } else if (isReferenceFile) {
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
            // ✅ Обычные файлы данных
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
              path: filePath,
              data
            });
          }
        } finally {
          processingFilesRef.current.delete(fileName);
        }
      }
    } catch (err: any) {
      const message = err?.message || 'Неизвестная ошибка при обработке файла';
      setFileError(message);
      processingFilesRef.current.clear();
    } finally {
      const elapsed = Date.now() - processingStartTimeRef.current;
      const MIN_LOADING_TIME = 150;
      
      if (elapsed < MIN_LOADING_TIME) {
        setTimeout(() => setProcessing(false), MIN_LOADING_TIME - elapsed);
      } else {
        setProcessing(false);
      }
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

  // ✅ Обновлённый handleRemove с поддержкой плана
  const handleRemove = (index: number, isReference: boolean, isHistory?: boolean, isPlan?: boolean) => {
    if (isPlan) {
      onRemovePlanFile?.(index);
    } else if (isHistory) {
      onRemoveHistoryFile(index);
    } else if (isReference) {
      onRemoveReferenceFile(index);
    } else {
      onRemoveFile(index);
    }
  };

  // ✅ allFiles теперь включает файлы плана (с определением по имени)
  const allFiles: ExtendedFileItem[] = [
    ...uploadedFiles.map((f, idx) => ({ 
      ...f, 
      isReference: false, 
      isHistory: false,
      isPlan: false,
      originalIndex: idx 
    })),
    ...uploadedReferenceFiles.map((f, idx) => ({ 
      ...f, 
      isReference: true, 
      isHistory: false,
      isPlan: false,
      originalIndex: idx 
    })),
    ...uploadedHistoryFiles.map((f, idx) => ({ 
      ...f, 
      isReference: false, 
      isHistory: true,
      isPlan: false,
      originalIndex: idx 
    })),
    // ✅ Файлы плана (опционально, если переданы)
    ...uploadedPlanFiles.map((f, idx) => ({ 
      ...f, 
      isReference: false, 
      isHistory: false,
      isPlan: true,
      originalIndex: idx 
    })),
  ];

  const maxFilesReached = allFiles.length >= MAX_FILES;
  const hasDataFiles = uploadedFiles.length > 0;

  return (
    <div className="file-upload-section">
      <div className="view-mode-toggle-wrapper">
        <ToggleSwitch
          enabled={viewMode === 'detailed'}
          onChange={(enabled) => setViewMode(enabled ? 'detailed' : 'simple')}
          title={viewMode === 'detailed' ? 'Подробный режим' : 'Простой режим'}
        />
      </div>

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
            {viewMode === 'simple' ? (
              <SimpleFileList
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
            ) : (
              <DetailedFileList
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
            )}
            
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