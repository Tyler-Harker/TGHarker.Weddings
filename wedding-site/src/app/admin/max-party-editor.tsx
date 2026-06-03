"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MaxPartyEditor({
  id,
  value,
}: {
  id: number;
  value: number;
}) {
  const router = useRouter();
  const [val, setVal] = useState(value);
  const [busy, setBusy] = useState(false);

  async function update(next: number) {
    if (next < 1 || next === val || busy) return;
    const previous = val;
    setVal(next);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, maxPartySize: next }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        setVal(previous);
      }
    } catch {
      setVal(previous);
    } finally {
      setBusy(false);
    }
  }

  const btn =
    "inline-flex items-center justify-center w-6 h-6 rounded-full border border-accent-light text-foreground hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors";

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        aria-label="Decrease party size"
        onClick={() => update(val - 1)}
        disabled={busy || val <= 1}
        className={btn}
      >
        −
      </button>
      <span className="font-sans tabular-nums w-4 text-center">{val}</span>
      <button
        type="button"
        aria-label="Increase party size"
        onClick={() => update(val + 1)}
        disabled={busy}
        className={btn}
      >
        +
      </button>
    </div>
  );
}
