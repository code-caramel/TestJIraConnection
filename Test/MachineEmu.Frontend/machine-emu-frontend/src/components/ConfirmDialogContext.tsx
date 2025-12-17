import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import ConfirmDialog from './ConfirmDialog';

interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

interface ConfirmDialogContextType {
  /**
   * Shows a confirmation dialog and returns a promise that resolves to true if confirmed, false if cancelled.
   * This is a drop-in replacement for browser's confirm() function.
   */
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

interface ConfirmDialogState extends ConfirmDialogOptions {
  open: boolean;
  resolve: ((value: boolean) => void) | null;
}

const initialState: ConfirmDialogState = {
  open: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  isDestructive: false,
  resolve: null,
};

interface ConfirmDialogProviderProps {
  children: ReactNode;
}

/**
 * Provider component that wraps the application and provides confirm dialog functionality.
 * Usage:
 * 1. Wrap your app with <ConfirmDialogProvider>
 * 2. Use the useConfirmDialog() hook in any component to show confirmation dialogs
 *
 * Example:
 * const { confirm } = useConfirmDialog();
 * const confirmed = await confirm({ title: 'Delete?', message: 'Are you sure?' });
 * if (confirmed) { // perform action }
 */
export const ConfirmDialogProvider: React.FC<ConfirmDialogProviderProps> = ({ children }) => {
  const [dialogState, setDialogState] = useState<ConfirmDialogState>(initialState);

  const confirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        isDestructive: options.isDestructive || false,
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (dialogState.resolve) {
      dialogState.resolve(true);
    }
    setDialogState(initialState);
  }, [dialogState.resolve]);

  const handleCancel = useCallback(() => {
    if (dialogState.resolve) {
      dialogState.resolve(false);
    }
    setDialogState(initialState);
  }, [dialogState.resolve]);

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        isDestructive={dialogState.isDestructive}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmDialogContext.Provider>
  );
};

/**
 * Hook to access the confirm dialog functionality.
 * Must be used within a ConfirmDialogProvider.
 *
 * @returns An object with a `confirm` function that shows a confirmation dialog
 * @throws Error if used outside of ConfirmDialogProvider
 */
export const useConfirmDialog = (): ConfirmDialogContextType => {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within a ConfirmDialogProvider');
  }
  return context;
};

export default ConfirmDialogProvider;
