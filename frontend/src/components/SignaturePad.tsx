import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, Eraser, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface SignaturePadProps {
  onSave: (base64: string) => void;
  onClose: () => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClose }) => {
  const padRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = () => {
    padRef.current?.clear();
    setIsEmpty(true);
  };

  const handleSave = () => {
    if (padRef.current && !padRef.current.isEmpty()) {
      const dataUrl = padRef.current.getCanvas().toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold">Draw your signature</h3>
          <button onClick={onClose} className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
            <SignatureCanvas
              ref={padRef}
              penColor="black"
              canvasProps={{
                className: 'w-full h-64 cursor-crosshair'
              }}
              onEnd={() => setIsEmpty(false)}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t bg-gray-50 px-6 py-4">
          <button
            onClick={handleClear}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <Eraser className="h-4 w-4" />
            Clear
          </button>
          <button
            onClick={handleSave}
            disabled={isEmpty}
            className={cn(
              "flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-medium text-white transition-all",
              isEmpty 
                ? "bg-blue-300 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg"
            )}
          >
            <Check className="h-4 w-4" />
            Save Signature
          </button>
        </div>
      </div>
    </div>
  );
};
