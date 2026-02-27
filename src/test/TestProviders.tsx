import { ReactNode } from 'react';
import { AnalysisProvider } from '../context/AnalysisContext';

export function TestProviders({ children }: { children: ReactNode }) {
  return <AnalysisProvider>{children}</AnalysisProvider>;
}