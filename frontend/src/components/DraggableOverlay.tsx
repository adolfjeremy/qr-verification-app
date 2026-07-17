import React from 'react';
import { Rnd } from 'react-rnd';
import { X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import logoVerified from '../assets/logo-verified.png';

export interface DraggableItem {
  id: string;
  type: 'signature' | 'qrcode_doc' | 'qrcode_verify' | 'signature_request';
  base64Image?: string;
  qrContent?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
  signerEmail?: string;
  signerName?: string;
}

interface DraggableOverlayProps {
  item: DraggableItem;
  onChange: (id: string, newProps: Partial<DraggableItem>) => void;
  onRemove: (id: string) => void;
  scale: number;
  disabled?: boolean;
}

export const DraggableOverlay: React.FC<DraggableOverlayProps> = ({ item, onChange, onRemove, scale, disabled }) => {
  // Convert standard points to visual scaled pixels for frontend rendering
  const renderWidth = item.width * scale;
  const renderHeight = item.height * scale;
  const renderX = item.x * scale;
  const renderY = item.y * scale;

  return (
    <Rnd
      size={{ width: renderWidth, height: renderHeight }}
      position={{ x: renderX, y: renderY }}
      onDragStop={(_e, d) => {
        onChange(item.id, { x: d.x / scale, y: d.y / scale });
      }}
      onResizeStop={(_e, _direction, ref, _delta, position) => {
        onChange(item.id, {
          width: parseFloat(ref.style.width) / scale,
          height: parseFloat(ref.style.height) / scale,
          ...position
        });
      }}
      bounds="parent"
      dragGrid={[10 * scale, 10 * scale]}
      resizeGrid={[10 * scale, 10 * scale]}
      disableDragging={disabled}
      enableResizing={!disabled}
      className={`absolute ${!disabled ? 'group border-2 border-dashed border-blue-500 bg-blue-500/10 cursor-move' : ''}`}
    >
      {!disabled && (
        <button
          onClick={() => onRemove(item.id)}
          className="absolute -top-3 -right-3 hidden group-hover:flex items-center justify-center bg-red-500 text-white rounded-full p-1 z-10 hover:bg-red-600 transition-colors shadow-sm"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {item.type === 'signature' && item.base64Image && (
        <img src={item.base64Image} alt="Signature" className="w-full h-full object-contain pointer-events-none" />
      )}

      {item.type === 'qrcode_doc' && (
        <div className="w-full h-full flex items-center justify-center bg-white p-1 pointer-events-none relative">
          <QRCodeSVG
            value={item.qrContent || 'http://192.168.1.4:5173/'}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      )}

      {item.type === 'qrcode_verify' && (
        <div style={{ pointerEvents: 'none', position: 'relative' }}>
          <QRCodeSVG
            value={item.qrContent || ''}
            size={item.width}
            level="H"
            fgColor="#064ad4"
            imageSettings={{
              src: logoVerified,
              height: item.width * 0.40,
              width: item.width * 0.40,
              excavate: true,
            }}
          />
        </div>
      )}

      {item.type === 'signature_request' && (
        <div className="border-2 border-dashed border-blue-400 bg-blue-50/50 flex flex-col items-center justify-center p-2 rounded w-full h-full text-blue-700 pointer-events-none">
          <span className="text-xs font-bold uppercase tracking-wide">Sign Here</span>
          <span className="text-[10px] truncate max-w-full">{item.signerName || 'Remote Signer'}</span>
        </div>
      )}
    </Rnd>
  );
};
