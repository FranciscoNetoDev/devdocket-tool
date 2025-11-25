export class StorageService {
  static async uploadUserStoryAttachment(
    _file: File,
    _userId: string,
    _userStoryId: string
  ): Promise<string> {
    throw new Error("Upload de anexos não está configurado no backend atual.");
  }

  static async saveAttachmentMetadata(
    _userStoryId: string,
    _fileName: string,
    _fileUrl: string,
    _fileSize: number,
    _fileType: string,
    _uploadedBy: string
  ): Promise<void> {
    throw new Error("Persistência de metadados de anexos não está configurada no backend atual.");
  }
}
