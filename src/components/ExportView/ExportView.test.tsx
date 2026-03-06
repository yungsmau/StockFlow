// import { render, screen, fireEvent } from '@testing-library/react';
// import { describe, it, expect, vi } from 'vitest';
// import ExportView from './ExportView';
// import { ExportItem } from '../../App';

// vi.mock('@tauri-apps/plugin-dialog', () => ({
//   save: vi.fn(),
// }));

// vi.mock('@tauri-apps/plugin-fs', () => ({
//   writeFile: vi.fn(),
// }));


// const mockExportData: ExportItem[] = [
//   {
//     product: "Товар А",
//     initialStock: 100,
//     threshold: 50,
//     deliveryDays: 3,
//     unitCost: 10.5,
//     efficiency: 0.85,
//     avgStock: 72.3,
//     actualAvgStock: 75.8,
//   }
// ];

// const mockClear = vi.fn();
// const mockRemove = vi.fn();

// describe('ExportView', () => {
//   beforeEach(() => {
//     vi.clearAllMocks();
//   });

//   it('renders empty state when no data', () => {
//     render(<ExportView data={[]} onClear={mockClear} />);
//     expect(screen.getByText('Нет данных для экспорта')).toBeInTheDocument();
//   });

//   it('renders table with export data', () => {
//     render(
//       <ExportView 
//         data={mockExportData} 
//         onClear={mockClear} 
//         onRemoveItem={mockRemove} 
//       />
//     );
    
//     // Проверяем данные в таблице
//     expect(screen.getByText('Товар А')).toBeInTheDocument();
//     expect(screen.getByText('100')).toBeInTheDocument();
//     expect(screen.getByText('50')).toBeInTheDocument();
//     expect(screen.getByText('3')).toBeInTheDocument();
//     expect(screen.getByText('10.5')).toBeInTheDocument();
//     expect(screen.getByText('0.8%')).toBeInTheDocument();
//     expect(screen.getByText('72')).toBeInTheDocument(); // округлено
//     expect(screen.getByText('76')).toBeInTheDocument(); // округлено
//   });

//   it('calls onClear when "Очистить всё" is clicked', () => {
//     render(
//       <ExportView 
//         data={mockExportData} 
//         onClear={mockClear} 
//         onRemoveItem={mockRemove} 
//       />
//     );
    
//     const clearButton = screen.getByText('Очистить всё');
//     fireEvent.click(clearButton);
    
//     expect(mockClear).toHaveBeenCalled();
//   });

//   it('calls onRemoveItem when delete button is clicked', () => {
//     render(
//       <ExportView 
//         data={mockExportData} 
//         onClear={mockClear} 
//         onRemoveItem={mockRemove} 
//       />
//     );
    
//     const deleteButtons = screen.getAllByTitle('Удалить из экспорта');
//     fireEvent.click(deleteButtons[0]);
    
//     expect(mockRemove).toHaveBeenCalledWith(0);
//   });
// });