import fs from 'fs';
import path from 'path';

function isInside(baseDir: string, targetPath: string): boolean {
  const relative = path.relative(path.resolve(baseDir), path.resolve(targetPath));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

export function resolveInside(baseDir: string, candidate: string, label = 'path'): string {
  const resolved = path.resolve(baseDir, candidate);
  if (!isInside(baseDir, resolved)) {
    throw new Error(`Unsafe ${label}: path escapes ${baseDir}`);
  }
  return resolved;
}

export function resolveRegularFileInside(baseDir: string, filename: string, label = 'file'): string {
  const resolved = resolveInside(baseDir, filename, label);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Unsafe ${label}: file not found`);
  }
  const stat = fs.lstatSync(resolved);
  if (!stat.isFile()) {
    throw new Error(`Unsafe ${label}: expected a regular file`);
  }
  return resolved;
}

export function listRegularFiles(dir: string, predicate: (filename: string) => boolean): string[] {
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && predicate(entry.name))
    .map((entry) => entry.name)
    .sort();
}

export function safeFileStem(value: string, fallback = 'report'): string {
  const stem = value
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return stem || fallback;
}
