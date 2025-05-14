import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import { JSX, useEffect } from "react";

type FancyAlertProps = {
  title: string;
  message: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center' | 'center';
  autoDismiss?: boolean;
  dismissDelay?: number;
  type?: 'success' | 'warning' | 'danger' | 'info';
  onClose?: () => void;
};

const positionClasses: Record<string, string> = {
  'top-left': 'top-4 left-4',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
};

const typeClassMap: Record<string, string> = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-cyan-100 text-cyan-800'
};

const typeIconMap: Record<string, JSX.Element> = {
  success: <CheckCircle className="text-green-600 w-5 h-5 mt-1" />,
  warning: <AlertTriangle className="text-yellow-600 w-5 h-5 mt-1" />,
  danger: <XCircle className="text-red-600 w-5 h-5 mt-1" />,
  info: <Info className="text-cyan-600 w-5 h-5 mt-1" />,
};

export default function FancyAlert({
  title,
  message,
  position = 'top-right',
  autoDismiss = true,
  dismissDelay = 5000,
  type = "success",
  onClose,
}: FancyAlertProps) {

  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(() => {
        onClose?.();
      }, dismissDelay);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, dismissDelay, onClose]);

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ease-in-out ${positionClasses[position]} ${typeClassMap[type]} shadow-lg rounded-xl border border-gray-100 px-6 py-4 min-w-[450px] max-w-sm`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {typeIconMap[type]}
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm mt-1">{message}</p>
          </div>
        </div>
        {!autoDismiss && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
