// src/services/drivers/ElectronPrintDriver.js
// Renderer-side driver that asks Electron main to print a ticket HTML silently.

export default class ElectronPrintDriver {
  /**
   * Print the given HTML using Electron.
   * The PrintService passes an object: { html: string }
   * Optionally supports { deviceName?: string, copies?: number }
   */
  async print(ticket) {
    if (!ticket || typeof ticket.html !== 'string') {
      throw new Error('ElectronPrintDriver: missing ticket HTML');
    }

    // Ensure we are in Electron renderer context
    if (typeof window === 'undefined' || typeof window.require !== 'function') {
      throw new Error('ElectronPrintDriver: Electron renderer context not available');
    }

    const { ipcRenderer } = window.require('electron');

    // Default print options suitable for thermal tickets
    const printOptions = {
      silent: true,            // no dialogs
      printBackground: true,   // keep CSS backgrounds
      deviceName: ticket.deviceName || undefined, // printer selection (optional)
      // Other options like margins are controlled via CSS (@page margin:0) in the HTML
    };

    // Copies handling (Electron main should respect this if implemented)
    const copies = Number(ticket.copies || 1);

    // Ask main process to print. Main should:
    // - create hidden BrowserWindow
    // - load provided HTML via data URL
    // - call webContents.print(printOptions)
    // - close window when done
    try {
      const result = await ipcRenderer.invoke('print-ticket-html', {
        html: ticket.html,
        printOptions,
        copies,
      });
      return result;
    } catch (err) {
      // Surface meaningful error to the app
      const msg = (err && err.message) ? err.message : String(err);
      throw new Error(`ElectronPrintDriver: print failed - ${msg}`);
    }
  }
}
