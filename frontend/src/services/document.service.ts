import type { DraggableItem } from "../components/DraggableOverlay";

export const signDocument = async (file: File, items: DraggableItem[]) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('items', JSON.stringify(items));

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

export const saveDocumentToServer = async (file: File, documentId: string) => {
  const formData = new FormData();
  formData.append('file', file);
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
