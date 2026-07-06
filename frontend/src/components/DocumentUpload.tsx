import React, { useCallback } from 'react';
import { UploadCloud } from 'lucide-react';
import { cn } from '../lib/utils';

interface DocumentUploadProps {
  onFileSelect: (file: File) => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type === 'application/pdf') {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      onFileSelect(files[0]);
    }
  };

  return (
    <div className="flex w-full flex-col items-center justify-center p-8">
      <div 
        className={cn(
          "flex w-full max-w-2xl flex-col items-center justify-center rounded-3xl border-3 border-dashed px-10 py-20 transition-all duration-300 ease-in-out cursor-pointer group",
          isDragging 
            ? "border-blue-500 bg-blue-50 scale-[1.02]" 
            : "border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
          <div className="rounded-full bg-blue-100 p-4 mb-6 group-hover:scale-110 transition-transform duration-300">
            <UploadCloud className="h-10 w-10 text-blue-600" />
          </div>
          <p className="mb-2 text-xl font-bold text-slate-700">
            <span className="text-blue-600">Click to upload</span> or drag and drop
          </p>
          <p className="text-sm text-slate-500">Only PDF documents are supported</p>
          <input 
            id="dropzone-file" 
            type="file" 
            className="hidden" 
            accept="application/pdf"
            onChange={handleChange}
          />
        </label>
      </div>
    </div>
  );
};
