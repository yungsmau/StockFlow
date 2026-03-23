// src/context/AnalysisContext.tsx
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { invoke } from "@tauri-apps/api/core";

import type { DateFilter } from '../utils/dateFilter';
import { filterDataByDate, getDateRangeForProduct } from '../utils/dateFilter';

interface RowData {
  nomenclature: string;
  date: string;
  income: number;
  expense: number;
  stock: number;
}

interface UploadedFile {
  name: string;
  format: string;
  data: RowData[];
  path?: string;
}

interface ReferenceItem {
  deliveryDays?: number;
  unitCost?: number;
  optimalOrder?: number;
  minimalOrder?: number;
}

interface ComputeResponse {
  dates: string[];
  starting_stock: number[];
  incoming: number[];
  spent: number[];
  threshold: number;
  avg_stock: number;
  deliveries: number;
  unit_cost: number;
  total_price: number;
  actual_avg_stock: number;
  actual_total_price: number;
  actual_deliveries: number;
  efficiency: number;
  efficiency_abs: number;
  avg_expense: number;
  recommended_threshold: number;
  avg_delivery_interval_actual: number;
  avg_delivery_interval_model: number;
}

interface ActualDataPoint {
  date: string;
  income: number;
  expense: number;
  stock: number;
}

type ChartMode = "comparison" | "actual" | "simulation" | "frequency" | "plan";

interface AnalysisState {
  selectedProduct: string;
  initialStock: number;
  threshold: number;
  deliveryDays: number;
  unitCost: number;
  optimalOrder?: number;
  minimalOrder?: number;
  result: ComputeResponse | null;
  actualData: ActualDataPoint[];
  loading: boolean;
  errorMessage: { message: string; rawMessage: string } | null;
  chartMode: ChartMode; 
  dateFilter: DateFilter;
  availableDateRange: { min: string; max: string } | null;
}

interface AnalysisContextType {
  state: AnalysisState;
  uploadedFiles: UploadedFile[];
  referenceData: Map<string, ReferenceItem>;
  setUploadedFiles: (files: UploadedFile[]) => void;
  setReferenceData: (data: Map<string, ReferenceItem>) => void;
  computeForProduct: (product: string, params: {
    initialStock: number;
    threshold: number;
    deliveryDays: number;
    unitCost: number;
  }) => Promise<void>;
  updateParameter: (updates: Partial<{
    selectedProduct: string;
    initialStock: number;
    threshold: number;
    deliveryDays: number;
    unitCost: number;
    optimalOrder?: number;
    minimalOrder?: number;
  }>) => void;
  retry: () => void;
  setChartMode: (mode: ChartMode) => void; 
  setDateFilter: (filter: DateFilter) => Promise<void>;
  recalculateCurrent: () => Promise<void>;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

const calculationCache = new Map<string, ComputeResponse>();

const getCacheKey = (
  product: string,
  initialStock: number,
  threshold: number,
  deliveryDays: number,
  unitCost: number,
  dateFrom?: string,
  dateTo?: string
) => `${product}|${initialStock}|${threshold}|${deliveryDays}|${unitCost}|${dateFrom || 'all'}|${dateTo || 'all'}`;

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [referenceData, setReferenceData] = useState<Map<string, ReferenceItem>>(new Map());
  
  const isCalculatingRef = useRef(false);
  const prevProductRef = useRef<string>('');
  
  const [state, setState] = useState<AnalysisState>({
    selectedProduct: "",
    initialStock: 100,
    threshold: 100,
    deliveryDays: 10,
    unitCost: 1,
    optimalOrder: undefined,
    minimalOrder: undefined,
    result: null,
    actualData: [],
    loading: false,
    errorMessage: null,
    chartMode: "comparison",
    dateFilter: { enabled: false, range: null },
    availableDateRange: null,
  });

  const setChartMode = (mode: ChartMode) => {
    setState(prev => ({ ...prev, chartMode: mode }));
  };

