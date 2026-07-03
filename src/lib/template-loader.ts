import fs from 'fs';
import path from 'path';
import { listRegularFiles, resolveRegularFileInside } from './path-safety';

const TEMPLATES_DIR = path.join(process.cwd(), 'templates');

export function loadTemplate(name: string): string {
  const filepath = resolveRegularFileInside(TEMPLATES_DIR, name, 'template name');
  if (!fs.existsSync(filepath)) {
    throw new Error(`Template not found: ${filepath}`);
  }
  return fs.readFileSync(filepath, 'utf-8');
}

export function listTemplates(): string[] {
  if (!fs.existsSync(TEMPLATES_DIR)) return [];
  return listRegularFiles(TEMPLATES_DIR, (f) => f.endsWith('.html'));
}
