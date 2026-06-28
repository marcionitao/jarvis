// src/state/snackbar.context.tsx
// Global snackbar state — React Context.
// Renderizado uma vez no root layout. Controlado via useSnackbar().

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface SnackbarAction {
  label: string;
  onPress: () => void;
}

export interface SnackbarState {
  visible: boolean;
  message: string;
  action: SnackbarAction | null;
  show: (message: string, action?: SnackbarAction) => void;
  hide: () => void;
}

const SnackbarContext = createContext<SnackbarState | null>(null);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [action, setAction] = useState<SnackbarAction | null>(null);

  const show = useCallback((msg: string, snackAction?: SnackbarAction) => {
    setMessage(msg);
    setAction(snackAction ?? null);
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
    setMessage('');
    setAction(null);
  }, []);

  return (
    <SnackbarContext.Provider value={{ visible, message, action, show, hide }}>
      {children}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar(): SnackbarState {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error('useSnackbar must be used within SnackbarProvider');
  return ctx;
}