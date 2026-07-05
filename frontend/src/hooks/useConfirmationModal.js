import { useState, useCallback } from "react";

export const useConfirmationModal = () => {
  const [modalState, setModalState] = useState({ isOpen: false, config: null });
  const [isProcessing, setIsProcessing] = useState(false);

  const openConfirmation = useCallback((config) => {
    setModalState({ isOpen: true, config });
  }, []);

  const closeConfirmation = useCallback(() => {
    if (isProcessing) return;
    setModalState({ isOpen: false, config: null });
  }, [isProcessing]);

  const handleConfirm = useCallback(async () => {
    if (!modalState.config?.onConfirm) return;

    try {
      setIsProcessing(true);
      await modalState.config.onConfirm();
      setModalState({ isOpen: false, config: null });
    } finally {
      setIsProcessing(false);
    }
  }, [modalState]);

  return {
    isOpen: modalState.isOpen,
    config: modalState.config,
    isProcessing,
    openConfirmation,
    closeConfirmation,
    handleConfirm,
  };
};