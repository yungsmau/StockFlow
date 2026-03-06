import './FileUploadField.css';

interface FileItem {
  name: string;
  format: string;
  isReference?: boolean;
}

interface FileListProps {
  files: FileItem[];
  onRemove: (index: number, isReference: boolean) => void;
  onFileSelect: () => void;
  onAnalyzeClick?: () => void;
  onCancelAll: () => void;
  isBlocked: boolean;
  processing: boolean;
  maxFilesReached: boolean;
  hasDataFiles: boolean;
}

export default function FileList({
  files,
  onRemove,
  onFileSelect,
  onAnalyzeClick,
  onCancelAll,
  isBlocked,
  processing,
  maxFilesReached,
  hasDataFiles
}: FileListProps) {
  const dataFiles = files.filter(f => !f.isReference);
  const referenceFiles = files.filter(f => f.isReference);

  return (
    <>
      <div className="uploaded-files-list">
        {dataFiles.map((file, index) => (
          <FileCard
            key={`data-${index}`}
            file={file}
            onRemove={() => onRemove(index, false)}
          />
        ))}
        
        {referenceFiles.map((file, index) => (
          <FileCard
            key={`ref-${index}`}
            file={{ ...file, isReference: true }}
            onRemove={() => onRemove(index, true)}
          />
        ))}
      </div>

      <div className="upload-field__buttons">
        <button
          type="button"
          className="upload-field__select-button"
          onClick={onFileSelect}
          disabled={isBlocked || processing || maxFilesReached}
        >
          Выбрать файл
        </button>
        <button
          type="button"
          className="upload-field__analyze-button"
          onClick={onAnalyzeClick}
          disabled={!onAnalyzeClick || !hasDataFiles || processing || isBlocked}
        >
          Анализ
        </button>
        <button
          type="button"
          className="upload-field__cancel-button"
          onClick={onCancelAll}
          disabled={files.length === 0 || processing}
        >
          Отмена
        </button>
      </div>
    </>
  );
}

interface FileCardProps {
  file: FileItem;
  onRemove: () => void;
}

function FileCard({ file, onRemove }: FileCardProps) {
  return (
    <div className={`uploaded-file-card ${file.isReference ? 'uploaded-file-card--reference' : ''}`}>
      <div className="uploaded-file-card__name" title={file.name}>
        {file.name}
      </div>
      <div className={`uploaded-file-card__format uploaded-file-card__format--${file.format.toLowerCase()}`}>
        {file.format}
      </div>
      <button
        className="uploaded-file-card__remove-button"
        onClick={onRemove}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.5 4.99999H4.16667M4.16667 4.99999H17.5M4.16667 4.99999L4.16667 16.6667C4.16667 17.1087 4.34226 17.5326 4.65482 17.8452C4.96738 18.1577 5.39131 18.3333 5.83333 18.3333H14.1667C14.6087 18.3333 15.0326 18.1577 15.3452 17.8452C15.6577 17.5326 15.8333 17.1087 15.8333 16.6667V4.99999M6.66667 4.99999V3.33332C6.66667 2.8913 6.84226 2.46737 7.15482 2.15481C7.46738 1.84225 7.89131 1.66666 8.33333 1.66666H11.6667C12.1087 1.66666 12.5326 1.84225 12.8452 2.15481C13.1577 2.46737 13.3333 2.8913 13.3333 3.33332V4.99999" stroke="#1E1E1E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}