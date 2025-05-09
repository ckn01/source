// components/LoadingOverlay.tsx


export default function LoadingOverlay({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white px-6 py-4 rounded-lg shadow-md text-center">
        <p className="text-gray-800 text-lg font-medium">{message}</p>
      </div>
    </div>
  );
}
