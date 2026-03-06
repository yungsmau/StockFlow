import { useState } from 'react';

import FileUploadSection from './components/FileUpload/FileUploadSection';
import AnalysisView from './components/AnalysisView/AnalysisView';
import InventoryView from './components/InventoryView/InventoryView';
import ExportView from './components/ExportView/ExportView';
import HistoryView from './components/HistoryView/HistoryView';
import HeaderButtons from './components/HeaderButtons/HeaderButtons';
import HelpModal from './components/modals/HelpModal/HelpModal';
import NotificationsModal from './components/modals/NotificationModal/NotificationsModal';
import AboutModal from './components/modals/AboutModal/AboutModal';

import { useUpdateCheck } from './hooks/useUpdateCheck';
import { AnalysisProvider, useAnalysis } from './context/AnalysisContext';

import './App.css';
import './styles/theme.css';

export interface ExportItem {
  product: string;
  initialStock: number;
  threshold: number;
  deliveryDays: number;
  unitCost: number;
  efficiency: number;
  avgStock: number;
  actualAvgStock: number;
  minimalOrder?: number; 
  optimalOrder?: number;
  stockValue?: number;
  efficiencyAbs?: number; 
}

type AppPage = 'upload' | 'analysis' | 'inventory' | 'export' | 'history';

function AppContent() {
  const { update } = useUpdateCheck();
  const [activeModal, setActiveModal] = useState<'help' | 'notifications' | 'about' | null>(null);
  const [currentPage, setCurrentPage] = useState<AppPage>('upload');
  const [exportData, setExportData] = useState<ExportItem[]>([]);

  const [uploadedReferenceFiles, setUploadedReferenceFiles] = useState<{ name: string; format: string }[]>([]);
  
  const { uploadedFiles, setUploadedFiles, setReferenceData, updateParameter } = useAnalysis();

  const toggleModal = (modalType: 'help' | 'notifications' | 'about') => {
    setActiveModal(prev => prev === modalType ? null : modalType);
  };

  const closeModal = () => setActiveModal(null);

  const isUploadBlocked = update?.isMajorUpdate || false;

  const handleAddToExport = (item: ExportItem) => {
    setExportData(prev => [...prev, item]);
  };

  const handleClearExport = () => {
    setExportData([]);
  };

  const handleRemoveFromExport = (index: number) => {
    setExportData(prev => prev.filter((_, i: number) => i !== index));
  };

  const handleRemoveReferenceFile = (index: number) => {
    if (index === -1) {
      setUploadedReferenceFiles([]);
      setReferenceData(new Map());
    } else {
      const newReferenceFiles = uploadedReferenceFiles.filter((_, i) => i !== index);
      setUploadedReferenceFiles(newReferenceFiles);
      
      setReferenceData(new Map());
    }
  };

  const canAccessAnalysis = uploadedFiles.length > 0;
  const canAccessExport = exportData.length > 0;

  return (
    <div className="app">
      <header className="app-header">
        <nav className="main-navigation">
          <button 
            className={currentPage === 'upload' ? 'active' : ''}
            onClick={() => setCurrentPage('upload')}
          >
            Загрузка 
          </button>
          
          <button 
            className={currentPage === 'inventory' ? 'active' : ''}
            onClick={() => canAccessAnalysis && setCurrentPage('inventory')}
            disabled={!canAccessAnalysis}
            title={!canAccessAnalysis ? "Сначала загрузите данные" : ""}
          >
            Данные 
          </button>

          <button 
            className={currentPage === 'analysis' ? 'active' : ''}
            onClick={() => canAccessAnalysis && setCurrentPage('analysis')}
            disabled={!canAccessAnalysis}
            title={!canAccessAnalysis ? "Сначала загрузите данные" : ""}
          >
            Анализ 
          </button>

          <button 
            className={currentPage === 'export' ? 'active' : ''}
            onClick={() => canAccessExport && setCurrentPage('export')}
            disabled={!canAccessExport}
            title={!canAccessExport ? "Сначала добавьте данные в экспорт" : ""}
          >
            Экспорт
          </button>

          <button 
            className={currentPage === 'history' ? 'active' : ''}
            onClick={() => setCurrentPage('history')}
          >
            История
          </button>
        </nav>
        
        <HeaderButtons
          onHelpClick={() => toggleModal('help')}
          onNotificationsClick={() => toggleModal('notifications')}
          onAboutClick={() => toggleModal('about')}
          hasUpdate={!!update}
          isMajorUpdate={update?.isMajorUpdate}
        />
      </header>

      <main className="app-main">
        {currentPage === 'upload' ? (
          <FileUploadSection
            isBlocked={isUploadBlocked}
            uploadedFiles={uploadedFiles}
            uploadedReferenceFiles={uploadedReferenceFiles}
            onFileAdd={(file) => {
              setUploadedFiles([...uploadedFiles, file]);
            }}
            onReferenceDataAdd={(data) => {
              setReferenceData(data);
              // Добавляем справочник в список отображаемых файлов
              const fileName = 'Справочник'; // или получать имя файла
              setUploadedReferenceFiles([{ name: fileName, format: 'XLSX' }]);
            }}
            onRemoveFile={(index) => {
              setUploadedFiles(uploadedFiles.filter((_, i: number) => i !== index));
            }}
            onRemoveReferenceFile={handleRemoveReferenceFile}
            onCancelAll={() => {
              setUploadedFiles([]);
              setUploadedReferenceFiles([]);
              setReferenceData(new Map());
            }}
            onAnalyzeClick={() => {
              if (uploadedFiles.length > 0) {
                setCurrentPage('analysis');
              }
            }} 
          />
        ) : currentPage === 'inventory' ? (
          <InventoryView />
        ) : currentPage === 'analysis' ? (
          <AnalysisView
            uploadedFiles={uploadedFiles}
            onAddToExport={handleAddToExport}
          />
        ) : currentPage === 'export' ? (
          <ExportView
            data={exportData}
            onClear={handleClearExport}
            onRemoveItem={handleRemoveFromExport}
          />
        ) : (
          <HistoryView 
            onNavigateToAnalysis={(product, params) => {
              updateParameter({
                selectedProduct: product,
                initialStock: params.initialStock,
                threshold: params.threshold,
                deliveryDays: params.deliveryDays,
                unitCost: params.unitCost
              });
              setCurrentPage('analysis');
            }}
          />
        )}
      </main>

      <HelpModal isOpen={activeModal === 'help'} onClose={closeModal} />
      <NotificationsModal
        isOpen={activeModal === 'notifications'}
        onClose={closeModal}
        updateNotification={update}
      />
      <AboutModal isOpen={activeModal === 'about'} onClose={closeModal} />
    </div>
  );
}

export default function App() {
  return (
    <AnalysisProvider>
      <AppContent />
    </AnalysisProvider>
  );
}