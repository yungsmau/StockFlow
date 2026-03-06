import './FileUploadField.css';

interface UploadPlaceholderProps {
  isBlocked: boolean;
  onFileSelect: () => void;
  maxFilesReached: boolean;
}

export default function UploadPlaceholder({ 
  isBlocked, 
  onFileSelect, 
  maxFilesReached 
}: UploadPlaceholderProps) {
  return (
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
          onClick={onFileSelect}
          disabled={isBlocked || maxFilesReached}
        >
          Выбрать файл
        </button>
      </div>
    </>
  );
}