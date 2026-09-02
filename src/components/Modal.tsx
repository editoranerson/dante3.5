import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  maxWidth?: string;
}

export function Modal({ open, onClose, children, title, maxWidth = 'max-w-lg' }: ModalProps) {
  const scrollYRef = useRef(0);

  useEffect(() => {
    if (!open) return;

    scrollYRef.current = window.scrollY;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollYRef.current}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.paddingRight = '';
      window.scrollTo(0, scrollYRef.current);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      style={{ maxHeight: '100dvh' }}
    >
      <div
        className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full ${maxWidth} max-w-[100%] sm:max-w-[95%] card bg-ink-800/95 animate-scale-in flex flex-col`}
        style={{
          maxHeight: '90dvh',
          borderRadius: '1rem 1rem 0 0',
        }}
      >
        {title && (
          <div className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-white/10 p-4 sm:p-5">
            <h3 className="font-display text-xl font-semibold text-grape-50">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-grape-200/70 hover:bg-white/10 hover:text-grape-50"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-20 rounded-full p-1.5 text-grape-200/70 hover:bg-white/10 hover:text-grape-50"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        )}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6"
          style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
