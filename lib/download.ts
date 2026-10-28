export function filenameFromDisposition(value?: string): string | null {
  if (!value) return null;
  const utf8 = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8) return decodeURIComponent(utf8[1]);
  const simple = value.match(/filename="?([^";]+)"?/i);
  return simple?.[1] ?? null;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Ensure that a successful HTTP response contains a real ZIP archive, not a JSON error body. */
export async function validateZipResponse(blob: Blob, status: number, contentType?: string): Promise<void> {
  if (status < 200 || status >= 300) throw new Error(`Download request failed (HTTP ${status}).`);
  const type = (contentType || blob.type || '').toLowerCase().split(';')[0].trim();
  if (type === 'application/json' || type.endsWith('+json') || type.startsWith('text/')) {
    throw new Error('The server returned an error response instead of a ZIP file. Please try again.');
  }
  // ZIP signatures: local-file header, empty archive, and spanned archive.
  const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  const valid = header.length === 4 && header[0] === 0x50 && header[1] === 0x4b &&
    ((header[2] === 0x03 && header[3] === 0x04) ||
     (header[2] === 0x05 && header[3] === 0x06) ||
     (header[2] === 0x07 && header[3] === 0x08));
  if (!valid) throw new Error('The server response is not a valid ZIP package. Please try again.');
}
