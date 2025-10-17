import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function QRImage({ value, size = 128, alt = "QR" }) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function gen() {
      try {
        const url = await QRCode.toDataURL(String(value), {
          width: size,
          color: { dark: "#000000", light: "#FFFFFF" },
          errorCorrectionLevel: "M",
          margin: 1,
        });
        if (!cancelled) setDataUrl(url);
      } catch (e) {
        if (!cancelled) setDataUrl("");
      }
    }
    gen();
    return () => { cancelled = true; };
  }, [value, size]);

  if (!dataUrl) return null;
  return <img src={dataUrl} width={size} height={size} alt={alt} />;
}
