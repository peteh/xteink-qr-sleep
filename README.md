# QR Sleep Screen Generator — Xteink X3/X4

A self-hosted single-page tool that generates a vCard QR code as a PNG
optimised for the Xteink X3 (600×800) and X4 (480×800) with CrossInk firmware in **Page Overlay** mode.

## How it works

CrossInk's Page Overlay sleep screen mode renders white pixels as transparent,
compositing the image on top of the last book page. This tool outputs a mostly-white
PNG with just the QR box (dark border + white interior + dark text) in the lower third
of the screen. Result: the book text stays readable and the QR floats on top.

## Files

```
index.html   — markup (includes device selection menu)
style.css    — styles
app.js       — QR generation, canvas rendering, PNG download, device management
```

No build step. No backend. No dependencies beyond a CDN-hosted QRCode.js.

## Hosting

Drop all three files into any static hosting directory and serve them.

**Nginx example:**
```nginx
location /qr-sleep/ {
    root /var/www;
    index index.html;
}
```

**Caddy example:**
```
handle /qr-sleep/* {
    root * /var/www/qr-sleep
    file_server
}
```

Works fine behind Nginx Proxy Manager too — just point a proxy host or subpath at it.

## Usage

1. Fill in contact details
2. Adjust size, margin, corner radius to taste
3. Click **Download PNG (480×800)**
4. Copy the PNG into `.sleep/` on the X4's SD card
5. CrossInk: Settings → Display → Sleep Screen → **Page overlay**

## vCard format

Uses vCard 3.0, which has universal support on iOS and Android — scan with the
system camera app, tap the banner, contact saved. No extra app needed.

## Offline use

The only external dependency is QRCode.js loaded from cdnjs. To run fully offline,
download qrcode.min.js and change the script src in index.html to a local path.
