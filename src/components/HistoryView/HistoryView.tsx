import { useEffect, useState, useMemo } from 'react';
import './HistoryView.css';
import { 
  loadHistoryItems, 
  deleteHistoryItemById,
  type ExportHistoryItem 
} from '../../utils/historyService';

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
}

export default function HistoryView({ onNavigateToAnalysis }: HistoryViewProps) {
  const [items, setItems] = useState<ExportHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [filterProduct, setFilterProduct] = useState<string>(''); // ← ДОБАВЛЕНО

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

  // Уникальные номенклатуры для фильтра
  const uniqueProducts = useMemo(() => {
    return [...new Set(items.map(item => item.product))].sort();
  }, [items]);

  // Отфильтрованные записи
  const filteredItems = useMemo(() => {
    if (!filterProduct) return items;
    return items.filter(item => item.product === filterProduct);
  }, [items, filterProduct]);

  const toggleSelectItem = (id: number) => {
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

  if (loading) {
    return <div className="history-view">Загрузка истории...</div>;
  }

  if (error) {
    return <div className="history-view error">{error}</div>;
  }

  const selectedItems = filteredItems.filter(item => selectedIds.has(item.id));

  return (
    <div className="history-view">
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

      {items.length === 0 ? (
        <div className="history-empty">
          <p>Нет записей в истории обработки</p>
          <p>Обработайте номенклатуру и нажмите "Сохранить", чтобы сохранить запись.</p>
        </div>
      ) : (
        <HistoryTable
          items={filteredItems}
          isEditMode={isEditMode}
          selectedIds={selectedIds}
          onRowDoubleClick={handleRowClick}
          onToggleSelectAll={toggleSelectAll}
          onToggleSelectItem={toggleSelectItem}
        />
      )}

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