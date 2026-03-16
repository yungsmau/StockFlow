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

export default function HistoryTable({
  items,
  isEditMode,
  selectedIds,
  onRowDoubleClick,
  onToggleSelectAll,
  onToggleSelectItem
}: HistoryTableProps) {
  return (
    <div className="history-table-container">
      <div className="history-table-wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th>Дата обработки</th>
              <th className="history-table__header-nomenclature">Номенклатура</th>
              <th>Поставка, ед.</th>
              <th>Порог, ед.</th>
              <th>Цена, руб./ед.</th>
              <th>Срок поставки, дни</th>
              <th>Ср. дневной остаток, ед.</th>
              <th>Ср. днейвной остаток, руб.</th>
              <th>Эффективность, %</th>
              <th>Эффективность, руб.</th>
              
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
            {items.map(item => (
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