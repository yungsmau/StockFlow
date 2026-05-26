// import { render, screen } from '@testing-library/react';
// import { describe, it, expect, vi } from 'vitest';
// import AnalysisView from './AnalysisView';
// import { ExportItem } from '../../App';
// import { TestProviders } from '../../test/TestProviders';

// const mockData = [
//   {
//     nomenclature: "Товар А",
//     date: "2025-01-01",
//     income: 0,
//     expense: 20,
//     stock: 80,
//   },
//   {
//     nomenclature: "Товар А", 
//     date: "2025-01-02",
//     income: 0,
//     expense: 15,
//     stock: 65,
//   },
// ];

// const mockUploadedFiles = [{
//   name: "test.xlsx",
//   format: "xlsx",
//   data: mockData,
// }];

// const mockExportData: ExportItem[] = [];
// const mockAddToExport = vi.fn();
// const mockViewExport = vi.fn();

// describe('AnalysisView', () => {
//   it('renders empty state when no files uploaded', () => {
//     render(
//       <TestProviders>
//         <AnalysisView
//           uploadedFiles={[]}
//           exportData={mockExportData}
//           onAddToExport={mockAddToExport}
//           onViewExport={mockViewExport}
//         />
//       </TestProviders>
//     );
    
//     expect(screen.getByText('Нет доступных данных')).toBeInTheDocument();
//   });

//   it('renders product selector and metrics when data is available', () => {
//     render(
//       <TestProviders>
//         <AnalysisView
//           uploadedFiles={mockUploadedFiles}
//           exportData={mockExportData}
//           onAddToExport={mockAddToExport}
//           onViewExport={mockViewExport}
//         />
//       </TestProviders>
//     );
    
//     expect(screen.getByText('Товар А')).toBeInTheDocument();
//     expect(screen.getByText('Сравнение')).toBeInTheDocument();
//     expect(screen.getByText('Моделирование')).toBeInTheDocument();
//     expect(screen.getByText('Фактические данные')).toBeInTheDocument();
//   });
// });