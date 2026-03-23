import Modal from '../Modal';
import UsageGuide from './UsageGuide';
import ParametersGuide from './ParametersGuide';
import { useState } from 'react';
import { downloadExample, downloadReferenceExample, downloadPlanExample } from './FileStructures'; 

import '../Modal.css';
import './HelpModal.css';
import FileExamples from './FileExamples';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [view, setView] = useState<'menu' | 'usage' | 'parameters' | 'examples'>('menu');

  const renderContent = () => {
    switch (view) {
      case 'usage':
        return <UsageGuide />;
      case 'parameters':
        return <ParametersGuide />;
      case 'examples':
        return <FileExamples 
          onDownloadExample={downloadExample} 
          onDownloadReferenceExample={downloadReferenceExample}
          onDownloadPlanExample={downloadPlanExample}
        />;
      case 'menu':
      default:
        return (
          <div className="help-modal__menu">
            <button
              className="help-modal__menu-btn"
              onClick={() => setView('usage')}
            >
              Использование приложения
            </button>
            <button
              className="help-modal__menu-btn"
              onClick={() => setView('parameters')}
            >
              Параметры моделирования
            </button>
            <button
              className="help-modal__menu-btn"
              onClick={() => setView('examples')}
            >
              Шаблоны данных 
            </button>
          </div>
        );
    }
  };

  const handleBack = () => {
    if (view !== 'menu') {
      setView('menu');
    }
  };

  const handleClose = () => {
    setView('menu');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Справка"
      className="help-modal"
      onBack={view !== 'menu' ? handleBack : undefined}
    >
      <div className="help-modal__scrollable">
        <div className="help-modal__content">
          {renderContent()}
        </div>
      </div>
    </Modal>
  );
}