// src/services/PrintService.js

let driver = null;

export function setPrintDriver(printDriver) {
  driver = printDriver;
}

export async function printTicket({
  titulo,
  items,
  total,
  mensaje,
  tienda,
  logoUrl,
  codigoVenta
}) {
  try {
    const ticketHTML = `
      <html>
        <head>
          <style>
            @page {
              margin: 0 !important;
            }

            body {
              font-family: monospace;
              font-size: 12px;
              width: 42mm !important;
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              overflow: hidden;
              text-align: center;
              padding-left: 20px !important;
            }

            .logo {
              width: 120px;
              margin: 0 auto 6px auto;
              display: block;
            }

            .title {
              font-size: 14px;
              font-weight: bold;
              word-break: break-word;
              text-align: center;
            }

            .product {
              width: 100%;
              display: block;
              margin: 2px 0;
            }

            .item {
              display: flex;
              justify-content: space-between;
              width: 100%;
              font-size: 12px;
              margin-top: 1px;
              white-space: nowrap;
            }

            .total {
              margin-top: 8px;
              font-size: 14px;
              font-weight: bold;
              text-align: right;
              width: 100%;
            }

            .footer {
              margin-top: 10px;
              word-break: break-word;
              font-size: 11px;
              width: 100%;
              text-align: center;
            }

            .barcode-container {
              text-align: center;
              width: 100%;
              margin-top: 6px;
              margin-bottom: 4px;
            }

            .barcode {
              /* Canvas size handled by JsBarcode; keep height */
              height: 28px !important;
              margin: 0 auto;
              display: block;
            }

            hr {
              border: none;
              border-top: 1px dashed #000;
              margin: 6px 0;
              width: 100%;
            }
          </style>
        </head>

        <body>

          ${logoUrl ? `<img class="logo" src="${logoUrl}"/>` : ""}

          <div class="title">${tienda}</div>
          <div class="title">${titulo}</div>

          <hr/>

          ${items
            .map(
              (item) => `
                <div class="product">
                  <div>${item.nombre}</div>
                  <div class="item">
                    <span>x${item.cantidad}</span>
                    <span>$${item.total.toFixed(2)}</span>
                  </div>
                </div>
              `
            )
            .join("")}

          <hr/>

          <div class="total">TOTAL: $${total.toFixed(2)}</div>

          <hr/>

          <div>Venta: ${codigoVenta || ""}</div>

          ${
            codigoVenta && /^\d{13}$/.test(String(codigoVenta))
              ? `<div class="barcode-container"><canvas class="barcode" width="300" height="48"></canvas><div style="font-size:10px;margin-top:2px;">${codigoVenta}</div></div>`
              : ""
          }

          <div class="footer">${mensaje}</div>

        </body>
      </html>
    `;

    if (driver && typeof driver.print === "function") {
      return driver.print({ html: ticketHTML });
    }

    // Fallback web
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";

    document.body.appendChild(iframe);

    const iframeWin = iframe.contentWindow;
    const iframeDoc = iframeWin.document;

    iframeDoc.open();
    iframeDoc.write(ticketHTML);
    iframeDoc.close();

    // Wait for images (logo/barcode) to load before printing
    function waitForImages(win) {
      return new Promise((resolve) => {
        const imgs = Array.from(win.document.images || []);
        if (imgs.length === 0) {
          resolve();
          return;
        }
        let remaining = imgs.length;
        const done = () => {
          remaining -= 1;
          if (remaining <= 0) resolve();
        };
        imgs.forEach((img) => {
          if (img.complete) {
            done();
          } else {
            img.onload = done;
            img.onerror = done;
          }
        });
      });
    }

    function loadBarcodeLib(win) {
      return new Promise((resolve, reject) => {
        const script = win.document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js";
        script.onload = resolve;
        script.onerror = reject;
        win.document.head.appendChild(script);
      });
    }

    await waitForImages(iframeWin);
    await loadBarcodeLib(iframeWin).catch(() => {});

    const code = String(codigoVenta || "");
    if (/^\d{13}$/.test(code)) {
      const canvas = iframeDoc.querySelector(".barcode");
      if (canvas && iframeWin.JsBarcode) {
        try {
          iframeWin.JsBarcode(canvas, code, {
            format: "EAN13",
            width: 2,
            height: 48,
            displayValue: false,
            margin: 0
          });
        } catch (e) {
          console.warn('JsBarcode render failed:', e);
        }
      }
    }

    iframeWin.focus();
    iframeWin.print();

    setTimeout(() => document.body.removeChild(iframe), 800);

  } catch (error) {
    console.error("Error en printTicket:", error);
    throw error;
  }
}

export default { setPrintDriver, printTicket };
