import { useState } from "react";
import "./ErrorDisplay.css"

interface ErrorDetails {
  file?: string;
  row?: number;
  column?: string;
  errorType?: string;
  message: string;
  rawMessage: string;
}

interface ErrorDisplayProps {
  error: ErrorDetails;
  product?: string;
  initialStock?: number;
  threshold?: number;
  deliveryDays?: number;
  unitCost?: number;
  onRetry: () => void;
}

const parseRustError = (rawMessage: string): ErrorDetails => {
  const details: ErrorDetails = { message: rawMessage, rawMessage };
  
  const parts = rawMessage.split(',');
  const dict: Record<string, string> = {};
  
  for (const part of parts) {
    const [key, value] = part.split('=', 2);
    if (key && value) {
      dict[key.trim()] = value.trim();
    }
  }
  
  if (dict['file']) details.file = dict['file'];
  if (dict['row']) details.row = parseInt(dict['row'], 10);
  if (dict['column']) details.column = dict['column'];
  if (dict['type']) details.errorType = dict['type'];
  if (dict['msg']) details.message = dict['msg'];
  
  return details;
};

export default function ErrorDisplay({
  error,
}: ErrorDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const parsedError = error.rawMessage.includes('=') 
    ? parseRustError(error.rawMessage) 
    : error;

  const hasDetails = !!(parsedError.file || parsedError.row || parsedError.column || parsedError.errorType);

  return (
    <div className="analysis-error">
      <div 
        className="error-header clickable" 
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
      >
        <div className="error-header-content">
          <span>Ошибка</span>
        </div>
        {hasDetails && (
          <span className="error-toggle">
            {isExpanded ? '▲' : '▼'}
          </span>
        )}
      </div>
      
      <div className="error-message">{parsedError.message}</div>
      
      {/* Раскрывающиеся детали */}
      {hasDetails && (
        <div className={`error-details ${isExpanded ? 'expanded' : ''}`}>
          <div><span>Детали:</span></div>
          {parsedError.file && <div>Файл: <code>{parsedError.file}</code></div>}
          {parsedError.row !== undefined && <div>Строка: <code>{parsedError.row}</code></div>}
          {parsedError.column && <div>Колонка: <code>{parsedError.column}</code></div>}
          {parsedError.errorType && <div>Тип: <code>{parsedError.errorType}</code></div>}
        </div>
      )}
    </div>
  );
}