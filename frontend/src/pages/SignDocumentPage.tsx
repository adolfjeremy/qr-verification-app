import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DocumentUpload } from '../components/DocumentUpload';
import { PdfViewer } from '../components/PdfViewer';
import { SignaturePad } from '../components/SignaturePad';
import { DraggableOverlay, type DraggableItem } from '../components/DraggableOverlay';
import { publishDocument, exportDocument, saveDocumentToServer, createDraftDocument } from '../services/document.service';
import { FileSignature, QrCode, Download, Loader2, Save, Send, Home } from 'lucide-react';
import api from '../lib/api';

export default function SignDocumentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [documentId, setDocumentId] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  const [isSaved, setIsSaved] = useState(false);
  const [items, setItems] = useState<DraggableItem[]>([]);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Ref for the container to maintain relative positioning bounds
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      setIsProcessing(true);
      api.get(`/documents/${id}`).then(res => {
        setDocumentId(id);
        setPdfUrl(res.data.fileViewUrl);
        
        // Handle legacy items format just in case, but usually it's an array
        let parsedItems = res.data.items;
        if (typeof parsedItems === 'string') {
          try { parsedItems = JSON.parse(parsedItems); } catch(e) { parsedItems = []; }
        }
        setItems(parsedItems || []);
        
        setIsSaved(res.data.status === 'SIGNED');
      }).catch(() => {
        alert('Document not found or unauthorized');
        navigate('/dashboard');
      }).finally(() => {
        setIsProcessing(false);
      });
    } else {
      setPdfUrl(null);
      setItems([]);
    }
  }, [id, navigate]);

  const handleFileUpload = async (f: File) => {
    try {
      setIsProcessing(true);
      const res = await createDraftDocument(f);
      navigate(`/sign/${res.id}`);
    } catch (error) {
      console.error('Error creating draft', error);
      alert('Failed to upload document');
    } finally {
      setIsProcessing(false);
    }
  };

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
    if (!documentId) return;
    try {
      setIsProcessing(true);
      await saveDocumentToServer(items, documentId);
      alert('Draft saved successfully!');
    } catch (error) {
      console.error('Error saving document', error);
      alert('Failed to save document. Please check console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublish = async () => {
    if (!documentId) return;
    try {
      setIsProcessing(true);
      await publishDocument(items, documentId);
      setIsSaved(true);
      alert('Document published successfully!');
    } catch (error) {
      console.error('Error publishing document', error);
      alert('Failed to publish document. Please check console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    if (!documentId || !isSaved) return;
    try {
      setIsProcessing(true);
      
      const signedPdfBlob = await exportDocument(documentId);
      
      // Trigger download
      const url = URL.createObjectURL(signedPdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `signed-document.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting document', error);
      alert('Failed to export document. Please check console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:h-16 justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
              <Home className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg shrink-0">
                <FileSignature className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
                DocSign MVP
              </h1>
            </div>
          </div>
          
          {pdfUrl && (
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
              {!isSaved && (
                <>
                  <button
                    onClick={handleSaveDocument}
                    disabled={isProcessing}
                    className="flex shrink-0 items-center gap-2 px-4 sm:px-6 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-70 text-sm font-medium rounded-lg transition-colors shadow-sm"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <Save className="h-4 w-4 shrink-0" />}
                    <span className="hidden sm:inline">Save as Draft</span>
                    <span className="sm:hidden">Draft</span>
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={isProcessing}
                    className="flex shrink-0 items-center gap-2 px-4 sm:px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white text-sm font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <Send className="h-4 w-4 shrink-0" />}
                    <span className="hidden sm:inline">Publish Document</span>
                    <span className="sm:hidden">Publish</span>
                  </button>
                </>
              )}
              
              {isSaved && (
                <button
                  onClick={handleExport}
                  disabled={isProcessing}
                  className="flex shrink-0 items-center gap-2 px-4 sm:px-6 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <Download className="h-4 w-4 shrink-0" />}
                  <span className="hidden sm:inline">Export PDF</span>
                  <span className="sm:hidden">Export</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto mt-6 sm:mt-8 px-4 pb-24 sm:pb-8">
        {!pdfUrl ? (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-4 mt-8 sm:mt-12">
             {isProcessing ? (
               <div className="flex flex-col items-center justify-center py-20">
                 <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                 <p className="text-slate-600 font-medium">Uploading Document...</p>
               </div>
             ) : (
               <DocumentUpload onFileSelect={handleFileUpload} />
             )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="w-full" ref={containerRef}>
              <PdfViewer 
                file={pdfUrl} 
                onPageChange={setCurrentPage} 
              >
                {/* Render items that belong to the current page as children of PdfViewer */}
                {!isSaved && items.filter(item => item.pageNumber === currentPage).map(item => (
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
