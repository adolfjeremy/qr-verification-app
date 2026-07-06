import { useState, useRef } from 'react';
import { DocumentUpload } from '../components/DocumentUpload';
import { PdfViewer } from '../components/PdfViewer';
import { SignaturePad } from '../components/SignaturePad';
import { DraggableOverlay, type DraggableItem } from '../components/DraggableOverlay';
import { signDocument, saveDocumentToServer } from '../services/document.service';
import { FileSignature, QrCode, Download, Loader2, Save, Edit } from 'lucide-react';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // fallback if not in secure context
    }
  }
  return 'doc-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
};

export default function SignDocumentPage() {
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);
  const [items, setItems] = useState<DraggableItem[]>([]);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Ref for the container to maintain relative positioning bounds
  const containerRef = useRef<HTMLDivElement>(null);

  const handleAddSignature = (base64: string) => {
    setItems([
      ...items,
      {
        id: `sig-${Date.now()}`,
        type: 'signature',
        base64Image: base64,
        x: 50,
        y: 50,
        width: 150,
        height: 80,
        pageNumber: currentPage,
      },
    ]);
    setShowSignaturePad(false);
  };

  const BASE_URL = import.meta.env.VITE_APP_URL || window.location.origin;

  const handleAddQrCode = () => {
    setItems([
      ...items,
      {
        id: `qr-${Date.now()}`,
        type: 'qrcode_doc',
        qrContent: `${BASE_URL}/doc/${documentId}`,
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        pageNumber: currentPage,
      },
    ]);
  };

  const handleAddVerifyQrCode = () => {
    setItems([
      ...items,
      {
        id: `qr-verify-${Date.now()}`,
        type: 'qrcode_verify',
        qrContent: `${BASE_URL}/verify/${documentId}`,
        x: 160,
        y: 50,
        width: 100,
        height: 100,
        pageNumber: currentPage,
      },
    ]);
  };

  const handleUpdateItem = (id: string, updates: Partial<DraggableItem>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSaveDocument = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);

      await saveDocumentToServer(file, items, documentId);
      setIsSaved(true);
      alert('Document saved successfully!');
    } catch (error) {
      console.error('Error saving document', error);
      alert('Failed to save document. Please check console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!file || !isSaved) return;
    try {
      setIsProcessing(true);
      
      const signedPdfBlob = await signDocument(file, items);
      
      // Trigger download
      const url = URL.createObjectURL(signedPdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `signed-${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error signing document', error);
      alert('Failed to sign document. Please check console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:h-16 justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg shrink-0">
              <FileSignature className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
              DocSign MVP
            </h1>
          </div>
          
          {file && (
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-3 sm:static sm:p-0 sm:border-t-0 sm:bg-transparent z-50 flex gap-2 sm:gap-3 overflow-x-auto sm:overflow-visible hide-scrollbar shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] sm:shadow-none items-center">
              <button
                onClick={() => setShowSignaturePad(true)}
                disabled={isSaved}
                className="flex shrink-0 items-center gap-2 px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium rounded-lg transition-colors"
              >
                <FileSignature className="h-4 w-4 shrink-0" />
                <span className="hidden lg:inline">Add Signature</span>
                <span className="lg:hidden">Signature</span>
              </button>
              <button
                onClick={handleAddQrCode}
                disabled={isSaved}
                className="flex shrink-0 items-center gap-2 px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium rounded-lg transition-colors"
              >
                <QrCode className="h-4 w-4 shrink-0" />
                <span className="hidden lg:inline">Add QR Code</span>
                <span className="lg:hidden">QR</span>
              </button>
              <button
                onClick={handleAddVerifyQrCode}
                disabled={isSaved}
                className="flex shrink-0 items-center gap-2 px-3 sm:px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium rounded-lg transition-colors"
              >
                <QrCode className="h-4 w-4 shrink-0" />
                <span className="hidden lg:inline">Add Verification QR</span>
                <span className="lg:hidden">Verify QR</span>
              </button>
              {!isSaved ? (
                <button
                  onClick={handleSaveDocument}
                  disabled={isProcessing}
                  className="flex shrink-0 items-center gap-2 px-4 sm:px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white text-sm font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <Save className="h-4 w-4 shrink-0" />}
                  <span className="hidden sm:inline">Save Document</span>
                  <span className="sm:hidden">Save</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsSaved(false)}
                  disabled={isProcessing}
                  className="flex shrink-0 items-center gap-2 px-4 sm:px-6 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-70 text-white text-sm font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
                >
                  <Edit className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">Edit Document</span>
                  <span className="sm:hidden">Edit</span>
                </button>
              )}
              
              <div className="relative group shrink-0" title={!isSaved ? "Save the document first" : ""}>
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing || !isSaved}
                  className="flex shrink-0 items-center gap-2 px-4 sm:px-6 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <Download className="h-4 w-4 shrink-0" />}
                  <span className="hidden sm:inline">Export PDF</span>
                  <span className="sm:hidden">Export</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto mt-6 sm:mt-8 px-4 pb-24 sm:pb-8">
        {!file ? (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-4 mt-8 sm:mt-12">
             <DocumentUpload onFileSelect={(f) => { 
                setFile(f); 
                setDocumentId(generateId());
                setIsSaved(false);
             }} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="w-full" ref={containerRef}>
              <PdfViewer 
                file={file} 
                onPageChange={setCurrentPage} 
              >
                {/* Render items that belong to the current page as children of PdfViewer */}
                {items.filter(item => item.pageNumber === currentPage).map(item => (
                  <DraggableOverlay
                    key={item.id}
                    item={item}
                    onChange={handleUpdateItem}
                    onRemove={handleRemoveItem}
                    scale={1.2} // Matching the scale in PdfViewer
                    disabled={isSaved}
                  />
                ))}
              </PdfViewer>
            </div>
          </div>
        )}
      </main>

      {/* Signature Modal */}
      {showSignaturePad && (
        <SignaturePad
          onSave={handleAddSignature}
          onClose={() => setShowSignaturePad(false)}
        />
      )}
    </div>
  );
}
