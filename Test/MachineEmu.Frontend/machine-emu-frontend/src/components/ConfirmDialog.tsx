import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  IconButton,
  Box,
  useTheme,
} from '@mui/material';
import { Warning as WarningIcon, Close as CloseIcon } from '@mui/icons-material';
import { useCallback, useEffect, useRef } from 'react';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

/**
 * A reusable confirmation dialog component that replaces browser default dialogs.
 * Features:
 * - Accessible with keyboard navigation and screen reader support
 * - Consistent styling with MUI theme
 * - Visual indication for destructive actions
 * - Modal (blocking) behavior
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = false,
}) => {
  const theme = useTheme();
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management for accessibility
  useEffect(() => {
    if (open) {
      // Focus the cancel button for destructive actions (safer default)
      // Focus the confirm button for non-destructive actions
      const timer = setTimeout(() => {
        if (isDestructive) {
          cancelButtonRef.current?.focus();
        } else {
          confirmButtonRef.current?.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, isDestructive]);

  // Handle keyboard events for accessibility
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    },
    [onCancel]
  );

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      onKeyDown={handleKeyDown}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <DialogTitle
        id="confirm-dialog-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isDestructive && (
            <WarningIcon
              sx={{
                color: theme.palette.error.main,
                fontSize: 28,
              }}
              aria-hidden="true"
            />
          )}
          <span>{title}</span>
        </Box>
        <IconButton
          aria-label="Close dialog"
          onClick={onCancel}
          size="small"
          sx={{
            color: theme.palette.grey[500],
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <DialogContentText
          id="confirm-dialog-description"
          sx={{
            color: theme.palette.text.primary,
          }}
        >
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          ref={cancelButtonRef}
          onClick={onCancel}
          variant="outlined"
          color="inherit"
          aria-label={cancelText}
        >
          {cancelText}
        </Button>
        <Button
          ref={confirmButtonRef}
          onClick={onConfirm}
          variant="contained"
          color={isDestructive ? 'error' : 'primary'}
          aria-label={confirmText}
          autoFocus={!isDestructive}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
