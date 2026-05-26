import { useEffect, useState, useRef } from 'react';
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
  const unlistenRef = useRef<(() => void) | null>(null);
  
  const isBlockedRef = useRef(isBlocked);
  const processingRef = useRef(processing);
  const onFileDropRef = useRef(onFileDrop);

  useEffect(() => {
    isBlockedRef.current = isBlocked;
    processingRef.current = processing;
    onFileDropRef.current = onFileDrop;
  }, [isBlocked, processing, onFileDrop]);

  useEffect(() => {
    const setupDragDrop = async () => {
      const unlisten = await getCurrentWindow().onDragDropEvent((event) => {
        if (isBlockedRef.current || processingRef.current) {
          if (event.payload.type === 'drop') {
            setIsDragging(false);
          }
          return;
        }

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
              onFileDropRef.current(paths);
            }
            break;
        }
      });

      unlistenRef.current = unlisten;
    };

    setupDragDrop();

    return () => {
      if (unlistenRef.current) {
        unlistenRef.current();
      }
    };
  }, []);

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