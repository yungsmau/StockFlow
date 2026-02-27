import { createContext, useContext, useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";

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
  recommended_threshold: number;
}

interface ActualDataPoint {
  date: string;
  income: number;
  expense: number;
  stock: number;
}

interface AnalysisState {
  selectedProduct: string;
  initialStock: number;
  threshold: number;
  deliveryDays: number;
  unitCost: number;
  result: ComputeResponse | null;
  actualData: ActualDataPoint[];
  loading: boolean;
  errorMessage: { message: string; rawMessage: string } | null;
}

interface AnalysisContextType {
  state: AnalysisState;
  uploadedFiles: UploadedFile[];
  setUploadedFiles: (files: UploadedFile[]) => void;
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
  }>) => void;
  retry: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [state, setState] = useState<AnalysisState>({
    selectedProduct: "",
    initialStock: 100,
    threshold: 100,
    deliveryDays: 10,
    unitCost: 1,
    result: null,
    actualData: [],
    loading: false,
    errorMessage: null
  });

  const calculateActualData = (product: string): ActualDataPoint[] => {
    const allRows = uploadedFiles.flatMap(f => f.data);
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

  const computeForProduct = async (product: string, params: {
    initialStock: number;
    threshold: number;
    deliveryDays: number;
    unitCost: number;
  }) => {
    if (!product) return;

    setState(prev => ({ ...prev, loading: true, errorMessage: null }));

    try {
      const response: ComputeResponse = await invoke("compute_stock", {
        req: {
          product: product,
          uploaded_files: uploadedFiles.map(f => ({
            name: f.name,
            data: f.data,
          })),
          initial_stock: params.initialStock,
          threshold: params.threshold,
          delivery_days: params.deliveryDays,
          unit_cost: params.unitCost,
        }
      });

      const actualData = calculateActualData(product);
      
      setState(prev => ({ 
        ...prev, 
        result: response, 
        actualData,
        selectedProduct: product,
        initialStock: params.initialStock,
        threshold: params.threshold,
        deliveryDays: params.deliveryDays,
        unitCost: params.unitCost
      }));
    } catch (e: any) {
      const rawMessage = typeof e === "string" ? e : e.message || "Неизвестная ошибка";
      setState(prev => ({ 
        ...prev, 
        errorMessage: { message: rawMessage, rawMessage },
        result: null
      }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const updateParameter = (updates: Partial<{
    selectedProduct: string;
    initialStock: number;
    threshold: number;
    deliveryDays: number;
    unitCost: number;
  }>) => {
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

  // Автоматический выбор первого продукта
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
      state,
      uploadedFiles,
      setUploadedFiles,
      computeForProduct,
      updateParameter,
      retry
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