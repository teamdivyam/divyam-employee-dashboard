// Existing Stock Audit image-loading pattern; no alternate PDF renderer.
export async function loadAuditImages(items) {
  const images = new Map();
  const urls = [...new Set(items.map(item => item.image).filter(Boolean))];
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(4, urls.length) }, async () => {
    while (cursor < urls.length) {
      const url = urls[cursor++];
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => { img.src = ""; reject(new Error("An item image timed out. Retry the report download.")); }, 20000);
        img.onload = () => { clearTimeout(timer); resolve(); };
        img.onerror = () => { clearTimeout(timer); reject(new Error("An item image could not be loaded. Check image access and retry; no PDF was downloaded.")); };
        img.src = url;
      });
      const scale = Math.min(1, 600 / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      try { images.set(url, { data: canvas.toDataURL("image/jpeg", 0.92), ratio: canvas.width / canvas.height }); }
      catch { throw new Error("An item image cannot be embedded due to image access restrictions. No PDF was downloaded."); }
    }
  }));
  return images;
}

