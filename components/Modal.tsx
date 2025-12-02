
import React, { ReactNode, useEffect } from 'react';
import { XIcon } from './Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  showCloseButton?: boolean;
  preventCloseOnOutsideClick?: boolean;
}

const Modal: React.FC<ModalProps> = ({ 
    isOpen, 
    onClose, 
    children, 
    showCloseButton = true, 
    preventCloseOnOutsideClick = false 
}) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!preventCloseOnOutsideClick) {
            onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose, preventCloseOnOutsideClick]);

  if (!isOpen) return null;

  const handleBackdropClick = () => {
      if (!preventCloseOnOutsideClick) {
          onClose();
      }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 animate-modal-fade-in"
      style={{ animation: 'modal-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleBackdropClick}
      ></div>
      <div className="relative z-10 w-full max-w-full flex justify-center my-4 md:my-8 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-fit relative">
            {showCloseButton && (
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors z-50 p-2 rounded-full hover:bg-neutral-800 bg-black/20 backdrop-blur-md"
                aria-label="Close"
            >
                <XIcon className="w-5 h-5" />
            </button>
            )}
            {children}
        </div>
      </div>
    </div>
  );
};

// Add keyframes to a style tag in the head for animation
const style = document.createElement('style');
style.innerHTML = `
  @keyframes modal-fade-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
  }
`;
document.head.appendChild(style);


export default Modal;
