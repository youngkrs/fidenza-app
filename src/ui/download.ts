/** Trigger a browser download for an in-memory Blob. */
export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Trigger a browser download for a text payload (SVG, JSON, …). */
export function downloadText(
  filename: string,
  text: string,
  type: string,
): void {
  downloadBlob(filename, new Blob([text], { type }));
}
