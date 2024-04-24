export namespace FilesManager {
  export interface File {
    text: string;
    embedding: number[];
  }
  
  export interface FileEntry {
    [key: string]: File[]
  }
  
  export interface Files {
    [key: string]: FileEntry;
  }
}