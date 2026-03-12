import { SingleValue } from 'react-select';
import Select from 'react-select';

interface HistoryActionsProps {
  isEditMode: boolean;
  selectedIdsCount: number;
  onEditClick: () => void;
  onDeleteClick: () => void;
  onExportClick: () => void;
  onCancelClick: () => void;
  filterProduct: string | null;
  onFilterChange: (product: string) => void;
  uniqueProducts: string[];
}

export default function HistoryActions({
  isEditMode,
  selectedIdsCount,
  onEditClick,
  onDeleteClick,
  onExportClick,
  onCancelClick,
  filterProduct,
  onFilterChange,
  uniqueProducts
}: HistoryActionsProps) {
  return (
    <div className="history-header">
      {/* Заголовок */}
      <div className="history-header__title">
        <h2>История обработки</h2>
        <p>Сохранённые результаты моделирования</p>
      </div>

      {/* ПОИСК — ВСЕГДА ВИДЕН */}
      <div className="history-selector">
        <Select
          options={[
            { value: '', label: 'Все номенклатуры' },
            ...uniqueProducts.map(p => ({ value: p, label: p }))
          ]}
          value={
            filterProduct 
              ? { value: filterProduct, label: filterProduct }
              : { value: '', label: 'Все номенклатуры' }
          }
          onChange={(newValue: SingleValue<{ value: string; label: string }>) => {
            onFilterChange(newValue?.value || '');
          }}
          isSearchable={true}
          placeholder="Фильтр по номенклатуре..."
          className="product-search-card"
          classNamePrefix="product-select"
        />
      </div>

      {/* КНОПКИ УПРАВЛЕНИЯ */}
      <div className="history-actions-container">
        {!isEditMode ? (
          <button className="history-edit-btn" onClick={onEditClick}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_59_187)">
                <path
                  d="M9.16663 3.33333H3.33329C2.89127 3.33333 2.46734 3.50893 2.15478 3.82149C1.84222 4.13405 1.66663 4.55797 1.66663 5V16.6667C1.66663 17.1087 1.84222 17.5326 2.15478 17.8452C2.46734 18.1577 2.89127 18.3333 3.33329 18.3333H15C15.442 18.3333 15.8659 18.1577 16.1785 17.8452C16.491 17.5326 16.6666 17.1087 16.6666 16.6667V10.8333M15.4166 2.08333C15.7481 1.75181 16.1978 1.56557 16.6666 1.56557C17.1355 1.56557 17.5851 1.75181 17.9166 2.08333C18.2481 2.41485 18.4344 2.86449 18.4344 3.33333C18.4344 3.80217 18.2481 4.25181 17.9166 4.58333L9.99996 12.5L6.66663 13.3333L7.49996 10L15.4166 2.08333Z"
                  stroke="#1E1E1E"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
              <defs>
                <clipPath id="clip0_59_187">
                  <rect width="20" height="20" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </button>
        ) : (
          <div className="history-edit-actions">
            <button 
              className="history-action-btn history-delete-btn"
              onClick={onDeleteClick}
              disabled={selectedIdsCount === 0}
            >
              Удалить ({selectedIdsCount})
            </button>
            <button 
              className="history-action-btn history-export-btn"
              onClick={onExportClick}
              disabled={selectedIdsCount === 0}
            >
              Экспорт
            </button>
            <button 
              className="history-action-btn history-cancel-btn"
              onClick={onCancelClick}
            >
              Отмена
            </button>
          </div>
        )}
      </div>
    </div>
  );
}