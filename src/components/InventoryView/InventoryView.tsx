import { useMemo, useEffect, useRef, useState } from 'react';
import { useAnalysis } from '../../context/AnalysisContext';
import { formatNumber } from '../../utils/formatNumber';
import ProductSelector from '../AnalysisView/ProductSelector/ProductSelector';
import { loadHistoryItems } from '../../utils/historyService';
import './InventoryView.css';

interface InventoryItem {
  product: string;
  avgStock: number;
  stockValue: number;
  deliveriesCount: number;
  avgDeliveryInterval: number;
  totalIncome: number;
  totalExpense: number;
}

interface InventoryViewProps {
  onNavigateToAnalysis?: (product: string) => void;
}

type SortField = 'avgStock' | 'stockValue' | 'deliveriesCount' | 'avgDeliveryInterval' | 'totalIncome' | 'totalExpense' | null;
type SortDirection = 'asc' | 'desc';

const SortIcon = ({ direction }: { direction: 'asc' | 'desc' | 'none' }) => {
  if (direction === 'none') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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

export default function InventoryView({ onNavigateToAnalysis }: InventoryViewProps ) {
  const { uploadedFiles, state, updateParameter, referenceData } = useAnalysis();
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());
  const [shouldScroll, setShouldScroll] = useState(false);
  const [processedProducts, setProcessedProducts] = useState<Set<string>>(new Set());
  
  const [sortField, setSortField] = useState<SortField>('avgStock');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleRowDoubleClick = (product: string) => {
    onNavigateToAnalysis?.(product);
  };  

  useEffect(() => {
    const loadProcessedProducts = async () => {
      try {
        const historyItems = await loadHistoryItems();
        const products = new Set(historyItems.map(item => item.product));
        setProcessedProducts(products);
      } catch (error) {
        console.error('Failed to load processed products:', error);
        setProcessedProducts(new Set());
      }
    };
    
    if (uploadedFiles.length > 0) {
      loadProcessedProducts();
    }
  }, [uploadedFiles]);

  const inventoryData = useMemo(() => {
    if (uploadedFiles.length === 0) return [];

    const products = new Set<string>();
    const productData: Map<string, {
      stocks: number[];
      incomes: number[];
      expenses: number[];
      dates: string[];
    }> = new Map();

    uploadedFiles.forEach(file => {
      file.data.forEach(row => {
        if (!products.has(row.nomenclature)) {
          products.add(row.nomenclature);
          productData.set(row.nomenclature, {
            stocks: [],
            incomes: [],
            expenses: [],
            dates: []
          });
        }
        
        const data = productData.get(row.nomenclature)!;
        data.stocks.push(row.stock);
        data.incomes.push(row.income);
        data.expenses.push(row.expense);
        data.dates.push(row.date);
      });
    });

    const items: InventoryItem[] = [];
    
    for (const product of products) {
      const data = productData.get(product)!;
      
      const avgStock = data.stocks.reduce((a, b) => a + b, 0) / data.stocks.length;
      
      const refItem = referenceData.get(product);
      const unitCost = refItem?.unitCost ?? 0;
      
      const stockValue = unitCost > 0 ? avgStock * unitCost : 0;
      
      const deliveriesCount = data.incomes.filter(income => income > 0).length;
      
      let avgDeliveryInterval = 0;
      if (deliveriesCount > 1) {
        const deliveryDates = data.dates
          .filter((_, idx) => data.incomes[idx] > 0)
          .sort();
        
        if (deliveryDates.length > 1) {
          const intervals = [];
          for (let i = 1; i < deliveryDates.length; i++) {
            const date1 = new Date(deliveryDates[i - 1]);
            const date2 = new Date(deliveryDates[i]);
            const diffTime = Math.abs(date2.getTime() - date1.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            intervals.push(diffDays);
          }
          avgDeliveryInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        }
      }
      
      const totalIncome = data.incomes.reduce((a, b) => a + b, 0);
      const totalExpense = data.expenses.reduce((a, b) => a + b, 0);
      
      items.push({
        product,
        avgStock,
        stockValue,
        deliveriesCount,
        avgDeliveryInterval,
        totalIncome,
        totalExpense
      });
    }
    
    if (sortField) {
      return items.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          if (sortDirection === 'asc') {
            return aValue - bValue;
          } else {
            return bValue - aValue;
          }
        }
        return 0;
      });
    }
    
    return items.sort((a, b) => b.avgStock - a.avgStock);
  }, [uploadedFiles, referenceData, sortField, sortDirection]);

  useEffect(() => {
    if (shouldScroll && state.selectedProduct && tableWrapperRef.current) {
      const rowElement = rowRefs.current.get(state.selectedProduct);
      if (rowElement) {
        const container = tableWrapperRef.current;
        const containerRect = container.getBoundingClientRect();
        const rowRect = rowElement.getBoundingClientRect();
        
        if (rowRect.top < containerRect.top || rowRect.bottom > containerRect.bottom) {
          rowElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
        
        rowElement.classList.add('highlighted');
        setTimeout(() => {
          rowElement.classList.remove('highlighted');
        }, 2000);
      }
      
      setShouldScroll(false);
    }
  }, [state.selectedProduct, shouldScroll]);

  if (uploadedFiles.length === 0) {
    return (
      <div className="inventory-view">
        <div className="inventory-empty">
          <p>Загрузите файлы с данными для просмотра сводки по номенклатурам</p>
        </div>
      </div>
    );
  }

  const handleRowClick = (product: string) => {
    setShouldScroll(true);
    updateParameter({ selectedProduct: product });
  };

  const handleProductChange = (product: string) => {
    setShouldScroll(true);
    updateParameter({ selectedProduct: product });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="inventory-view">
      <div className="inventory-header">
        <div className='inventory-header__description'>
          <h2>Номенклатурам</h2>
          <p>Обзор всех товаров с ключевыми показателями</p>
        </div>
        <div className="product-selector-container inventory-selector">
          <ProductSelector
            uploadedFiles={uploadedFiles}
            selectedProduct={state.selectedProduct}
            onProductChange={handleProductChange}
          />
        </div>
      </div>

      <div className="inventory-table-container">
        <div className="inventory-table-wrapper" ref={tableWrapperRef}>
          <table className="inventory-table">
            <thead>
              <tr>
                <th className='inventory-table__header'>
                  <span>#</span>
                </th>
                <th className='inventory-table__header'>
                  <span>Номенклатура</span>
                </th>
                <th onClick={() => handleSort('avgStock')} className="inventory-table__header sortable-header">
                  <span>Ср. дневной остаток, ед.</span>
                  <SortIcon direction={sortField === 'avgStock' ? sortDirection : 'none'} />
                </th>
                <th onClick={() => handleSort('stockValue')} className="inventory-table__header sortable-header">
                  <span>Ср. дневной остаток, руб.</span>
                  <SortIcon direction={sortField === 'stockValue' ? sortDirection : 'none'} />
                </th>
                <th onClick={() => handleSort('deliveriesCount')} className="inventory-table__header sortable-header">
                  <span>Поставок</span>
                  <SortIcon direction={sortField === 'deliveriesCount' ? sortDirection : 'none'} />
                </th>
                <th onClick={() => handleSort('avgDeliveryInterval')} className="inventory-table__header sortable-header">
                  <span>Интервал поставок, дни</span>
                  <SortIcon direction={sortField === 'avgDeliveryInterval' ? sortDirection : 'none'} />
                </th>
                <th onClick={() => handleSort('totalIncome')} className="inventory-table__header sortable-header">
                  <span>Всего приход, ед.</span>
                  <SortIcon direction={sortField === 'totalIncome' ? sortDirection : 'none'} />
                </th>
                <th onClick={() => handleSort('totalExpense')} className="inventory-table__header sortable-header">
                  <span>Всего расход, ед.</span>
                  <SortIcon direction={sortField === 'totalExpense' ? sortDirection : 'none'} />
                </th>
              </tr>
            </thead>
            <tbody>
              {inventoryData.map((item, index) => (
                <tr 
                  key={item.product}
                  ref={(el) => {
                    if (el) {
                      rowRefs.current.set(item.product, el);
                    }
                  }}
                  className={`
                    ${state.selectedProduct === item.product ? 'selected-row' : ''}
                    ${processedProducts.has(item.product) ? 'processed-row' : ''}
                  `.trim()}
                  onClick={() => handleRowClick(item.product)}
                  onDoubleClick={() => handleRowDoubleClick(item.product)}
                  style={{ cursor: 'pointer' }}
                  title="Клик → Выбор | Двойной клик → Анализ"
                >
                  <td>{index + 1}</td>
                  <td>{item.product}</td>
                  <td>{formatNumber(Math.round(item.avgStock))}</td>
                  <td>{item.stockValue > 0 ? formatNumber(Math.round(item.stockValue)) : '—'}</td>
                  <td>{formatNumber(item.deliveriesCount)}</td>
                  <td>{item.avgDeliveryInterval > 0 ? Math.round(item.avgDeliveryInterval) : '—'}</td>
                  <td>{formatNumber(Math.round(item.totalIncome))}</td>
                  <td>{formatNumber(Math.round(item.totalExpense))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}