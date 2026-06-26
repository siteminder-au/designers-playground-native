const HTML_TO_IMAGE_SRC =
  'https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/dist/html-to-image.min.js';

let htmlToImagePromise: Promise<any> | null = null;

function loadHtmlToImage(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Not in browser'));
  const existing = (window as any).htmlToImage;
  if (existing) return Promise.resolve(existing);
  if (htmlToImagePromise) return htmlToImagePromise;

  htmlToImagePromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = HTML_TO_IMAGE_SRC;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      const lib = (window as any).htmlToImage;
      if (lib) resolve(lib);
      else reject(new Error('html-to-image loaded but global not found'));
    };
    script.onerror = () => reject(new Error('Failed to load html-to-image from CDN'));
    document.head.appendChild(script);
  });

  return htmlToImagePromise;
}

export async function captureBodyToClipboard(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Web-only feature');
  }
  const lib = await loadHtmlToImage();
  const blob: Blob | null = await lib.toBlob(document.body, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: '#ffffff',
  });
  if (!blob) throw new Error('html-to-image returned null blob');

  if (!navigator.clipboard || typeof (window as any).ClipboardItem === 'undefined') {
    throw new Error('Clipboard image write not supported in this browser');
  }
  await navigator.clipboard.write([
    new (window as any).ClipboardItem({ 'image/png': blob }),
  ]);
}

export function showReviewToast(message: string, isError = false): void {
  if (typeof document === 'undefined') return;
  const div = document.createElement('div');
  div.textContent = message;
  Object.assign(div.style, {
    position: 'fixed',
    bottom: '64px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: isError ? '#dc2626' : '#111',
    color: '#fff',
    padding: '10px 16px',
    borderRadius: '8px',
    fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    fontSize: '13px',
    fontWeight: '600',
    maxWidth: '320px',
    textAlign: 'center',
    zIndex: '99999',
    boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
    pointerEvents: 'none',
    opacity: '0',
    transition: 'opacity 150ms ease-out',
  });
  document.body.appendChild(div);
  requestAnimationFrame(() => { div.style.opacity = '1'; });
  setTimeout(() => {
    div.style.opacity = '0';
    setTimeout(() => div.remove(), 200);
  }, 2400);
}
