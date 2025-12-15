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
  codigoVenta,
  vendedor,
  fechaHora,
  direccion
}) {
  try {
    const rawCode = String(codigoVenta || "").trim();

    // Determinar tipo de código
    let barcodeImgHTML = "";
    if (rawCode) {
      const isEAN13 = /^\d{12,13}$/.test(rawCode);
      const bcid = isEAN13 ? "ean13" : "code128";

      barcodeImgHTML = `
        <div class="barcode-container">
          <img
            src="https://bwipjs-api.metafloor.com/?bcid=${bcid}&text=${encodeURIComponent(
              rawCode
            )}&includetext=false&scale=3&height=10"
            class="barcode-img"
          />
          <div class="barcode-text">${rawCode}</div>
        </div>
      `;
    }

    const ticketHTML = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page {
              margin: 0;
            }

            body {
              font-family: monospace;
              font-size: 12px;
              width: 42mm;
              margin: 0;
              padding: 0 6px;
              box-sizing: border-box;
              text-align: center;
            }

            .logo {
              width: 120px;
              margin: 0 auto 6px auto;
              display: block;
            }

            .title {
              font-size: 14px;
              font-weight: bold;
            }

            .product {
              margin: 2px 0;
            }

            .item {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
            }

            hr {
              border: none;
              border-top: 1px dashed #000;
              margin: 6px 0;
            }

            .total {
              font-size: 14px;
              font-weight: bold;
              text-align: right;
            }

            .meta {
              font-size: 11px;
              text-align: left;
              margin-top: 6px;
            }

            .meta-row {
              display: flex;
              justify-content: space-between;
            }

            .barcode-container {
              margin-top: 8px;
              text-align: center;
            }

            .barcode-img {
              display: block;
              margin: 0 auto;
              width: 100%;
              max-width: 220px;
            }

            .barcode-text {
              font-size: 10px;
              margin-top: 2px;
            }

            .footer {
              font-size: 11px;
              margin-top: 8px;
            }
          </style>
        </head>

        <body>
          ${logoUrl ? `<img class="logo" src="${logoUrl}" />` : ""}

          <div class="title">${tienda}</div>
          <div class="title">${titulo}</div>

          <hr />

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

          <hr />

          <div class="total">TOTAL: $${total.toFixed(2)}</div>

          <hr />

          <div class="meta">
            <div class="meta-row">
              <span><strong>Venta:</strong></span>
              <span>${rawCode}</span>
            </div>
            <div class="meta-row">
              <span><strong>Vendedor:</strong></span>
              <span>${vendedor || "No especificado"}</span>
            </div>
            <div class="meta-row">
              <span><strong>Fecha:</strong></span>
              <span>${fechaHora || new Date().toLocaleString()}</span>
            </div>
            ${
              direccion
                ? `<div class="meta-row"><span><strong>Dirección:</strong></span><span>${direccion}</span></div>`
                : ""
            }
          </div>

          ${barcodeImgHTML}

          <div class="footer">${mensaje}</div>
        </body>
      </html>
    `;

    // Si hay driver nativo (Electron / POS)
    if (driver && typeof driver.print === "function") {
      return driver.print({ html: ticketHTML });
    }

    // Fallback web
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.width = "300px";
    iframe.style.height = "600px";
    iframe.style.left = "-10000px";
    iframe.style.top = "0";

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(ticketHTML);
    iframeDoc.close();

    // Esperar a que carguen imágenes (logo + barcode)
    await new Promise((resolve) => {
      const imgs = iframeDoc.images;
      if (!imgs.length) return resolve();

      let loaded = 0;
      [...imgs].forEach((img) => {
        if (img.complete) {
          loaded++;
          if (loaded === imgs.length) resolve();
        } else {
          img.onload = img.onerror = () => {
            loaded++;
            if (loaded === imgs.length) resolve();
          };
        }
      });
    });

    iframe.contentWindow.focus();
    iframe.contentWindow.print();

    setTimeout(() => document.body.removeChild(iframe), 1000);
  } catch (error) {
    console.error("Error en printTicket:", error);
    throw error;
  }
}

export default { setPrintDriver, printTicket };
