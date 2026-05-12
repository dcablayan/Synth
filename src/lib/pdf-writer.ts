import fs from 'fs';
import path from 'path';

const REPORTS_DIR = path.join(process.cwd(), 'reports');

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function slug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export function saveHTML(html: string, name: string): string {
  const dir = path.join(REPORTS_DIR, 'html');
  ensureDir(dir);
  const filename = `${name}.html`;
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, html);
  return filepath;
}

export async function generatePDF(htmlPath: string, outputName: string): Promise<string> {
  const dir = path.join(REPORTS_DIR, 'pdfs');
  ensureDir(dir);
  const outputPath = path.join(dir, `${outputName}.pdf`);

  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    await page.setContent(htmlContent, { waitUntil: 'networkidle' });

    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    });

    await browser.close();
    return outputPath;
  } catch (err) {
    throw new Error(
      `PDF generation failed: ${err instanceof Error ? err.message : String(err)}\n` +
        `Run: npx playwright install chromium`
    );
  }
}

export async function generatePDFFromHTML(html: string, name: string): Promise<{ htmlPath: string; pdfPath: string }> {
  const htmlPath = saveHTML(html, name);
  const pdfPath = await generatePDF(htmlPath, name);
  return { htmlPath, pdfPath };
}

export function getPDFDir(): string {
  return path.join(REPORTS_DIR, 'pdfs');
}

export function getHTMLDir(): string {
  return path.join(REPORTS_DIR, 'html');
}
