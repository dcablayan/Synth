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
const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.pdf', '.docx'];

async function extractText(filepath: string, ext: string): Promise<string> {
  if (ext === '.txt' || ext === '.md') {
    return fs.readFileSync(filepath, 'utf-8');
  }

  if (ext === '.pdf') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string; numpages: number }>;
      const buffer = fs.readFileSync(filepath);
      const result = await pdfParse(buffer);
      if (!result.text || result.text.trim().length < 20) {
        throw new Error('PDF appears to be scanned or empty — no extractable text found.');
      }
      return result.text;
    } catch (err) {
      throw new Error(
        `Failed to parse PDF "${path.basename(filepath)}": ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  if (ext === '.docx') {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ path: filepath });
      if (result.messages.length > 0) {
        const warnings = result.messages.filter((m) => m.type === 'warning').map((m) => m.message);
        if (warnings.length > 0) {
          console.warn(`  ⚠️  DOCX warnings for ${path.basename(filepath)}: ${warnings.join(', ')}`);
        }
      }
      if (!result.value || result.value.trim().length < 20) {
        throw new Error('DOCX appears empty — no extractable text found.');
      }
      return result.value;
    } catch (err) {
      throw new Error(
        `Failed to parse DOCX "${path.basename(filepath)}": ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

export async function loadDocumentsFromInbox(): Promise<LoadedDocument[]> {
  if (!fs.existsSync(INBOX_DIR)) {
    throw new Error(`Inbox directory not found: ${INBOX_DIR}`);
  }

  const files = fs.readdirSync(INBOX_DIR).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return SUPPORTED_EXTENSIONS.includes(ext) && !f.startsWith('.');
  });

  if (files.length === 0) {
    throw new Error(
      `No documents found in ${INBOX_DIR}. Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`
    );
  }

  const results: LoadedDocument[] = [];
  for (const filename of files) {
    const filepath = path.join(INBOX_DIR, filename);
    const ext = path.extname(filename).toLowerCase();
    try {
      const text = await extractText(filepath, ext);
      results.push({
        filename,
        filepath,
        text,
        sizeBytes: Buffer.byteLength(text, 'utf-8'),
        extension: ext,
      });
    } catch (err) {
      console.error(`  ❌ Skipping ${filename}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (results.length === 0) {
    throw new Error('No documents could be parsed. Check file formats and contents.');
  }

  return results;
}

export async function loadDocumentByFilename(filename: string): Promise<LoadedDocument> {
  const filepath = path.join(INBOX_DIR, filename);
  if (!fs.existsSync(filepath)) {
    throw new Error(`Document not found: ${filepath}`);
  }
  const ext = path.extname(filename).toLowerCase();
  const text = await extractText(filepath, ext);
  return {
    filename,
    filepath,
    text,
    sizeBytes: Buffer.byteLength(text, 'utf-8'),
    extension: ext,
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
