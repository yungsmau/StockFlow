import { useState } from 'react';

import FileUploadSection from './components/FileUpload/FileUploadSection';
import AnalysisView from './components/AnalysisView/AnalysisView';
import ExportView from './components/ExportView/ExportView';
import HeaderButtons from './components/HeaderButtons/HeaderButtons';
import HelpModal from './components/Modals/HelpModal/HelpModal';
import NotificationsModal from './components/Modals/NotificationModal/NotificationsModal';
import AboutModal from './components/Modals/AboutModal/AboutModal';

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
}

type AppPage = 'upload' | 'analysis' | 'export';

function AppContent() {
  const { update } = useUpdateCheck();
  const [activeModal, setActiveModal] = useState<'help' | 'notifications' | 'about' | null>(null);
  const [currentPage, setCurrentPage] = useState<AppPage>('upload');
  const [exportData, setExportData] = useState<ExportItem[]>([]);

  const { uploadedFiles, setUploadedFiles } = useAnalysis();

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
            onFileAdd={(file) => {
              setUploadedFiles([...uploadedFiles, file]);
            }}
            onRemoveFile={(index) => {
              setUploadedFiles(uploadedFiles.filter((_, i: number) => i !== index));
            }}
            onCancelAll={() => {
              setUploadedFiles([]);
            }}
            onAnalyzeClick={() => {
              if (uploadedFiles.length > 0) {
                setCurrentPage('analysis');
              }
            }} 
          />
        ) : currentPage === 'analysis' ? (
          <AnalysisView
            uploadedFiles={uploadedFiles}
            exportData={exportData}
            onAddToExport={handleAddToExport}
            onViewExport={() => setCurrentPage('export')}
          />
        ) : (
          <ExportView
            data={exportData}
            onClear={handleClearExport}
            onRemoveItem={handleRemoveFromExport}
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

// Основной App с провайдером
export default function App() {
  return (
    <AnalysisProvider>
      <AppContent />
    </AnalysisProvider>
  );
}