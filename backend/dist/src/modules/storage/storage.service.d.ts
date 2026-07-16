export declare class StorageService {
    private readonly uploadsDir;
    constructor();
    private ensureUploadsDirExists;
    uploadFile(fileName: string, fileBuffer: Buffer): Promise<string>;
    getFileBuffer(fileName: string): Promise<Buffer>;
    deleteFile(fileName: string): Promise<void>;
}
