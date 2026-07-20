import fs from 'fs';
import path from 'path';
import { listRegularFiles, resolveInside, resolveRegularFileInside } from './path-safety';

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
export const CONTRACT_EXTENSIONS = SUPPORTED_EXTENSIONS;
export const SPREADSHEET_EXTENSIONS = ['.csv', '.xlsx'];
export const ALL_SUPPORTED_EXTENSIONS = [...SUPPORTED_EXTENSIONS, ...SPREADSHEET_EXTENSIONS];

// pdf-parse v2 exposes a PDFParse class (the v1 default-function API is gone).
export async function extractPdfText(filepath: string): Promise<string> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: fs.readFileSync(filepath) });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

export async function extractText(filepath: string, ext: string): Promise<string> {
  if (ext === '.txt' || ext === '.md') {
    return fs.readFileSync(filepath, 'utf-8');
  }

  if (ext === '.pdf') {
    try {
      const text = await extractPdfText(filepath);
      if (!text || text.trim().length < 20) {
        throw new Error('PDF appears to be scanned or empty — no extractable text found.');
      }
      return text;
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

  if (ext === '.csv') {
    return fs.readFileSync(filepath, 'utf-8');
  }

  if (ext === '.xlsx') {
    try {
      const { parseXlsxFile, buildTableProfile, textSummaryOfSheet } = await import('./spreadsheet-parser');
      const sheets = await parseXlsxFile(filepath);
      return sheets.map((s) => textSummaryOfSheet(s, buildTableProfile(s))).join('\n\n---\n\n');
    } catch (err) {
      throw new Error(
        `Failed to parse XLSX "${path.basename(filepath)}": ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

export interface LoadOptions {
  // Spreadsheets are analyzed by `npm run spreadsheet` / `npm run dataroom`;
  // contract analysis loads them only when explicitly requested.
  includeSpreadsheets?: boolean;
}

export async function loadDocumentsFromInbox(options: LoadOptions = {}): Promise<LoadedDocument[]> {
  if (!fs.existsSync(INBOX_DIR)) {
    throw new Error(`Inbox directory not found: ${INBOX_DIR}`);
  }

  const includeSpreadsheets = options.includeSpreadsheets ?? false;

  const files = listRegularFiles(INBOX_DIR, (f) => {
    const ext = path.extname(f).toLowerCase();
    if (f.startsWith('.')) return false;
    if (SUPPORTED_EXTENSIONS.includes(ext)) return true;
    return includeSpreadsheets && SPREADSHEET_EXTENSIONS.includes(ext);
  });

  const skippedSpreadsheets = includeSpreadsheets
    ? []
    : listRegularFiles(INBOX_DIR, (f) => SPREADSHEET_EXTENSIONS.includes(path.extname(f).toLowerCase()) && !f.startsWith('.'));
  if (skippedSpreadsheets.length > 0) {
    console.log(
      `  ℹ️  Skipping ${skippedSpreadsheets.length} spreadsheet(s) (${skippedSpreadsheets.join(', ')}) — analyze with: npm run spreadsheet / npm run dataroom`
    );
  }

  if (files.length === 0) {
    throw new Error(
      `No documents found in ${INBOX_DIR}. Supported formats: ${(includeSpreadsheets ? ALL_SUPPORTED_EXTENSIONS : SUPPORTED_EXTENSIONS).join(', ')}`
    );
  }

  const results: LoadedDocument[] = [];
  for (const filename of files) {
    const filepath = resolveRegularFileInside(INBOX_DIR, filename, 'document filename');
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
  const filepath = resolveRegularFileInside(INBOX_DIR, filename, 'document filename');
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

// Tolerant loader used for evidence verification: returns whatever inbox text is
// available, keyed by filename, without failing the caller when files are missing.
export async function loadSourceTextsFromInbox(): Promise<Map<string, string>> {
  const texts = new Map<string, string>();
  if (!fs.existsSync(INBOX_DIR)) return texts;

  const files = listRegularFiles(INBOX_DIR, (f) => {
    const ext = path.extname(f).toLowerCase();
    return ALL_SUPPORTED_EXTENSIONS.includes(ext) && !f.startsWith('.');
  });

  for (const filename of files) {
    try {
      const filepath = resolveRegularFileInside(INBOX_DIR, filename, 'document filename');
      const ext = path.extname(filename).toLowerCase();
      texts.set(filename, await extractText(filepath, ext));
    } catch {
      // verification simply reports "source not available" for this file
    }
  }
  return texts;
}

export function markAsProcessed(filename: string): void {
  const safeFilename = path.basename(filename);
  const src = resolveRegularFileInside(INBOX_DIR, filename, 'document filename');
  const dest = resolveInside(PROCESSED_DIR, safeFilename, 'processed filename');
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
