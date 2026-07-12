import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import { AlertTriangle, Info, X } from "lucide-react";

const TONE_STYLES = {
  danger: {
    iconWrap: "bg-rose-50 text-rose-600",
    confirmButton: "bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-200",
    Icon: AlertTriangle,
  },
  warning: {
    iconWrap: "bg-amber-50 text-amber-600",
    confirmButton: "bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-200",
    Icon: AlertTriangle,
  },
  neutral: {
    iconWrap: "bg-cyan-50 text-cyan-600",
    confirmButton: "bg-slate-950 hover:bg-slate-800 focus-visible:ring-slate-200",
    Icon: Info,
  },
};

const ConfirmationModal = ({
  isOpen,
  title,
  description,
  tone = "neutral",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isLoading = false,
  disableOutsideClose = false,
  onConfirm,
  onClose,
}) => {
  const dialogRef = useRef(null);
  const confirmButtonRef = useRef(null);
  const previouslyFocusedElement = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    previouslyFocusedElement.current = document.activeElement;
    confirmButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !disableOutsideClose) {
        onClose();
        return;
      }

      if (event.key === "Tab") {
        const focusableElements = dialogRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previouslyFocusedElement.current?.focus?.();
    };
  }, [isOpen, disableOutsideClose, onClose]);

  if (!isOpen) return null;

  const { iconWrap, confirmButton, Icon } = TONE_STYLES[tone] || TONE_STYLES.neutral;

  const handleBackdropClick = () => {
    if (!disableOutsideClose && !isLoading) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={handleBackdropClick}
      />

      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        aria-describedby="confirmation-modal-description"
        className="relative w-full max-w-md animate-[modal-in_180ms_ease-out] rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X size={16} />
        </button>

        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconWrap}`}>
          <Icon size={22} />
        </div>

        <h2
          id="confirmation-modal-title"
          className="mt-4 text-lg font-semibold text-slate-950"
        >
          {title}
        </h2>

        <p
          id="confirmation-modal-description"
          className="mt-2 text-sm leading-6 text-slate-600"
        >
          {description}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>

          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            aria-busy={isLoading}
            className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-70 ${confirmButton}`}
          >
            {isLoading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            {isLoading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

ConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.node.isRequired,
  tone: PropTypes.oneOf(["danger", "warning", "neutral"]),
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  isLoading: PropTypes.bool,
  disableOutsideClose: PropTypes.bool,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ConfirmationModal;