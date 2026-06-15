# Contact QR Sleep Screen Generator for Xteink X3/X4

A self-hosted single-page tool that generates a vCard QR code as a PNG
optimised for the Xteink X3 and X4 with Crosspoint or CrossInk firmware in **Page Overlay** mode.

If your reader gets lost, the finder has an easy way to get in touch with you. 

## How it works

Crosspoints/CrossInk's Page Overlay sleep screen mode renders transparent PNGs compositing the image on top of the last book page.

This tool outputs a PNG with a QR box (dark border + white interior + dark text) containing your contact details in the lower third of the screen. This results in the book text staying readable and the QR floats on top.

## Usage

1. Select your device
2. Fill in contact details
3. Adjust size, margin, corner radius to taste
4. Click **Download PNG**
5. Copy the PNG into `.sleep/` on the X4's SD card
6. On the device: Settings → Display → Sleep Screen → **Page overlay**

## vCard format

Uses vCard 3.0, which has universal support on iOS and Android — scan with the
system camera app, tap the banner, contact saved. No extra app needed.

Get the Device

## Buy the Device

### Xteink X4

* [Buy on AliExpress (affiliate)](https://s.click.aliexpress.com/e/_c3XEtWoZ>)
* [Buy on Amazon (affiliate)](https://amzn.to/3QlR9fm)

### Xteink X3

* [Buy on AliExpress (affiliate)](https://amzn.to/4xKYwhk)
* [Buy on Amazon (affiliate)](https://s.click.aliexpress.com/e/_c3FFiS2H)


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