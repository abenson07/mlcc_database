import { useEffect, useState } from "react";
import clsx from "clsx";

type ToastProps = {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
};

const Toast = ({ message, isVisible, onClose, duration = 2000 }: ToastProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Trigger animation after a brief delay to ensure DOM is ready
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
        // Wait for fade out animation to complete before calling onClose
        setTimeout(() => {
          onClose();
        }, 300);
      }, duration);
      
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div
        className={clsx(
          "rounded-lg bg-primary-700 px-4 py-3 text-sm font-medium text-white shadow-lg transition-all duration-300 ease-out",
          isAnimating
            ? "translate-y-0 opacity-100"
            : "translate-y-[120%] opacity-0"
        )}
      >
        {message}
      </div>
    </div>
  );
};

export default Toast;

