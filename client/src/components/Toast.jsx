import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl text-xs font-bold ${
          isSuccess
            ? 'bg-[#E4F7F7] border-[#58C4C4] text-[#37A3A3]'
            : isError
            ? 'bg-[#FDF0EC] border-[#F48B67] text-[#D86B47]'
            : 'bg-[#FFF9E8] border-[#FCD575] text-[#2B2523]'
        }`}
      >
        {isSuccess && <CheckCircle2 className="w-4 h-4 text-[#58C4C4] shrink-0" />}
        {isError && <AlertCircle className="w-4 h-4 text-[#F48B67] shrink-0" />}
        {!isSuccess && !isError && <Info className="w-4 h-4 text-[#A67D18] shrink-0" />}

        <span>{toast.message}</span>

        <button onClick={onClose} className="p-1 hover:opacity-80 shrink-0 ml-2">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
