import { useState, useEffect } from "react";

import FileUploadSection from "./components/FileUpload/FileUploadSection";
import AnalysisView from "./components/AnalysisView/AnalysisView";
import InventoryView from "./components/InventoryView/InventoryView";
import HistoryView from "./components/HistoryView/HistoryView";
import HeaderButtons from "./components/HeaderButtons/HeaderButtons";
import HelpModal from "./components/modals/HelpModal/HelpModal";
import NotificationsModal from "./components/modals/NotificationModal/NotificationsModal";
import AboutModal from "./components/modals/AboutModal/AboutModal";

import { useUpdateCheck } from "./hooks/useUpdateCheck";
import { AnalysisProvider, useAnalysis } from "./context/AnalysisContext";

import type { HistoryItem } from "./utils/fileParsers";

import "./App.css";
import "./styles/theme.css";

type AppPage = "upload" | "analysis" | "inventory" | "history"; 

function AppContent() {
  const { update } = useUpdateCheck();
  const [activeModal, setActiveModal] = useState<
    "help" | "notifications" | "about" | null
  >(null);
  const [currentPage, setCurrentPage] = useState<AppPage>("upload");
  
  const [uploadedReferenceFiles, setUploadedReferenceFiles] = useState<
    { name: string; format: string }[]
  >([]);

  const [uploadedHistoryFiles, setUploadedHistoryFiles] = useState<
    { name: string; format: string }[]
  >([]);

  const [externalHistory, setExternalHistory] = useState<HistoryItem[]>([]);

  const { uploadedFiles, setUploadedFiles, setReferenceData, updateParameter } =
    useAnalysis();

  const toggleModal = (modalType: "help" | "notifications" | "about") => {
    setActiveModal((prev) => (prev === modalType ? null : modalType));
  };

  const closeModal = () => setActiveModal(null);

  const isUploadBlocked = update?.isMajorUpdate || false;

  const handleRemoveReferenceFile = (index: number) => {
    if (index === -1) {
      setUploadedReferenceFiles([]);
      setReferenceData(new Map());
    } else {
      const newReferenceFiles = uploadedReferenceFiles.filter(
        (_, i) => i !== index,
      );
      setUploadedReferenceFiles(newReferenceFiles);
      setReferenceData(new Map());
    }
  };

  const handleHistoryDataAdd = (data: HistoryItem[], fileName: string, format: string) => {
    const dataWithSource = data.map(item => ({
      ...item,
      source: 'external' as const,
      _sourceFile: fileName
    }));
    
    setExternalHistory(prev => [...prev, ...dataWithSource]);
    setUploadedHistoryFiles(prev => [...prev, { name: fileName, format }]);
  };

  const handleRemoveHistoryFile = (index: number) => {
    const fileName = uploadedHistoryFiles[index]?.name;
    
    const newFiles = uploadedHistoryFiles.filter((_, i) => i !== index);
    setUploadedHistoryFiles(newFiles);

    if (fileName) {
      setExternalHistory(prev => prev.filter(item => {
        const itemWithSource = item as HistoryItem & { _sourceFile?: string };
        return itemWithSource._sourceFile !== fileName;
      }));
    }
  };

  const canAccessAnalysis = uploadedFiles.length > 0;

  return (
    <div className="app">
      <header className="app-header">
        <nav className="main-navigation">
          <button
            className={currentPage === "upload" ? "active" : ""}
            onClick={() => setCurrentPage("upload")}
          >
            Загрузка
          </button>

          <button
            className={currentPage === "inventory" ? "active" : ""}
            onClick={() => canAccessAnalysis && setCurrentPage("inventory")}
            disabled={!canAccessAnalysis}
            title={!canAccessAnalysis ? "Сначала загрузите данные" : ""}
          >
            Данные
          </button>

          <button
            className={currentPage === "analysis" ? "active" : ""}
            onClick={() => canAccessAnalysis && setCurrentPage("analysis")}
            disabled={!canAccessAnalysis}
            title={!canAccessAnalysis ? "Сначала загрузите данные" : ""}
          >
            Анализ
          </button>

          <button
            className={currentPage === "history" ? "active" : ""}
            onClick={() => setCurrentPage("history")}
          >
            История
          </button>
        </nav>

        <HeaderButtons
          onHelpClick={() => toggleModal("help")}
          onNotificationsClick={() => toggleModal("notifications")}
          onAboutClick={() => toggleModal("about")}
          hasUpdate={!!update}
          isMajorUpdate={update?.isMajorUpdate}
        />
      </header>

      <main className="app-main">
        {currentPage === "upload" ? (
          <FileUploadSection
            isBlocked={isUploadBlocked}
            uploadedFiles={uploadedFiles}
            uploadedReferenceFiles={uploadedReferenceFiles}
            uploadedHistoryFiles={uploadedHistoryFiles}
            onFileAdd={(file) => {
              setUploadedFiles([...uploadedFiles, file]);
            }}
            onReferenceDataAdd={(data, fileName, format) => {
              setReferenceData(data);
              setUploadedReferenceFiles([{ name: fileName, format }]);
            }}
            onHistoryDataAdd={handleHistoryDataAdd}
            onRemoveFile={(index) => {
              setUploadedFiles(
                uploadedFiles.filter((_, i: number) => i !== index),
              );
            }}
            onRemoveReferenceFile={handleRemoveReferenceFile}
            onRemoveHistoryFile={handleRemoveHistoryFile}
            onCancelAll={() => {
              setUploadedFiles([]);
              setUploadedReferenceFiles([]);
              setUploadedHistoryFiles([]);
              setReferenceData(new Map());
              setExternalHistory([]);
            }}
            onAnalyzeClick={() => {
              if (uploadedFiles.length > 0) {
                setCurrentPage("analysis");
              }
            }}
          />
        ) : currentPage === "inventory" ? (
          <InventoryView 
            onNavigateToAnalysis={(product) => {
              updateParameter({ selectedProduct: product });
              setCurrentPage("analysis");
            }}
          />
        ) : currentPage === "analysis" ? (
          <AnalysisView
            uploadedFiles={uploadedFiles}
          />
        ) : (
          <HistoryView
            onNavigateToAnalysis={(product, params) => {
              updateParameter({
                selectedProduct: product,
                initialStock: params.initialStock,
                threshold: params.threshold,
                deliveryDays: params.deliveryDays,
                unitCost: params.unitCost,
              });
              setCurrentPage("analysis");
            }}
            externalHistory={externalHistory}
          />
        )}
      </main>

      <HelpModal isOpen={activeModal === "help"} onClose={closeModal} />
      <NotificationsModal
        isOpen={activeModal === "notifications"}
        onClose={closeModal}
        updateNotification={update}
      />
      <AboutModal isOpen={activeModal === "about"} onClose={closeModal} />
    </div>
  );
}

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  if (!isInitialized) {
    return null;
  }

  return (
    <AnalysisProvider>
      <AppContent />
    </AnalysisProvider>
  );
}