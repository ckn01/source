import { BookOpenText, MoreVertical, PencilIcon, TrashIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ActionMenuButtonProps {
  serial: string;
  tenantCode: string;
  productCode: string;
  objectCode: string;
  viewContentCode: string;
}

const ActionMenuButton = ({ serial, tenantCode, productCode, objectCode, viewContentCode }: ActionMenuButtonProps) => {
  const [open, setOpen] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative inline-block text-left">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray font-semibold py-1 px-1 rounded-md transition shadow-[0_4px_0_0_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-none"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-40 rounded-lg shadow-[0_4px_0_0_rgba(0,0,0,0.4)] bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-2 text-sm text-gray-700 flex flex-col">
            <button
              className="flex gap-1 cursor-pointer w-full text-left px-4 py-2 hover:bg-gray-200"
              onClick={() => {
                // Handle edit action, redirect to ./edit/serial
                window.location.href = `/${tenantCode}/${productCode}/${objectCode}/${viewContentCode}/edit/${serial}`;
              }}
            >
              <PencilIcon size={16} /> Edit
            </button>
            <button
              className="flex gap-1 cursor-pointer w-full text-left px-4 py-2 hover:bg-gray-200 text-cyan-600"
              onClick={() => {
                window.location.href = `/${tenantCode}/${productCode}/${objectCode}/${viewContentCode}/detail/${serial}`;
              }}
            >
              <BookOpenText size={16} /> View Details
            </button>
            <button
              className="flex gap-1 cursor-pointer w-full text-left px-4 py-2 hover:bg-gray-200 text-red-600"
              onClick={() => {

              }}
            >
              <TrashIcon size={16} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionMenuButton;
