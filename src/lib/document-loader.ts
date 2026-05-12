import fs from 'fs';
import path from 'path';

export interface LoadedDocument {
  filename: string;
  filepath: string;
  text: string;
  sizeBytes: number;
  extension: string;
}

const INBOX_DIR = path.join(process.cwd(), 'documents', 'inbox');
const PROCESSED_DIR = path.join(process.cwd(), 'documents', 'processed');

export function loadDocumentsFromInbox(): LoadedDocument[] {
  if (!fs.existsSync(INBOX_DIR)) {
    throw new Error(`Inbox directory not found: ${INBOX_DIR}`);
  }

  const files = fs.readdirSync(INBOX_DIR).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return ['.txt', '.md'].includes(ext) && !f.startsWith('.');
  });

  if (files.length === 0) {
    throw new Error(`No documents found in ${INBOX_DIR}. Drop .txt or .md files to analyze.`);
  }

  return files.map((filename) => {
    const filepath = path.join(INBOX_DIR, filename);
    const text = fs.readFileSync(filepath, 'utf-8');
    return {
      filename,
      filepath,
      text,
      sizeBytes: Buffer.byteLength(text, 'utf-8'),
      extension: path.extname(filename).toLowerCase(),
    };
  });
}

export function loadDocumentByFilename(filename: string): LoadedDocument {
  const filepath = path.join(INBOX_DIR, filename);
  if (!fs.existsSync(filepath)) {
    throw new Error(`Document not found: ${filepath}`);
  }
  const text = fs.readFileSync(filepath, 'utf-8');
  return {
    filename,
    filepath,
    text,
    sizeBytes: Buffer.byteLength(text, 'utf-8'),
    extension: path.extname(filename).toLowerCase(),
  };
}

export function markAsProcessed(filename: string): void {
  const src = path.join(INBOX_DIR, filename);
  const dest = path.join(PROCESSED_DIR, filename);
  if (!fs.existsSync(PROCESSED_DIR)) {
    fs.mkdirSync(PROCESSED_DIR, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

export function getInboxPath(): string {
  return INBOX_DIR;
}

export function getProcessedPath(): string {
  return PROCESSED_DIR;
}
