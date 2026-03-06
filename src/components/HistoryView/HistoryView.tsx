import { useEffect, useState } from 'react';
import './HistoryView.css';
import { formatNumber, formatCurrency } from '../../utils/formatNumber';
import { loadHistoryItems, clearHistory, type ExportHistoryItem } from '../../utils/historyService';

interface HistoryViewProps {
  onNavigateToAnalysis?: (product: string, params: {
    initialStock: number;
    threshold: number;
    deliveryDays: number;
    unitCost: number;
  }) => void;
}

export default function HistoryView({ onNavigateToAnalysis }: HistoryViewProps) {
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

  const handleRowClick = (item: ExportHistoryItem) => {
    if (onNavigateToAnalysis) {
      onNavigateToAnalysis(item.product, {
        initialStock: item.initialStock,
        threshold: item.threshold,
        deliveryDays: item.deliveryDays,
        unitCost: item.unitCost
      });
    }
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
                    <th>Поставка, ед.</th>
                    <th>Порог, ед.</th>
                    <th>Цена, руб./ед.</th>
                    <th>Срок поставки, дни</th>
                    <th>Ср. днейвной остаток, ед.</th>
                    <th>Стоимость остатка, руб.</th>
                    <th>Эффективность, %</th>
                    <th>Эффективность, руб.</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr 
                      key={item.id}
                      onClick={() => handleRowClick(item)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{formatDate(item.processedAt)}</td>
                      <td>{item.product}</td>
                      <td>{formatNumber(item.initialStock)}</td>
                      <td>{formatNumber(item.threshold)}</td>
                      <td>{formatCurrency(item.unitCost)}</td>
                      <td>{formatNumber(item.deliveryDays)}</td>
                      <td>{formatNumber(Math.round(item.avgStock))}</td>
                      <td>{item.stockValue !== undefined ? formatCurrency(item.stockValue) : '-'}</td>
                      <td>
                        <span className={getEfficiencyClass(item.efficiency)}>
                          {item.efficiency.toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <span className={getEfficiencyClass(item.efficiency)}>
                          {item.efficiencyAbs !== undefined ? formatCurrency(item.efficiencyAbs) : '-'}
                        </span> 
                      </td>
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

      {isConfirmOpen && (
        <div className="history-confirm-overlay" onClick={handleCancelClear}>
          <div className="history-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Подтвердите очистку</h3>
            <p>
              <span>Вы уверены, что хотите удалить всю историю обработки?</span>
              <span>Это действие нельзя отменить.</span>
            </p>
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