export const convertYCoordinate = (
  pdfPageHeight: number,
  frontendY: number,
  itemHeight: number,
): number => {
  // pdf-lib origin (0,0) is bottom-left. 
  // Frontend origin (0,0) is top-left.
  return pdfPageHeight - frontendY - itemHeight;
};
