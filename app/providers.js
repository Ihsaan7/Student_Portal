"use client";
import { ThemeProvider } from './components/ThemeProvider';

export function Providers({ children }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}