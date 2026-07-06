import type { DraggableItem } from "../components/DraggableOverlay";

export const signDocument = async (file: File, items: DraggableItem[]) => {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('signData', JSON.stringify({ items }));

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const response = await fetch(`${API_URL}/api/documents/sign`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to sign document');
  }

  return response.blob();
};

export const saveDocumentToServer = async (file: File, items: DraggableItem[], documentId: string) => {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('signData', JSON.stringify({ items }));
  formData.append('documentId', documentId);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const response = await fetch(`${API_URL}/api/documents/save`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to save document');
  }

  return response.json();
};
