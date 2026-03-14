import { useEffect, useState, useMemo } from 'react';
import './HistoryView.css';
import { 
  loadHistoryItems, 
  deleteHistoryItemById,
  type ExportHistoryItem 
} from '../../utils/historyService';

import type { HistoryItem } from '../../utils/fileParsers';

import HistoryTable from './HistoryTable';
import HistoryActions from './HistoryActions';
import HistoryDeleteModal from './HistoryDeleteModal';
import HistoryExportModal from './HistoryExportModal';

interface HistoryViewProps {
  onNavigateToAnalysis?: (product: string, params: {
    initialStock: number;
    threshold: number;
    deliveryDays: number;
    unitCost: number;
  }) => void;
  externalHistory?: HistoryItem[];
}

function mapExternalToExportItem(item: HistoryItem, index: number): ExportHistoryItem {
  return {
    id: -1000 - index,
    processedAt: item.processedAt,
    product: item.nomenclature,
    initialStock: item.supply,
    threshold: item.threshold,
    unitCost: item.unitCost,
    deliveryDays: item.deliveryDays,
    avgStock: item.avgStockUnits,
    actualAvgStock: item.avgStockUnits, 
    stockValue: item.avgStockRub,
    efficiency: item.efficiencyPercent,
    efficiencyAbs: item.efficiencyRub,
  };
}

export default function HistoryView({ 
  onNavigateToAnalysis, 
  externalHistory = [] 
}: HistoryViewProps) {
  const [items, setItems] = useState<ExportHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [filterProduct, setFilterProduct] = useState<string>('');

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

  const uniqueProducts = useMemo(() => {
    const local = items.map(item => item.product);
    const external = externalHistory.map(item => item.nomenclature);
    return [...new Set([...local, ...external])].sort();
  }, [items, externalHistory]);

  const filteredItems = useMemo(() => {
    if (!filterProduct) return items;
    return items.filter(item => item.product === filterProduct);
  }, [items, filterProduct]);

  const mappedExternalHistory = useMemo(() => {
    const filtered = filterProduct 
      ? externalHistory.filter(item => item.nomenclature === filterProduct)
      : externalHistory;
    
    return filtered.map((item, idx) => mapExternalToExportItem(item, idx));
  }, [externalHistory, filterProduct]);

  const toggleSelectItem = (id: number) => {
    if (id < 0) return;
    
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(item => item.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size > 0) setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setIsClearing(true);
    setIsDeleteConfirmOpen(false);
    try {
      const idsToDelete = Array.from(selectedIds);
      for (const id of idsToDelete) {
        await deleteHistoryItemById(id);
      }
      setItems(prev => prev.filter(item => !selectedIds.has(item.id)));
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Failed to delete selected items:', err);
      alert('Не удалось удалить выбранные записи');
    } finally {
      setIsClearing(false);
    }
  };

  const handleExportSelected = () => {
    if (selectedIds.size > 0) setIsExportModalOpen(true);
  };

  const handleRowDoubleClick = (item: ExportHistoryItem) => {
    if (onNavigateToAnalysis) {
      onNavigateToAnalysis(item.product, {
        initialStock: item.initialStock,
        threshold: item.threshold,
        deliveryDays: item.deliveryDays,
        unitCost: item.unitCost
      });
    }
  };

  if (loading) {
    return <div className="history-view">Загрузка истории...</div>;
  }

  if (error) {
    return <div className="history-view error">{error}</div>;
  }

  const selectedItems = filteredItems.filter(item => selectedIds.has(item.id));
  const hasExternalHistory = mappedExternalHistory.length > 0;

  return (
    <div className="history-view">
      {/* === ЛОКАЛЬНАЯ ИСТОРИЯ === */}
      <section className="history-section">
        <HistoryActions
          isEditMode={isEditMode}
          selectedIdsCount={selectedIds.size}
          onEditClick={() => setIsEditMode(true)}
          onDeleteClick={handleDeleteSelected}
          onExportClick={handleExportSelected}
          onCancelClick={() => {
            setIsEditMode(false);
            setSelectedIds(new Set());
          }}
          filterProduct={filterProduct}
          onFilterChange={setFilterProduct}
          uniqueProducts={uniqueProducts}
        />

        {items.length === 0 && !hasExternalHistory ? (
          <div className="history-empty">
            <p>Нет записей в истории обработки</p>
            <p>Обработайте номенклатуру и нажмите "Сохранить", чтобы сохранить запись.</p>
          </div>
        ) : (
          <HistoryTable
            items={filteredItems}
            isEditMode={isEditMode}
            selectedIds={selectedIds}
            onRowDoubleClick={handleRowDoubleClick}
            onToggleSelectAll={toggleSelectAll}
            onToggleSelectItem={toggleSelectItem}
          />
        )}
      </section>

      {/* === ВНЕШНЯЯ ИСТОРИЯ — только если есть данные === */}
      {hasExternalHistory && (
        <section className="history-section history-section--external">
          <HistoryTable
            items={mappedExternalHistory}
            isEditMode={false} 
            selectedIds={new Set()}
            onRowDoubleClick={handleRowDoubleClick}
            onToggleSelectAll={() => {}} 
            onToggleSelectItem={() => {}}
          />
        </section>
      )}

      {/* === Модальные окна (только для локальной истории) === */}
      <HistoryDeleteModal
        isOpen={isDeleteConfirmOpen}
        selectedIdsCount={selectedIds.size}
        isClearing={isClearing}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDeleteSelected}
      />

      <HistoryExportModal
        isOpen={isExportModalOpen}
        selectedItems={selectedItems}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}