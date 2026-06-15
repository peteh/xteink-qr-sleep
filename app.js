'use strict';

/* ── Device Configuration ──────────────────────────────── */

const DEVICES = {
  x4: { name: 'Xteink X4', width: 480, height: 800 },
  x3: { name: 'Xteink X3', width: 528, height: 792 }
};

let currentDevice = 'x4';
let W = DEVICES.x4.width;
let H = DEVICES.x4.height;

/* ── Book text simulation ───────────────────────────── */

const BOOK_SAMPLE = `The sky above the port was the color of television, tuned to a dead channel. "It's not like I'm using," Case heard someone say, as he shouldered his way through the crowd around the door of the Chat. "It's like my body's developed this massive drug deficiency." It was a Sprawl voice and a Sprawl joke. The Chatsubo was a bar for professional expatriates; you could drink there for a week and never hear two words in Japanese. 
Ratz was tending bar, his prosthetic arm jerking monotonously as he filled a tray of glasses with synthetic sake. The bartender's smile was the color of a first-class contractor's fender, just before the whole works goes ceramic. He had a face like a closed fist.
Case had been a cowboy, a rustler, one of a certain breed of quick-handed thieves for hire. He'd operated on an almost permanent adrenaline high, a byproduct of youth and proficiency and proficiency's concomitant. He'd operated out of a suitcase, chasing high-paying jobs like a satellite dish tracking a distant signal, until someone had managed to damage his nervous system with a wartime Russian mycotoxin.`;

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

  // Parse name: assume last space-separated word is last name
  const parts = name.trim().split(/\s+/);
  const last = parts.length > 1 ? parts[parts.length - 1] : '';
  const first = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0];

  let v = 'BEGIN:VCARD\r\n';
  v += 'VERSION:3.0\r\n';
  v += `FN:${name || 'Unknown'}\r\n`;
  v += `N:${last};${first}\r\n`;
  if (org)   v += `ORG:${org}\r\n`;
  if (title) v += `TITLE:${title}\r\n`;
  if (phone) v += `TEL;TYPE=CELL:${phone}\r\n`;
  if (email) v += `EMAIL;TYPE=INTERNET:${email}\r\n`;
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

  // ── Clear canvas to transparent for preview
  ctx.clearRect(0, 0, W, H);

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

/* ── Download PNG ──────────────────────────────────────── */

async function downloadPNG() {
  await render();
  await new Promise(r => setTimeout(r, 100)); // ensure render is flushed

  const canvas = get('out-canvas');
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (get('f-name').value.trim() || 'contact')
      .toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    a.download = `${safeName}_sleep.png`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
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

function changeDevice(deviceId) {
  currentDevice = deviceId;
  const device = DEVICES[deviceId];
  W = device.width;
  H = device.height;
  
  // Update UI
  get('device-label').textContent = device.name;
  get('btn-text').textContent = `Download PNG (${W}×${H})`;
  get('preview-label').textContent = `${W}×${H}`;
  
  // Update canvas dimensions (actual resolution)
  const canvas = get('out-canvas');
  canvas.width = W;
  canvas.height = H;
  
  // Update display size (50% scale)
  const deviceScreen = document.querySelector('.device-screen');
  const displayW = W / 2;
  const displayH = H / 2;
  deviceScreen.style.width = displayW + 'px';
  deviceScreen.style.height = displayH + 'px';
  
  render();
}

get('f-device').addEventListener('change', (e) => {
  changeDevice(e.target.value);
});

get('btn-download').addEventListener('click', downloadPNG);
get('btn-preview').addEventListener('click', render);

/* ── Initial render ───────────────────────────────────── */

render();
