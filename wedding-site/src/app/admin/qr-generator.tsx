"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

function fileNameFor(path: string) {
  const slug = path
    .replace(/^\/+/, "")
    .replace(/[^\w-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `qr-${slug || "home"}.png`;
}

export default function QrGenerator() {
  const [path, setPath] = useState("/rsvp");
  const [origin, setOrigin] = useState("");
  const [readyUrl, setReadyUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // The QR encodes whatever domain the admin is currently viewing from.
  // Deferred so the first (server-matching) client render stays empty.
  useEffect(() => {
    const id = setTimeout(() => setOrigin(window.location.origin), 0);
    return () => clearTimeout(id);
  }, []);

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = origin ? `${origin}${normalizedPath}` : "";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!url || !canvas) return;
    QRCode.toCanvas(
      canvas,
      url,
      { width: 1024, margin: 2, errorCorrectionLevel: "M" },
      (err) => {
        if (err) return;
        // The library renders at 1024px and sets an inline width/height to match;
        // constrain the on-screen size while keeping the 1024px buffer for a
        // crisp download.
        canvas.style.width = "192px";
        canvas.style.height = "192px";
        setReadyUrl(url);
      }
    );
  }, [url]);

  // Ready only once the QR for the *current* url has been drawn.
  const ready = url !== "" && readyUrl === url;

  function download() {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = fileNameFor(normalizedPath);
    link.click();
  }

  return (
    <div className="rounded-lg border border-accent-light/60 bg-white/40 px-5 py-6 sm:px-6 max-w-md">
      <label
        htmlFor="qr-path"
        className="block text-xs uppercase tracking-[0.2em] text-muted font-sans mb-2"
      >
        Link path
      </label>
      <input
        id="qr-path"
        type="text"
        value={path}
        onChange={(e) => setPath(e.target.value)}
        placeholder="/rsvp"
        className="w-full border border-accent-light bg-white/70 rounded-md px-3 py-2 font-sans text-foreground outline-none focus:border-accent transition-colors"
      />
      {origin && (
        <p className="mt-2 text-sm font-sans text-muted break-all">
          Points to:{" "}
          <span className="text-foreground">{url}</span>
        </p>
      )}

      <div className="mt-5 flex flex-col items-center gap-4">
        <div className="bg-white p-3 rounded-lg border border-accent-light/40">
          <canvas ref={canvasRef} className="w-48 h-48 block" />
        </div>
        <button
          type="button"
          onClick={download}
          disabled={!ready}
          className="rounded-full bg-accent px-8 py-3 font-sans text-sm uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-foreground disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Download PNG
        </button>
      </div>
    </div>
  );
}
