import { useEffect, useState } from 'react';
import './HistoryView.css';
import { formatNumber, formatCurrency } from '../../utils/formatNumber';
import { loadHistoryItems, clearHistory, type ExportHistoryItem } from '../../utils/historyService';

export default function HistoryView() {
  const [items, setItems] = useState<ExportHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Загружаем через сервис
        const historyItems = await loadHistoryItems();
        setItems(historyItems);
      } catch (err) {
        console.error('Failed to load history:', err);
        setError('Не удалось загрузить историю обработки');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      let isoString = dateString;
      if (dateString.includes(' ') && !dateString.includes('T')) {
        isoString = dateString.replace(' ', 'T') + 'Z';
      } else if (!dateString.endsWith('Z') && !dateString.includes('+')) {
        isoString = dateString + 'Z';
      }
      return new Date(isoString).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.warn('Failed to format date:', dateString, e);
      return dateString;
    }
  };

  const getEfficiencyClass = (value: number): string => {
    if (value > 0) return 'efficiency-positive';
    if (value < 0) return 'efficiency-negative';
    return 'efficiency-neutral';
  };

  const handleClearClick = () => {
    setIsConfirmOpen(true);
  };

  const handleCancelClear = () => {
    setIsConfirmOpen(false);
  };

  const handleConfirmClear = async () => {
    if (isClearing) return;
    
    setIsClearing(true);
    setIsConfirmOpen(false);

    try {
      // Очищаем через сервис
      await clearHistory();
      setItems([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
      alert('Не удалось очистить историю');
    } finally {
      setIsClearing(false);
    }
  };

  if (loading) {
    return <div className="history-view">Загрузка истории...</div>;
  }

  if (error) {
    return <div className="history-view error">{error}</div>;
  }

  return (
    <div className="history-view">
      <div className="history-header">
        <h2>История обработки</h2>
        <p>Сохранённые результаты анализа номенклатур</p>
      </div>

      {items.length === 0 ? (
        <div className="history-empty">
          <p>Нет записей в истории обработки</p>
          <p>Обработайте номенклатуру и нажмите "Добавить в экспорт", чтобы сохранить запись.</p>
        </div>
      ) : (
        <>
          <div className="history-table-container">
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Дата обработки</th>
                    <th>Номенклатура</th>
                    <th>Поставка</th>
                    <th>Порог</th>
                    <th>Дней доставки</th>
                    <th>Цена</th>
                    <th>Эффективность</th>
                    <th>Средний остаток (модель)</th>
                    <th>Средний остаток (факт)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td>{formatDate(item.processedAt)}</td>
                      <td>{item.product}</td>
                      <td>{formatNumber(item.initialStock)}</td>
                      <td>{formatNumber(item.threshold)}</td>
                      <td>{formatNumber(item.deliveryDays)}</td>
                      <td>{formatCurrency(item.unitCost)}</td>
                      <td>
                        <span className={getEfficiencyClass(item.efficiency)}>
                          {item.efficiency.toFixed(1)}%
                        </span>
                      </td>
                      <td>{formatNumber(Math.round(item.avgStock))}</td>
                      <td>{formatNumber(Math.round(item.actualAvgStock))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="history-actions">
            <button 
              className="clear-history-btn"
              onClick={handleClearClick}
              disabled={isClearing}
            >
              {isClearing ? 'Очистка...' : 'Очистить историю'}
            </button>
          </div>
        </>
      )}

      {/* Модальное окно подтверждения */}
      {isConfirmOpen && (
        <div className="history-confirm-overlay" onClick={handleCancelClear}>
          <div className="history-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Подтвердите очистку</h3>
            <p>Вы уверены, что хотите удалить всю историю обработки? Это действие нельзя отменить.</p>
            <div className="history-confirm-buttons">
              <button 
                className="history-confirm-cancel" 
                onClick={handleCancelClear}
                disabled={isClearing}
              >
                Отмена
              </button>
              <button 
                className="history-confirm-confirm" 
                onClick={handleConfirmClear}
                disabled={isClearing}
              >
                {isClearing ? 'Очистка...' : 'Удалить всё'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}