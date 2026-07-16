import type { DraggableItem } from "../components/DraggableOverlay";
import api from '../lib/api';

export const publishDocument = async (items: DraggableItem[], documentId: string) => {
  const response = await api.post('/documents/publish', {
    signData: JSON.stringify({ items }),
    documentId
  });
  return response.data;
};

export const exportDocument = async (documentId: string) => {
  const response = await api.get(`/documents/${documentId}/export`, {
    responseType: 'blob', // Important for downloading the PDF
  });
  return response.data; // this is the blob
};

export const saveDocumentToServer = async (items: DraggableItem[], documentId: string) => {
  const response = await api.post('/documents/save', {
    signData: JSON.stringify({ items }),
    documentId
  });

  return response.data;
};

export const createDraftDocument = async (file: File) => {
  const formData = new FormData();
  formData.append('document', file);
  
  const response = await api.post('/documents/draft', formData);
  return response.data;
};
