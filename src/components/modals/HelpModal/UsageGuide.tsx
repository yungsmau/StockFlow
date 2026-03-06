interface UsageGuideProps {
  onDownloadExample: () => void;
  onDownloadReferenceExample: () => void;
}

export default function UsageGuide({ onDownloadExample, onDownloadReferenceExample }: UsageGuideProps) {
  return (
    <>
      <h3 className="help-modal__heading">Как использовать приложение</h3>
      <ol className="help-modal__instructions">
        <li>
          <p>Загрузите файл, содержащий данные остатков</p>
          <p>Структура файла:</p>
          <p>Номенклатура, Дата, Приход, Расход, Остаток</p>
        </li>
        <li>
          <p>Так же вы можете загрузить файл "Справочник.xlsx"</p>
          <p>Структура файла:</p>
          <p>Номенклатура, Минимальный объем закупа, Оптимальный объем закупа, Цена, Период доставки</p>

        </li>
        <li>В разделе "Анализ" подберите значения объема поставки и порога, используя рекомендованный начальный порог.</li>
        <li>В разделе "Данные" вы можете увидеть данные о номенклатуре.</li>
        <li>После подбора параметров, сохраните их.</li>
        <li>В разделе "Экспорт" вы можете посмотреть и выгрузить подобранные параметры для номенклатуры.</li>
        <li>В разделе "История" вы можете посмотреть историю работы.</li>
      </ol>

      <h3 className="help-modal__heading file-download">Пример данных остатков</h3>
      <p className="help-modal__description">Скачайте пример файла для быстрого начала работы:</p>
      <button className="help-modal__download-btn" onClick={onDownloadExample}>
        Пример
      </button>
      <h3 className="help-modal__heading file-download">Пример справочника</h3>
      <p className="help-modal__description">Скачайте пример файла для быстрого начала работы:</p>
      <button className="help-modal__download-btn" onClick={onDownloadReferenceExample}>
        Пример
      </button>
    </>
  );
}