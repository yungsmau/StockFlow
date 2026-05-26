import { useState, useEffect } from 'react';
import { formatNumber, formatCurrency } from '../../utils/formatNumber';
import type { ExportHistoryItem } from '../../utils/historyService';

interface HistoryTableProps {
  items: ExportHistoryItem[];
  isEditMode: boolean;
  selectedIds: Set<number>;
  onRowDoubleClick: (item: ExportHistoryItem) => void;
  onToggleSelectAll: () => void;
  onToggleSelectItem: (id: number) => void;
}

type HistorySortField = 'processedAt' | 'product' | 'initialStock' | 'threshold' | 'unitCost' | 'deliveryDays' | 'avgStock' | 'stockValue' | 'efficiency' | 'efficiencyAbs' | null;
type SortDirection = 'asc' | 'desc';

const HISTORY_SORT_STORAGE_KEY = 'historySortPreferences';

interface SortPreferences {
  field: HistorySortField;
  direction: SortDirection;
}

const SortIcon = ({ direction }: { direction: 'asc' | 'desc' | 'none' }) => {
  if (direction === 'none') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="sort-icon">
        <path 
          d="M7 15L12 20L17 15M17 9L12 4L7 9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
        />
      </svg>
    );
  }
  
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="sort-icon">
      <path 
        d={direction === 'asc' ? "M12 19V5M12 5L5 12M12 5L19 12" : "M12 5V19M12 19L5 12M12 19L19 12"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const loadSortPreferences = (): SortPreferences => {
  try {
    const saved = sessionStorage.getItem(HISTORY_SORT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.field && parsed.direction) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Failed to load history sort preferences:', error);
  }
  return { field: 'processedAt', direction: 'desc' };
};

const saveSortPreferences = (field: HistorySortField, direction: SortDirection) => {
  try {
    sessionStorage.setItem(HISTORY_SORT_STORAGE_KEY, JSON.stringify({ field, direction }));
  } catch (error) {
    console.warn('Failed to save history sort preferences:', error);
  }
};

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
    return dateString;
  }
};

const getEfficiencyClass = (value: number): string => {
  if (value > 0) return 'efficiency-positive';
  if (value < 0) return 'efficiency-negative';
  return 'efficiency-neutral';
};

// ✅ НОВОЕ: Компонент бейджа режима
const ModeBadge = ({ enableOverlapping, overlapCount }: { enableOverlapping: boolean; overlapCount: number }) => {
  if (enableOverlapping && overlapCount >= 2) {
    return (
      <span className="mode-badge mode-badge--overlapping" title={`Режим наложения: ${overlapCount} параллельных заказа`}>
        🔄 ×{overlapCount}
      </span>
    );
  }
  return (
    <span className="mode-badge mode-badge--standard" title="Стандартный режим (1 заказ в пути)">
      ✓
    </span>
  );
};

export default function HistoryTable({
  items,
  isEditMode,
  selectedIds,
  onRowDoubleClick,
  onToggleSelectAll,
  onToggleSelectItem
}: HistoryTableProps) {
  const [sortField, setSortField] = useState<HistorySortField>(() => {
    const prefs = loadSortPreferences();
    return prefs.field;
  });
  
  const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
    const prefs = loadSortPreferences();
    return prefs.direction;
  });

  useEffect(() => {
    if (sortField) {
      saveSortPreferences(sortField, sortDirection);
    }
  }, [sortField, sortDirection]);

  const handleSort = (field: HistorySortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];
    
    if (sortField === 'processedAt') {
      aValue = new Date(a.processedAt).getTime();
      bValue = new Date(b.processedAt).getTime();
    }
    
    if (sortField === 'product') {
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      if (sortDirection === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    }
    
    return 0;
  });

  const getHeaderClass = (field: HistorySortField) => {
    const base = 'history-table__header sortable-header';
    return sortField === field ? `${base} sorted` : base;
  };

  const getSortDirection = (field: HistorySortField) => {
    return sortField === field ? sortDirection : 'none';
  };

  return (
    <div className="history-table-container">
      <div className="history-table-wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th 
                onClick={() => handleSort('processedAt')}
                className={getHeaderClass('processedAt')}
              >
                <span>Дата</span>
                <SortIcon direction={getSortDirection('processedAt')} />
              </th>
              <th 
                onClick={() => handleSort('product')}
                className={`${getHeaderClass('product')} history-table__header-nomenclature`}
              >
                <span>Номенклатура</span>
                <SortIcon direction={getSortDirection('product')} />
              </th>
              <th 
                onClick={() => handleSort('initialStock')}
                className={getHeaderClass('initialStock')}
              >
                <span>Поставка</span>
                <SortIcon direction={getSortDirection('initialStock')} />
              </th>
              <th 
                onClick={() => handleSort('threshold')}
                className={getHeaderClass('threshold')}
              >
                <span>Порог</span>
                <SortIcon direction={getSortDirection('threshold')} />
              </th>
              <th 
                onClick={() => handleSort('deliveryDays')}
                className={getHeaderClass('deliveryDays')}
              >
                <span>Срок, дн.</span>
                <SortIcon direction={getSortDirection('deliveryDays')} />
              </th>
              <th 
                onClick={() => handleSort('avgStock')}
                className={getHeaderClass('avgStock')}
              >
                <span>Ср. остаток, ед.</span>
                <SortIcon direction={getSortDirection('avgStock')} />
              </th>
              <th 
                onClick={() => handleSort('stockValue')}
                className={getHeaderClass('stockValue')}
              >
                <span>Ср. остаток, руб.</span>
                <SortIcon direction={getSortDirection('stockValue')} />
              </th>
              <th 
                onClick={() => handleSort('efficiency')}
                className={getHeaderClass('efficiency')}
              >
                <span>Эффективность</span>
                <SortIcon direction={getSortDirection('efficiency')} />
              </th>
              
              {/* ✅ НОВОЕ: Колонка "Режим" */}
              <th className="history-table__header-mode">
                <span>Режим</span>
              </th>
              
              {isEditMode && (
                <th className="history-table__checkbox-header">
                  <input 
                    type="checkbox"
                    checked={selectedIds.size === items.length && items.length > 0}
                    onChange={onToggleSelectAll}
                  />
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedItems.map(item => (
              <tr 
                key={item.id}
                onDoubleClick={() => onRowDoubleClick(item)}
                style={{ cursor: 'pointer' }}
                title="Двойной клик → Анализ"
              >
                <td>{formatDate(item.processedAt)}</td>
                <td className="history-table__header-nomenclature">{item.product}</td>
                <td>{formatNumber(item.initialStock)}</td>
                <td>{formatNumber(item.threshold)}</td>
                <td>{formatNumber(item.deliveryDays)}</td>
                <td>{formatNumber(Math.round(item.avgStock))}</td>
                <td>{item.stockValue !== undefined ? formatCurrency(item.stockValue) : '—'}</td>
                <td>
                  <span className={getEfficiencyClass(item.efficiency)}>
                    {item.efficiency.toFixed(1)}%
                  </span>
                </td>
                
                {/* ✅ НОВОЕ: Ячейка с бейджем режима */}
                <td className="history-table__cell-mode">
                  <ModeBadge enableOverlapping={item.enableOverlapping} overlapCount={item.overlapCount} />
                </td>
                
                {isEditMode && (
                  <td className="history-table__checkbox-cell">
                    <input 
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => onToggleSelectItem(item.id)}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}