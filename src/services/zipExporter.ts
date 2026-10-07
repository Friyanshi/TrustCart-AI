import JSZip from 'jszip';

// Icon data URIs / base64 or fallback generators
// Generate minimal valid 16x16 PNG for fallback
const BASE64_PNG_ICON = 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAM0lEQVR4nO3BMQEAAADCoPVPbQ0PoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBsDEQAAAG8J06CAAAAAElFTkSuQmCC';

export async function generateExtensionZip(): Promise<Blob> {
  const zip = new JSZip();

  // Try fetching raw files or use bundled files
  const fetchOrFallback = async (path: string, fallback: string) => {
    try {
      const res = await fetch(path);
      if (res.ok) return await res.text();
    } catch (e) {
      // Fallback
    }
    return fallback;
  };

  // We fetch through server or build from source
  try {
    const manifestRes = await fetch('/trustcart-ai/manifest.json');
    if (manifestRes.ok) {
      // Fetch directly from server static
      const files = [
        'manifest.json',
        'popup/popup.html',
        'popup/popup.css',
        'popup/popup.js',
        'sidepanel/sidepanel.html',
        'sidepanel/sidepanel.css',
        'sidepanel/sidepanel.js',
        'content/extractor.js',
        'content/content.js',
        'background/service-worker.js',
        'utils/scoring.js',
        'utils/validation.js',
        'utils/storage.js',
        'ai/analyzer.js',
        'ai/prompts.js',
        'dashboard/dashboard.html',
        'dashboard/dashboard.css',
        'dashboard/dashboard.js',
        'README.md',
        '.gitignore'
      ];

      for (const file of files) {
        try {
          const res = await fetch(`/${file.startsWith('trustcart-ai') ? file : `trustcart-ai/${file}`}`);
          if (res.ok) {
            const content = await res.text();
            zip.file(file, content);
          }
        } catch (err) {
          console.warn(`Could not bundle ${file}`, err);
        }
      }

      // Add icons
      for (const size of [16, 48, 128]) {
        try {
          const iconRes = await fetch(`/trustcart-ai/assets/icons/icon${size}.png`);
          if (iconRes.ok) {
            const blob = await iconRes.blob();
            zip.file(`assets/icons/icon${size}.png`, blob);
          } else {
            zip.file(`assets/icons/icon${size}.png`, BASE64_PNG_ICON, { base64: true });
          }
        } catch (e) {
          zip.file(`assets/icons/icon${size}.png`, BASE64_PNG_ICON, { base64: true });
        }
      }

      return await zip.generateAsync({ type: 'blob' });
    }
  } catch (err) {
    console.warn('Network fetch of extension files encountered error, generating fallback bundle:', err);
  }

  // Fallback generation
  zip.file('README.md', '# TrustCart AI Extension\n\nRun npm run build to export full bundle.');
  return await zip.generateAsync({ type: 'blob' });
}
