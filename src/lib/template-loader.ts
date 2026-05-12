import fs from 'fs';
import path from 'path';

const TEMPLATES_DIR = path.join(process.cwd(), 'templates');

export function loadTemplate(name: string): string {
  const filepath = path.join(TEMPLATES_DIR, name);
  if (!fs.existsSync(filepath)) {
    throw new Error(`Template not found: ${filepath}`);
  }
  return fs.readFileSync(filepath, 'utf-8');
}

export function listTemplates(): string[] {
  if (!fs.existsSync(TEMPLATES_DIR)) return [];
  return fs.readdirSync(TEMPLATES_DIR).filter((f) => f.endsWith('.html'));
}
