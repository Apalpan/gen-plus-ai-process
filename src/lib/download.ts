/** Lightweight Blob-based file download (no external dependency). */
export function downloadText(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  triggerDownload(filename, blob);
}

export function downloadBlob(filename: string, blob: Blob) {
  triggerDownload(filename, blob);
}

function triggerDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'proceso';
}
