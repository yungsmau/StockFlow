interface UsageGuideProps {
  onDownloadExample: () => void;
}

export default function UsageGuide({ onDownloadExample }: UsageGuideProps) {
  return (
    <>
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
      <button className="help-modal__download-btn" onClick={onDownloadExample}>
        Пример
      </button>
    </>
  );
}