import { useEffect, useState, useMemo } from 'react';
import './HistoryView.css';
import { 
  loadHistoryItems, 
  deleteHistoryItemById,
  saveHistoryItem,
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
  
  // Локальная история
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  
  // ✅ Внешняя история — режим выбора и выбранные ID
  const [isExternalEditMode, setIsExternalEditMode] = useState(false);
  const [selectedExternalIds, setSelectedExternalIds] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  
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

  // === Локальная история ===
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

  // === Внешняя история ===
  const toggleSelectExternalItem = (id: number) => {
    setSelectedExternalIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleSelectAllExternal = () => {
    if (selectedExternalIds.size === mappedExternalHistory.length) {
      setSelectedExternalIds(new Set());
    } else {
      setSelectedExternalIds(new Set(mappedExternalHistory.map(item => item.id)));
    }
  };

  // ✅ Сохранение выбранных строк в локальную историю (аналогично AnalysisView)
  const handleSaveSelectedToHistory = async () => {
    if (selectedExternalIds.size === 0) return;
    
    setIsSaving(true);
    try {
      const itemsToSave = mappedExternalHistory.filter(item => selectedExternalIds.has(item.id));
      
      for (const item of itemsToSave) {
        // ✅ Вызываем saveHistoryItem с теми же параметрами, что в AnalysisView
        await saveHistoryItem(
          item.product,
          item.initialStock,
          item.threshold,
          item.deliveryDays,
          item.unitCost,
          item.efficiency,
          item.avgStock,
          item.actualAvgStock,
          undefined,
          undefined,
          item.stockValue || 0,
          item.efficiencyAbs || 0
        );
      }
      
      // ✅ Перезагружаем локальную историю
      const historyItems = await loadHistoryItems();
      setItems(historyItems);
      
      // ✅ Сбрасываем выбор
      setSelectedExternalIds(new Set());
      setIsExternalEditMode(false);
      
      console.log(`✅ Сохранено ${itemsToSave.length} записей в историю`);
    } catch (err) {
      console.error('Failed to save selected items:', err);
      alert('Не удалось сохранить выбранные записи');
    } finally {
      setIsSaving(false);
    }
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
  const selectedExternalItems = mappedExternalHistory.filter(item => selectedExternalIds.has(item.id));

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

      {/* === ВНЕШНЯЯ ИСТОРИЯ === */}
      {hasExternalHistory && (
        <section className="history-section history-section--external">
          <div className="history-external-actions">
            {!isExternalEditMode ? (
              <button
                className="history-edit-btn"
                onClick={() => setIsExternalEditMode(true)}
                disabled={isSaving}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 2.50023C18.8978 2.1024 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.1024 21.5 2.50023C21.8978 2.89805 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.1024 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ) : (
              <>
                <button
                  className="history-action-btn history-save-btn"
                  onClick={handleSaveSelectedToHistory}
                  disabled={selectedExternalIds.size === 0 || isSaving}
                >
                  {isSaving ? 'Сохранение...' : `Сохранить в историю`}
                </button>
                <button
                  className="history-action-btn history-cancel-btn"
                  onClick={() => {
                    setIsExternalEditMode(false);
                    setSelectedExternalIds(new Set());
                  }}
                  disabled={isSaving}
                >
                  Отмена
                </button>
              </>
            )}
          </div>

          <HistoryTable
            items={mappedExternalHistory}
            isEditMode={isExternalEditMode}
            selectedIds={selectedExternalIds}
            onRowDoubleClick={handleRowDoubleClick}
            onToggleSelectAll={toggleSelectAllExternal}
            onToggleSelectItem={toggleSelectExternalItem}
          />
        </section>
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