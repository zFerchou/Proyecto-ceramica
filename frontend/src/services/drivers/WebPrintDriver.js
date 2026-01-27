// src/services/drivers/WebPrintDriver.js

export default class WebPrintDriver {
  async print(ticketHTML) {
    return new Promise((resolve, reject) => {
      try {
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "0";

        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(ticketHTML.html);
        doc.close();

        // Ensure print after content renders
        setTimeout(() => {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          document.body.removeChild(iframe);
          resolve();
        }, 500);
      } catch (e) {
        reject(e);
      }
    });
  }
}