  const recalculateWithFiles = async (
    files: UploadedFile[],
    params: {
      product: string;
      initialStock: number;
      threshold: number;
      deliveryDays: number;
      unitCost: number;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<ComputeResponse> => {
    const cacheKey = getCacheKey(
      params.product, params.initialStock, params.threshold,
      params.deliveryDays, params.unitCost, params.dateFrom, params.dateTo
    );

    if (calculationCache.has(cacheKey)) {
      return calculationCache.get(cacheKey)!;
    }

    const response: ComputeResponse = await invoke("compute_stock", {
      req: {
        product: params.product,
        uploaded_files: files.map(f => ({ name: f.name, data: f.data })),
        initial_stock: params.initialStock,
        threshold: params.threshold,
        delivery_days: params.deliveryDays,
        unit_cost: params.unitCost,
      }
    });

    calculationCache.set(cacheKey, response);
    return response;
  };

  const calculateActualData = (product: string, files: UploadedFile[]): ActualDataPoint[] => {
    const allRows = files.flatMap(f => f.data);
    const filtered = allRows.filter(r => r.nomenclature === product);
    
    const grouped = filtered.reduce((acc, row) => {
      if (!acc[row.date]) {
        acc[row.date] = { date: row.date, income: 0, expense: 0, stock: 0 };
      }
      acc[row.date].income += row.income;
      acc[row.date].expense += row.expense;
      acc[row.date].stock += row.stock;
      return acc;
    }, {} as Record<string, { date: string; income: number; expense: number; stock: number }>);

    return Object.values(grouped).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const computeForProduct = async (
    product: string,
    params: {
      initialStock: number;
      threshold: number;
      deliveryDays: number;
      unitCost: number;
    },
    dateRange?: { from: string; to: string } | null
  ) => {
    if (!product) return;
    if (isCalculatingRef.current) return;

    setState(prev => ({ ...prev, loading: true, errorMessage: null }));
    isCalculatingRef.current = true;

    try {
      const filterRange = dateRange !== undefined ? dateRange : state.dateFilter.range;
      
      const filesToUse = filterRange?.from && filterRange?.to
        ? filterDataByDate(uploadedFiles, filterRange.from, filterRange.to)
        : uploadedFiles;

      if (filesToUse.length === 0) {
        setState(prev => ({
          ...prev,
          errorMessage: { message: 'Нет данных в выбранном периоде', rawMessage: 'Нет данных в выбранном периоде' },
          result: null,
          loading: false
        }));
        return;
      }

      const response = await recalculateWithFiles(filesToUse, {
        product,
        ...params,
        dateFrom: filterRange?.from,
        dateTo: filterRange?.to,
      });

      const actualData = calculateActualData(product, filesToUse);
      
      setState(prev => ({ 
        ...prev, 
        result: response, 
        actualData,
        selectedProduct: product,
        initialStock: params.initialStock,
        threshold: params.threshold,
        deliveryDays: params.deliveryDays,
        unitCost: params.unitCost,
        loading: false
      }));
    } catch (e: any) {
      const rawMessage = typeof e === "string" ? e : e.message || "Неизвестная ошибка";
      setState(prev => ({ 
        ...prev, 
        errorMessage: { message: rawMessage, rawMessage },
        result: null,
        loading: false
      }));
    } finally {
      isCalculatingRef.current = false;
    }
  };

  const updateParameter = (updates: Partial<{
    selectedProduct: string;
    initialStock: number;
    threshold: number;
    deliveryDays: number;
    unitCost: number;
    optimalOrder?: number;
    minimalOrder?: number;
  }>) => {
    if (updates.selectedProduct && Object.keys(updates).length === 1) {
      const product = updates.selectedProduct;
      const refItem = referenceData.get(product);
      const newParams = {
        initialStock: 100, threshold: 100,
        deliveryDays: refItem?.deliveryDays ?? 10,
        unitCost: refItem?.unitCost ?? 1,
        optimalOrder: refItem?.optimalOrder,
        minimalOrder: refItem?.minimalOrder
      };
      
      setState(prev => ({ ...prev, selectedProduct: product, ...newParams }));
      computeForProduct(product, {
        initialStock: newParams.initialStock,
        threshold: newParams.threshold,
        deliveryDays: newParams.deliveryDays,
        unitCost: newParams.unitCost
      });
    } else {
      setState(prev => ({ ...prev, ...updates }));
      const product = updates.selectedProduct || state.selectedProduct;
      if (product) {
        const newParams = {
          initialStock: updates.initialStock ?? state.initialStock,
          threshold: updates.threshold ?? state.threshold,
          deliveryDays: updates.deliveryDays ?? state.deliveryDays,
          unitCost: updates.unitCost ?? state.unitCost
        };
        computeForProduct(product, newParams);
      }
    }
  };

  const retry = () => {
    if (state.selectedProduct) {
      computeForProduct(state.selectedProduct, {
        initialStock: state.initialStock,
        threshold: state.threshold,
        deliveryDays: state.deliveryDays,
        unitCost: state.unitCost
      });
    }
  };

  const setDateFilter = async (newFilter: DateFilter) => {
    if (newFilter.range?.from === state.dateFilter.range?.from && 
        newFilter.range?.to === state.dateFilter.range?.to &&
        newFilter.enabled === state.dateFilter.enabled) {
      return;
    }
    
    if (newFilter.range?.from !== state.dateFilter.range?.from || 
        newFilter.range?.to !== state.dateFilter.range?.to) {
      calculationCache.clear();
    }
    
    setState(prev => ({ ...prev, dateFilter: newFilter }));

    if (state.selectedProduct) {
      const filesToUse = newFilter.enabled && newFilter.range
        ? filterDataByDate(uploadedFiles, newFilter.range.from, newFilter.range.to)
        : uploadedFiles;

      if (filesToUse.length === 0) {
        setState(prev => ({
          ...prev,
          errorMessage: { message: 'Нет данных в выбранном периоде', rawMessage: 'Нет данных в выбранном периоде' },
          result: null
        }));
        return;
      }

      await computeForProduct(
        state.selectedProduct,
        {
          initialStock: state.initialStock,
          threshold: state.threshold,
          deliveryDays: state.deliveryDays,
          unitCost: state.unitCost,
        },
        newFilter.range
      );
    }
  };

  const recalculateCurrent = async () => {
    if (state.selectedProduct) {
      await computeForProduct(
        state.selectedProduct,
        {
          initialStock: state.initialStock,
          threshold: state.threshold,
          deliveryDays: state.deliveryDays,
          unitCost: state.unitCost,
        },
        state.dateFilter.range
      );
    }
  };

  useEffect(() => {
    const updateDateRange = async () => {
      if (state.selectedProduct && uploadedFiles.length > 0) {
        if (state.selectedProduct === prevProductRef.current) {
          return;
        }
        
        prevProductRef.current = state.selectedProduct;
        
        const cacheKey = `dateRange:${state.selectedProduct}`;
        const cached = sessionStorage.getItem(cacheKey);
        
        if (cached) {
          const range = JSON.parse(cached);
          setState(prev => ({ 
            ...prev, 
            availableDateRange: range,
            dateFilter: { enabled: true, range: { from: range.min, to: range.max } }
          }));
          return;
        }
        
        const range = await getDateRangeForProduct(uploadedFiles, state.selectedProduct);
        
        if (range) {
          sessionStorage.setItem(cacheKey, JSON.stringify(range));
          setState(prev => ({ 
            ...prev, 
            availableDateRange: range,
            dateFilter: { enabled: true, range: { from: range.min, to: range.max } }
          }));
        }
      }
    };
    
    updateDateRange();
  }, [state.selectedProduct, uploadedFiles.length]);

  useEffect(() => {
    if (!state.selectedProduct && uploadedFiles.length > 0) {
      const firstProduct = uploadedFiles[0].data[0]?.nomenclature;
      if (firstProduct) {
        computeForProduct(firstProduct, {
          initialStock: state.initialStock,
          threshold: state.threshold,
          deliveryDays: state.deliveryDays,
          unitCost: state.unitCost
        });
      }
    }
  }, [uploadedFiles, state.selectedProduct]);

  return (
    <AnalysisContext.Provider value={{
      state, uploadedFiles, referenceData,
      setUploadedFiles, setReferenceData,
      computeForProduct, updateParameter, retry, setChartMode,
      setDateFilter, recalculateCurrent,
    }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within AnalysisProvider');
  }
  return context;
}