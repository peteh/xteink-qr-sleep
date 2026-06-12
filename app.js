'use strict';

/* ── Constants ──────────────────────────────────────── */

const W = 480;
const H = 800;

/* ── Book text simulation ───────────────────────────── */

const BOOK_SAMPLE = `The morning light filtered through the curtains in long golden bands, falling across the worn wooden floor in patterns that shifted imperceptibly as the earth turned. She had been awake for an hour already, lying still, watching the light change.\n\nThere is a particular quality to early morning silence — not the absence of sound, but its suspension, as if the world is holding its breath before the day begins properly. Birds, distant traffic, the house settling: all of it muffled and held apart.\n\nShe reached for the book on the nightstand. The spine was cracked from years of re-reading, the pages soft at the corners. She found her place by habit rather than by the folded corner she had never learned to use.`;

document.getElementById('book-bg').textContent = BOOK_SAMPLE;

/* ── Helpers ────────────────────────────────────────── */

function get(id) { return document.getElementById(id); }

function buildVCard() {
  const name  = get('f-name').value.trim();
  const phone = get('f-phone').value.trim();
  const email = get('f-email').value.trim();
  const org   = get('f-org').value.trim();
  const title = get('f-title').value.trim();
  const url   = get('f-url').value.trim();

  const parts = name.split(' ');
  const first = parts[0] || '';
  const last  = parts.slice(1).join(' ');

  let v = 'BEGIN:VCARD\r\nVERSION:3.0\r\n';
  v += `N:${last};${first};;;\r\n`;
  v += `FN:${name || 'Unknown'}\r\n`;
  if (org)   v += `ORG:${org}\r\n`;
  if (title) v += `TITLE:${title}\r\n`;
  if (phone) v += `TEL;TYPE=CELL:${phone}\r\n`;
  if (email) v += `EMAIL:${email}\r\n`;
  if (url)   v += `URL:${url}\r\n`;
  v += 'END:VCARD';
  return v;
}

/* ── QR generation (returns a canvas element) ───────── */

function generateQRCanvas(text, size) {
  return new Promise((resolve, reject) => {
    const scratch = get('qr-scratch');
    scratch.innerHTML = '';

    const wrapper = document.createElement('div');
    scratch.appendChild(wrapper);

    try {
      new QRCode(wrapper, {
        text,
        width: size,
        height: size,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M,
      });
    } catch (e) {
      reject(e);
      return;
    }

    // QRCode.js renders either a canvas (modern) or img (fallback)
    const tryResolve = () => {
      const canvas = wrapper.querySelector('canvas');
      if (canvas) { resolve(canvas); return; }

      const img = wrapper.querySelector('img');
      if (img) {
        if (img.complete && img.naturalWidth) { resolve(img); return; }
        img.onload = () => resolve(img);
        img.onerror = reject;
        return;
      }
      // Retry if neither element is ready yet
      setTimeout(tryResolve, 50);
    };

    setTimeout(tryResolve, 50);
  });
}

/* ── Rounded rectangle helper ───────────────────────── */

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ── Main render ─────────────────────────────────────── */

