// Utility to generate EAN-13 compatible numeric codes
// Exports a generator that ensures uniqueness against the DB using a provided client

// Compute EAN-13 checksum for a 12-digit base string
function ean13Checksum(base12) {
  if (!/^\d{12}$/.test(base12)) {
    throw new Error("EAN-13 checksum requires 12 digits");
  }
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = base12.charCodeAt(i) - 48; // faster parse
    // positions are 1-indexed in the spec; odd positions weight 1, even positions weight 3
    sum += (i % 2 === 0) ? digit : digit * 3;
  }
  const mod = sum % 10;
  const check = (10 - mod) % 10;
  return String(check);
}

function randomDigits(n) {
  let s = "";
  for (let i = 0; i < n; i++) {
    s += Math.floor(Math.random() * 10);
  }
  return s;
}

// Generate a 13-digit EAN-like code. Default prefix '209' reserves a namespace for tickets.
export function generateEAN13({ prefix = "209" } = {}) {
  if (!/^\d{1,11}$/.test(prefix)) {
    throw new Error("Prefix must be 1-11 digits");
  }
  const needed = 12 - prefix.length;
  const base12 = prefix + randomDigits(needed);
  const check = ean13Checksum(base12);
  return base12 + check;
}

// Ensure uniqueness in the 'ticket.codigo_venta' column using the given DB client
export async function generateUniqueTicketBarcode(client, { attempts = 7, prefix = "209" } = {}) {
  for (let i = 0; i < attempts; i++) {
    const code = generateEAN13({ prefix });
    // Check existence
    const result = await client.query(
      "SELECT 1 FROM ticket WHERE codigo_venta = $1 LIMIT 1",
      [code]
    );
    if (result.rowCount === 0) return code;
  }
  throw new Error("No se pudo generar un código de venta único tras varios intentos");
}

export default { generateEAN13, generateUniqueTicketBarcode };
