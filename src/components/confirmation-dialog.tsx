import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import React from 'react';
import { Button } from './ui/button';

interface ConfirmationDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title: string;
  children?: React.ReactNode;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  setIsOpen,
  title,
  children,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isConfirming = false,
}: ConfirmationDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {children}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConfirming}>{cancelText}</AlertDialogCancel>
          <Button onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? 'Confirming...' : confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}