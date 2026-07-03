import fs from 'fs';
import path from 'path';
import { resolveInside, safeFileStem } from './path-safety';

const REPORTS_DIR = path.join(process.cwd(), 'reports');

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

export function saveHTML(html: string, name: string): string {
  const dir = path.join(REPORTS_DIR, 'html');
  ensureDir(dir);
  const filename = `${safeFileStem(name)}.html`;
  const filepath = resolveInside(dir, filename, 'HTML output name');
  fs.writeFileSync(filepath, html);
  return filepath;
}

export async function generatePDF(htmlPath: string, outputName: string): Promise<string> {
  const dir = path.join(REPORTS_DIR, 'pdfs');
  ensureDir(dir);
  const outputPath = resolveInside(dir, `${safeFileStem(outputName)}.pdf`, 'PDF output name');

  let browser: Awaited<ReturnType<(typeof import('playwright'))['chromium']['launch']>> | null = null;
  try {
    const { chromium } = await import('playwright');
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    await page.route('**/*', async (route) => {
      const requestUrl = route.request().url();
      if (/^(?:https?|file):\/\//i.test(requestUrl)) {
        await route.abort();
        return;
      }
      await route.continue();
    });
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    });

    return outputPath;
  } catch (err) {
    throw new Error(
      `PDF generation failed: ${err instanceof Error ? err.message : String(err)}\n` +
        `Run: npx playwright install chromium`
    );
  } finally {
    await browser?.close().catch(() => undefined);
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
