import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomOut, ZoomIn } from 'lucide-react';
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set worker to load locally using Vite
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfViewerProps {
  file: File | string;
  onPageChange?: (page: number) => void;
  onPageLoad?: (pageInfo: { width: number; height: number; pageNumber: number }) => void;
  children?: React.ReactNode;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ file, onPageChange, onPageLoad, children }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    if (onPageChange) onPageChange(1);
  };

  const handlePageLoadSuccess = (page: any) => {
    // page.originalWidth and page.originalHeight returns size in points.
    if (onPageLoad) {
      onPageLoad({
        width: page.originalWidth,
        height: page.originalHeight,
        pageNumber,
      });
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex flex-wrap justify-center gap-2 sm:gap-4 items-center mb-4 p-2 sm:p-3 bg-white shadow-sm rounded-xl border border-slate-200 w-full max-w-sm sm:max-w-none">
        <button 
          disabled={pageNumber <= 1} 
          onClick={() => { setPageNumber(p => p - 1); if (onPageChange) onPageChange(pageNumber - 1); }}
          className="px-2 sm:px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-xs sm:text-sm font-medium transition-colors"
        >
          Prev
        </button>
        <span className="text-xs sm:text-sm font-medium text-slate-700 whitespace-nowrap">
          Page {pageNumber} of {numPages}
        </span>
        <button 
          disabled={pageNumber >= numPages} 
          onClick={() => { setPageNumber(p => p + 1); if (onPageChange) onPageChange(pageNumber + 1); }}
          className="px-2 sm:px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-xs sm:text-sm font-medium transition-colors"
        >
          Next
        </button>
        <div className="hidden sm:block w-px h-6 bg-slate-300 mx-1" />
        <button onClick={() => setScale(s => s - 0.2)} className="px-2 py-1 hover:bg-slate-100 rounded-md text-slate-600 transition-colors" title="Zoom Out">
          <ZoomOut className="w-5 h-5" />
        </button>
        <button onClick={() => setScale(s => s + 0.2)} className="px-2 py-1 hover:bg-slate-100 rounded-md text-slate-600 transition-colors" title="Zoom In">
          <ZoomIn className="w-5 h-5" />
        </button>
      </div>

      <div className="w-full overflow-auto flex justify-start sm:justify-center pb-4 hide-scrollbar">
        <div className="relative inline-block shadow-2xl border border-slate-300 bg-white min-w-min mx-auto">
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            className="flex justify-center"
          >
            <Page 
              pageNumber={pageNumber} 
              scale={scale} 
              onLoadSuccess={handlePageLoadSuccess}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
          {children}
        </div>
      </div>
    </div>
  );
};
