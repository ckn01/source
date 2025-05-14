import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import React, { JSX } from 'react';

type DialogProps = {
  isOpen: boolean;
  title: string;
  content: React.ReactNode;
  imageOrIcon?: React.ReactNode;
  type?: 'success' | 'warning' | 'danger' | 'info';
  onCancel: () => void;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
    type?: 'success' | 'warning' | 'danger' | 'info';
  }>;
};

const typeClassMap: Record<string, string> = {
  success: 'bg-green-400 text-green-800',
  warning: 'bg-yellow-400 text-yellow-800',
  danger: 'bg-red-400 text-red-800',
  info: 'bg-cyan-400 text-cyan-800'
};

const typeHoverClassMap: Record<string, string> = {
  success: 'hover:bg-green-700 hover:text-green-100',
  warning: 'hover:bg-yellow-700 hover:text-yellow-100',
  danger: 'hover:bg-red-700 hover:text-red-100',
  info: 'hover:bg-cyan-700 hover:text-cyan-100'
};

const typeColorMap: Record<string, string> = {
  success: 'green',
  warning: 'yellow',
  danger: 'red',
  info: 'cyan',
};

const typeIconMap: Record<string, JSX.Element> = {
  success: <CheckCircle className="w-10 h-10 text-green-500" />,
  warning: <AlertTriangle className="w-10 h-10 text-yellow-500" />,
  danger: <XCircle className="w-10 h-10 text-red-500" />,
  info: <Info className="w-10 h-10 text-cyan-500" />,
};

export default function FancyDialog({
  isOpen,
  title,
  content,
  imageOrIcon,
  type = 'info',
  onCancel,
  actions = [],
}: DialogProps) {
  if (!isOpen) return null;

  const defaultIcon = typeIconMap[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative">
        {/* Icon or image */}
        <div className="flex justify-center mb-4">
          {imageOrIcon ?? defaultIcon}
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-center text-gray-800 mb-2">{title}</h2>

        {/* Content */}
        <div className="text-gray-600 text-center mb-6 break-words whitespace-normal">
          {content}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              className={`px-4 py-2 rounded-lg text-white ${action.variant === 'secondary'
                ? 'bg-gray-400 hover:bg-gray-500'
                : `${typeClassMap[type]} ${typeHoverClassMap[type]}`
                }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
