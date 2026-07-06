"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertYCoordinate = void 0;
const convertYCoordinate = (pdfPageHeight, frontendY, itemHeight) => {
    return pdfPageHeight - frontendY - itemHeight;
};
exports.convertYCoordinate = convertYCoordinate;
//# sourceMappingURL=coordinate.util.js.map