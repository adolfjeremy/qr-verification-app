import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, Eraser, Check, Loader2, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface SignaturePadProps {
  onSave: (base64: string) => void;
  onClose: () => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClose }) => {
  const padRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [activeTab, setActiveTab] = useState<'DRAW' | 'SAVED'>('DRAW');
  const [savedSignatures, setSavedSignatures] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveForLater, setSaveForLater] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteSigId, setDeleteSigId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'SAVED') {
      loadSavedSignatures();
    }
  }, [activeTab]);

  const loadSavedSignatures = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/users/signatures');
      setSavedSignatures(res.data);
    } catch (err) {
      console.error('Failed to load saved signatures');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    padRef.current?.clear();
    setIsEmpty(true);
  };

  const handleSave = async () => {
    if (padRef.current && !padRef.current.isEmpty()) {
      const dataUrl = padRef.current.getCanvas().toDataURL('image/png');
      
      if (saveForLater) {
        setIsSaving(true);
        try {
          await api.post('/users/signatures', { signatureBase64: dataUrl });
        } catch(e) {
          console.error('Failed to save signature for later');
        } finally {
          setIsSaving(false);
        }
      }
      onSave(dataUrl);
    }
  };

  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteSigId(id);
  };

  const confirmDeleteSig = async () => {
    if (!deleteSigId) return;
    try {
      await api.delete(`/users/signatures/${deleteSigId}`);
      setSavedSignatures(prev => prev.filter(s => s.id !== deleteSigId));
      toast.success('Signature deleted');
    } catch(err) {
      toast.error('Failed to delete signature');
    } finally {
      setDeleteSigId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-full">
        <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
          <h3 className="text-lg font-semibold">Sign Document</h3>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex border-b shrink-0">
          <button 
            className={cn("flex-1 py-3 text-sm font-medium border-b-2 transition-colors", activeTab === 'DRAW' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50")}
            onClick={() => setActiveTab('DRAW')}
          >
            Draw New
          </button>
          <button 
            className={cn("flex-1 py-3 text-sm font-medium border-b-2 transition-colors", activeTab === 'SAVED' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50")}
            onClick={() => setActiveTab('SAVED')}
          >
            Saved Signatures
          </button>
        </div>

        <div className="p-6 overflow-y-auto min-h-[300px]">
          {activeTab === 'DRAW' ? (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50">
                <SignatureCanvas
                  ref={padRef}
                  penColor="black"
                  canvasProps={{
                    className: 'w-full h-48 cursor-crosshair'
                  }}
                  onEnd={() => setIsEmpty(false)}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 hover:text-slate-900">
                <input 
                  type="checkbox" 
                  checked={saveForLater}
                  onChange={(e) => setSaveForLater(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                />
                Save this signature for future use
              </label>
            </div>
          ) : (
            <div>
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : savedSignatures.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  You don't have any saved signatures yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {savedSignatures.map(sig => (
                    <div 
                      key={sig.id} 
                      onClick={() => onSave(sig.signatureBase64)}
                      className="relative border rounded-lg p-2 bg-slate-50 hover:bg-slate-100 hover:border-blue-300 cursor-pointer transition-colors group aspect-[2/1] flex items-center justify-center"
                    >
                      <img src={sig.signatureBase64} alt="Saved signature" className="max-h-full max-w-full object-contain pointer-events-none" />
                      <button 
                        onClick={(e) => handleDeleteSaved(sig.id, e)}
                        className="absolute top-1 right-1 p-1.5 bg-white/80 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                        title="Delete signature"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {activeTab === 'DRAW' && (
          <div className="flex items-center justify-end gap-3 border-t bg-slate-50 px-6 py-4 shrink-0">
            <button
              onClick={handleClear}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <Eraser className="h-4 w-4" />
              Clear
            </button>
            <button
              onClick={handleSave}
              disabled={isEmpty || isSaving}
              className={cn(
                "flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-medium text-white transition-all",
                (isEmpty || isSaving)
                  ? "bg-blue-300 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg"
              )}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {isSaving ? 'Saving...' : 'Use Signature'}
            </button>
          </div>
        )}
      </div>

      {/* Premium Delete Modal for Signature */}
      {deleteSigId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Signature?</h3>
              <p className="text-slate-500 mb-8">
                Are you sure you want to delete this saved signature? You won't be able to use it again.
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmDeleteSig}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors w-full shadow-md hover:shadow-lg"
                >
                  Yes, Delete it
                </button>
                <button
                  autoFocus
                  onClick={() => setDeleteSigId(null)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors w-full"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
