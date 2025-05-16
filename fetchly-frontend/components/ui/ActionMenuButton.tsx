import { APIMethod, dashboardConfig } from "@/app/appConfig";
import { BookOpenText, MoreVertical, PencilIcon, TrashIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import FancyAlert from "./Alert";
import FancyDialog from "./Dialog";

interface ActionMenuButtonProps {
  serial: string;
  tenantCode: string;
  productCode: string;
  objectCode: string;
  viewContentCode: string;
  onDeleteSuccess?: () => void;
}

const ActionMenuButton = ({ serial, tenantCode, productCode, objectCode, viewContentCode, onDeleteSuccess }: ActionMenuButtonProps) => {
  const [open, setOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState<Record<string, any>>({
    "title": null,
    "content": "Alert content",
    "position": "top-right",
    "type": "success",
    "autoDismiss": true
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const [serialForDelete, setSerialForDelete] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  useEffect(() => {
    if (serialForDelete !== null && serialForDelete !== "") {
      setOpen(false)
      setShowDialog(true)
    }
  }, [serialForDelete])

  const handleDelete = async () => {
    try {
      setIsLoading(true);

      const url = `${dashboardConfig.backendAPIURL}/t/${tenantCode}/p/${productCode}/o/${objectCode}/data/${serialForDelete}`;

      const dataResponse = await fetch(url, {
        method: APIMethod.DELETE
      });

      if (!dataResponse.ok) {
        throw new Error("Failed to submit data");
      }

      const data = await dataResponse.json();


      // Check for 200 and redirect
      if (dataResponse.status === 200) {
        // TODO: trigger data refresh in root component
        onDeleteSuccess?.();
        setShowDialog(false);
        setOpen(false);
        setSerialForDelete("");

        setAlertMessage((prev) => {
          const updated = { ...prev[0] };
          updated.title = "Success to delete data";
          updated.content = "";
          updated.type = "success";

          return updated;
        })
      } else {
        setShowDialog(false);
        setOpen(false);
        setSerialForDelete("");

        setAlertMessage((prev) => {
          const updated = { ...prev[0] };
          updated.title = "Failed to delete data";
          updated.content = "Please try again after few more minutes";
          updated.type = "danger";

          return updated;
        })
      }

    } catch (error) {
      console.error("Data API error:", error);

      setShowDialog(false);
      setOpen(false);
      setSerialForDelete("")

      setAlertMessage((prev) => {
        const updated = { ...prev[0] };
        updated.title = "Failed to delete data";
        updated.content = "Please try again after few more minutes";
        updated.type = "danger";

        return updated;
      })
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (alertMessage.title !== null && alertMessage.title !== "") {
      setShowAlert(true)
    }
  }, [alertMessage])

  return (
    <div ref={menuRef} className="relative inline-block text-left">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray font-semibold py-1 px-1 rounded-md transition shadow-[0_4px_0_0_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-none"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {showAlert && (
        <FancyAlert
          title={alertMessage.title}
          message={alertMessage.content}
          position={alertMessage.position}
          autoDismiss={alertMessage.autoDismiss}
          type={alertMessage.type}
          onClose={() => setShowAlert(false)}
        />
      )}

      {showDialog &&
        <FancyDialog
          isOpen={showDialog}
          title="Delete Confirmation"
          type="danger"
          content={`Are you sure you want to delete this item? This action cannot be undone!`}
          onCancel={() => {
            setOpen(false)
            setShowDialog(false)
            setSerialForDelete("")
          }}
          actions={[
            {
              label: 'Delete',
              onClick: handleDelete,
              type: 'danger',
            }
          ]}
        />
      }

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
                setSerialForDelete(serial)
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
