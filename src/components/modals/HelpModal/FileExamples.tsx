interface FileExamplesProps {
  onDownloadExample: () => void;
  onDownloadReferenceExample: () => void;
  onDownloadPlanExample: () => void;
}

export default function FileExamples({ onDownloadExample, onDownloadReferenceExample, onDownloadPlanExample }: FileExamplesProps) {
  return (
    <>
      <h3 className="help-modal__heading file-download">Пример данных остатков</h3>
      <p className="help-modal__description">Скачайте пример файла для быстрого начала работы:</p>
      <button className="help-modal__download-btn" onClick={onDownloadExample}>
        Данные 
      </button>
      <h3 className="help-modal__heading file-download">Пример справочника</h3>
      <p className="help-modal__description">Скачайте пример файла для быстрого начала работы:</p>
      <button className="help-modal__download-btn" onClick={onDownloadReferenceExample}>
        Справочник 
      </button>
      <h3 className="help-modal__heading file-download">Пример плана</h3>
      <p className="help-modal__description">Скачайте пример файла для быстрого начала работы:</p>
      <button className="help-modal__download-btn" onClick={onDownloadPlanExample}>
        План 
      </button>
    </>
  );
}