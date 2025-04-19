// components/SidebarPanel.tsx
import { X } from "lucide-react";

export default function SidebarPanel({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Overlay */}
      <div
        className={`backdrop-blur-sm fixed inset-0 bg-black bg-opacity-40 z-40 transition-opacity duration-300 ${isOpen ? "opacity-60 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 h-full w-160 bg-white shadow-lg z-50 transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-3 border-b">
          <h1 className="text-2xl font-bold text-cyan-600 mb-1">Filter</h1>
          <button onClick={onClose}>
            <X className="w-5 h-5 cursor-pointer" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-2 overflow-y-auto h-[calc(100%-64px)]">
          {children}
        </div>
      </div>
    </>
  );
}
