import React from 'react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  onBack?: () => void;
}

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children,
  className = '',
  onBack,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-container ${className}`} 
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="modal-header">
          {onBack && (
            <button className="modal-back-btn" onClick={onBack}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.6667 7.99998H3.33337M3.33337 7.99998L8.00004 12.6666M3.33337 7.99998L8.00004 3.33331" stroke="#1E1E1E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          <h2>{title}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L4 12M4 4L12 12" stroke="#1E1E1E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>

          </button>
        </div>
        {children}
      </div>
    </div>
  );
}