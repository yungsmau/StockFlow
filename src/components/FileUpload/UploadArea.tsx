import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

interface UploadAreaProps {
  isBlocked: boolean;
  processing: boolean;
  onFileDrop: (paths: string[]) => void;
  children: React.ReactNode;
}

export default function UploadArea({ 
  isBlocked, 
  processing, 
  onFileDrop, 
  children 
}: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const unlisten = getCurrentWindow().onDragDropEvent(async (event) => {
      if (isBlocked || processing) return;

      switch (event.payload.type) {
        case 'enter':
          setIsDragging(true);
          break;
        case 'leave':
          setIsDragging(false);
          break;
        case 'drop':
          setIsDragging(false);
          const paths = event.payload.paths;
          if (paths?.length) {
            onFileDrop(paths);
          }
          break;
      }
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, [isBlocked, processing]);

  return (
    <div
      className={`upload-field ${isDragging ? 'upload-field--drag-over' : ''} ${
        isBlocked ? 'upload-field--disabled' : ''
      } ${processing ? 'upload-field--processing' : ''}`}
    >
      {isBlocked && (
        <div className="upload-field__blocked-overlay">
          <p className="upload-field__blocked-text">Обновите приложение для продолжения работы</p>
        </div>
      )}
      
      {children}
    </div>
  );
}