async function render() {
  const name         = get('f-name').value.trim() || 'Your Name';
  const jobTitle     = get('f-title').value.trim();
  const org          = get('f-org').value.trim();
  const label        = get('f-label').value.trim() || 'Scan to save contact';
  const qrSize       = parseInt(get('f-qr-size').value, 10);
  const bottomMargin = parseInt(get('f-bottom-margin').value, 10);
  const cornerRadius = parseInt(get('f-corner-radius').value, 10);
  const padding      = parseInt(get('f-padding').value, 10);
  const fontSize     = parseInt(get('f-font-size').value, 10);

  const vcard = buildVCard();
  let qrSrc;
  try {
    qrSrc = await generateQRCanvas(vcard, qrSize);
  } catch (e) {
    console.error('QR generation failed:', e);
    return;
  }

  const canvas = get('out-canvas');
  const ctx = canvas.getContext('2d');

  // ── Full canvas: white (CrossInk makes white transparent in Page Overlay mode)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // ── Layout: QR box in lower third
  const subText    = [jobTitle, org].filter(Boolean).join(' · ');
  const nameH      = Math.round(fontSize * 1.3);
  const subH       = subText ? Math.round((fontSize - 4) * 1.3) : 0;
  const labelH     = Math.round((fontSize - 6) * 1.3);
  const textBlock  = nameH + (subH ? subH + 4 : 0) + labelH + 8;

  const boxW = qrSize + padding * 2;
  const boxH = qrSize + padding * 2 + textBlock + padding;
  const boxX = Math.round((W - boxW) / 2);
  const boxY = H - bottomMargin - boxH;

  // ── White box with rounded border (border is dark, interior white)
  //    Interior stays white → transparent in CrossInk overlay mode
  //    Border stays dark → visible on page
  ctx.fillStyle = '#ffffff';
  roundedRect(ctx, boxX, boxY, boxW, boxH, cornerRadius);
  ctx.fill();

  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 2.5;
  roundedRect(ctx, boxX, boxY, boxW, boxH, cornerRadius);
  ctx.stroke();

  // ── QR code inside box
  const qrX = boxX + padding;
  const qrY = boxY + padding;
  ctx.drawImage(qrSrc, qrX, qrY, qrSize, qrSize);

  // ── Text below QR
  const textY = qrY + qrSize + padding;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // Name
  ctx.fillStyle = '#1a1a1a';
  ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.fillText(name, W / 2, textY);

  // Subtitle
  if (subText) {
    ctx.fillStyle = '#555555';
    ctx.font = `400 ${fontSize - 4}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillText(subText, W / 2, textY + nameH + 4);
  }

  // Label
  ctx.fillStyle = '#888888';
  ctx.font = `400 ${fontSize - 6}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.fillText(label, W / 2, textY + nameH + (subText ? subH + 8 : 4));
}

/* ── Canvas to 24-bit BMP conversion ────────────────────── */

function canvasToBMP24(canvas) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  // Get image data in RGBA format
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Calculate stride (must be multiple of 4)
  const stride = Math.ceil((width * 3) / 4) * 4;
  const pixelDataSize = stride * height;
  
  // BMP file header (14 bytes) + DIB header (40 bytes)
  const headerSize = 54;
  const fileSize = headerSize + pixelDataSize;
  
  // Create buffer for entire BMP file
  const buffer = new ArrayBuffer(fileSize);
  const view = new Uint8Array(buffer);
  
  // ── File Header (14 bytes) ──
  view[0] = 0x42;  // 'B'
  view[1] = 0x4D;  // 'M'
  // File size (little-endian)
  view[2] = fileSize & 0xFF;
  view[3] = (fileSize >> 8) & 0xFF;
  view[4] = (fileSize >> 16) & 0xFF;
  view[5] = (fileSize >> 24) & 0xFF;
  // Reserved (4 bytes, always 0)
  view[6] = 0;
  view[7] = 0;
  view[8] = 0;
  view[9] = 0;
  // Offset to pixel data (14 + 40 = 54, little-endian)
  view[10] = 54;
  view[11] = 0;
  view[12] = 0;
  view[13] = 0;
  
  // ── DIB Header (BITMAPINFOHEADER, 40 bytes) ──
  let offset = 14;
  
  // Header size (40 bytes)
  view[offset++] = 40;
  view[offset++] = 0;
  view[offset++] = 0;
  view[offset++] = 0;
  
  // Width (little-endian)
  view[offset++] = width & 0xFF;
  view[offset++] = (width >> 8) & 0xFF;
  view[offset++] = (width >> 16) & 0xFF;
  view[offset++] = (width >> 24) & 0xFF;
  
  // Height (little-endian, positive = bottom-up)
  view[offset++] = height & 0xFF;
  view[offset++] = (height >> 8) & 0xFF;
  view[offset++] = (height >> 16) & 0xFF;
  view[offset++] = (height >> 24) & 0xFF;
  
  // Planes (1)
  view[offset++] = 1;
  view[offset++] = 0;
  
  // Bits per pixel (24 = 0x18)
  view[offset++] = 24;
  view[offset++] = 0;
  
  // Compression (0 = uncompressed)
  view[offset++] = 0;
  view[offset++] = 0;
  view[offset++] = 0;
  view[offset++] = 0;
  
  // Image size (can be 0 for uncompressed)
  view[offset++] = 0;
  view[offset++] = 0;
  view[offset++] = 0;
  view[offset++] = 0;
  
  // X pixels per meter (0)
  view[offset++] = 0;
  view[offset++] = 0;
  view[offset++] = 0;
  view[offset++] = 0;
  
  // Y pixels per meter (0)
  view[offset++] = 0;
  view[offset++] = 0;
  view[offset++] = 0;
  view[offset++] = 0;
  
  // Colors used (0 = default)
  view[offset++] = 0;
  view[offset++] = 0;
  view[offset++] = 0;
  view[offset++] = 0;
  
  // Important colors (0 = all)
  view[offset++] = 0;
  view[offset++] = 0;
  view[offset++] = 0;
  view[offset++] = 0;
  
  // ── Pixel Data ──
  // BMP stores pixels bottom-up, so we iterate from last row to first
  offset = headerSize;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * 4;
      // BMP uses BGR format, not RGB
      view[offset++] = data[pixelIndex + 2];      // Blue
      view[offset++] = data[pixelIndex + 1];      // Green
      view[offset++] = data[pixelIndex];          // Red
      // Alpha channel is ignored in 24-bit BMP
    }
    // Pad row to 4-byte boundary
    const rowPadding = stride - (width * 3);
    for (let p = 0; p < rowPadding; p++) {
      view[offset++] = 0;
    }
  }
  
  return buffer;
}

/* ── Download BMP ──────────────────────────────────────── */

async function downloadBMP() {
  await render();
  await new Promise(r => setTimeout(r, 100)); // ensure render is flushed

  const canvas = get('out-canvas');
  const bmpBuffer = canvasToBMP24(canvas);
  
  const blob = new Blob([bmpBuffer], { type: 'image/bmp' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (get('f-name').value.trim() || 'contact')
    .toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  a.download = `${safeName}_sleep.bmp`;
  a.href = url;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Slider live labels ───────────────────────────────── */

function bindSlider(inputId, labelId) {
  const input = get(inputId);
  const label = get(labelId);
  input.addEventListener('input', () => {
    label.textContent = input.value;
    render();
  });
}

bindSlider('f-qr-size',       'qr-size-val');
bindSlider('f-bottom-margin', 'bottom-margin-val');
bindSlider('f-corner-radius', 'corner-radius-val');
bindSlider('f-padding',       'padding-val');
bindSlider('f-font-size',     'font-size-val');

/* ── Text input live re-render (debounced) ───────────── */

let debounceTimer;
function debouncedRender() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(render, 300);
}

['f-name','f-phone','f-email','f-org','f-title','f-url','f-label'].forEach(id => {
  get(id).addEventListener('input', debouncedRender);
});

/* ── Button wiring ────────────────────────────────────── */

get('btn-download').addEventListener('click', downloadBMP);
get('btn-preview').addEventListener('click', render);

/* ── Initial render ───────────────────────────────────── */

render();
