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
      <div className="upload-field__bottom-content">
        <div className="upload-field__description">
          <div className="upload-field__instruction">Перетащите файл сюда</div>
          <div className="upload-field__formats">CSV / XLS / XLSX</div>
          <div className="upload-field__instruction">или</div>
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