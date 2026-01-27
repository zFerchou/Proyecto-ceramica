const WebPrintDriver = {
  print(data) {
    return new Promise((resolve) => {
      const printWindow = window.open("", "PRINT", "height=800,width=420");
      const tienda = data.tienda || "Santo Barro";
      const logoUrl = data.logoUrl || "/src/images/logo.png";
      const codigoVenta = (data.codigoVenta || "").toString();

      const formatLine = (left, right = "", width = 30) => {
        const l = String(left);
        const r = String(right);
        const spaceCount = Math.max(1, width - (l.length + r.length));
        return `${l}${" ".repeat(spaceCount)}${r}`;
      };

      const cuerpoHtml = Array.isArray(data.cuerpo)
        ? data.cuerpo.map((linea) => `<p>${linea}</p>`).join("")
        : (data.items || [])
            .map((it) => `<p>${formatLine(`${it.nombre} x${it.cantidad}`, `$${Number(it.total || it.precio)}`)}</p>`)
            .join("");

      const totalHtml = data.total != null ? `<p style="font-weight:bold;">${formatLine("TOTAL:", `$${Number(data.total).toFixed(2)}`)}</p>` : "";

      // If full HTML provided, print it directly
      if (data.html) {
        printWindow.document.write(data.html);
        printWindow.document.close();
        printWindow.focus();
        // Attempt to print after load
        const onload = function() {
          setTimeout(function(){ printWindow.print(); setTimeout(function(){ printWindow.close(); }, 300); }, 300);
        };
        if (printWindow.document.readyState === 'complete') {
          onload();
        } else {
          printWindow.onload = onload;
        }
        resolve();
        return;
      }

      printWindow.document.write(`
        <html>
        <head>
          <title>Ticket</title>
          <style>
            @page { margin: 10mm; }
            body { font-family: monospace; padding: 10px; }
            .ticket { width: 58mm; }
            .center { text-align: center; }
            .logo { width: 120px; height: auto; margin: 0 auto 6px; display: block; }
            .divider { border-top: 1px dashed #333; margin: 6px 0; }
            .barcode-container { display: flex; justify-content: center; }
            .barcode { width: 100%; height: 50px; }
          </style>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        </head>
        <body>
          <div class="ticket">
            ${logoUrl ? `<img class="logo" src="${logoUrl}" alt="${tienda}" />` : ""}
            <h3 class="center">${data.titulo || 'Ticket de compra'}</h3>
            <p class="center">${tienda}</p>
            <div class="divider"></div>
            ${cuerpoHtml}
            ${totalHtml}
            <div class="divider"></div>
            ${codigoVenta ? `
              <p class="center">Venta: ${codigoVenta}</p>
              <div class="barcode-container"><svg class="barcode"></svg></div>
            ` : ''}
            <p class="center">${data.mensaje || 'Gracias por su compra'}</p>
            <p class="center">${new Date().toLocaleString()}</p>
          </div>
          <script>
            window.onload = function() {
              try {
                var code = '${codigoVenta}';
                if (code && /^\d{13}$/.test(code)) {
                  JsBarcode('.barcode', code, {
                    format: 'EAN13',
                    width: 1,
                    height: 50,
                    displayValue: false,
                    margin: 0,
                    background: '#ffffff',
                    lineColor: '#000'
                  });
                }
              } catch (e) { console.error('Error generando código de barras de venta', e); }
              setTimeout(function(){ window.print(); setTimeout(function(){ window.close(); }, 300); }, 300);
            };
          </script>
        </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();
      // La impresión y cierre se gestionan dentro del onload del contenido
      resolve();
    });
  },
};

export default WebPrintDriver;
