"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RemoveContactButtonProps {
  id: number;
  name: string;
  hasResponded: boolean;
}

export default function RemoveContactButton({
  id,
  name,
  hasResponded,
}: RemoveContactButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    const message = hasResponded
      ? `Remove ${name}? This also deletes their RSVP and meal selections.`
      : `Remove ${name} from the guest list?`;
    if (!window.confirm(message)) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/contacts?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
        return;
      }
      setBusy(false);
      window.alert("Couldn't remove that guest. Please try again.");
    } catch {
      setBusy(false);
      window.alert("Couldn't remove that guest. Please try again.");
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={busy}
      className="font-sans text-xs text-muted hover:text-red-700 transition-colors disabled:opacity-50"
    >
      {busy ? "Removing…" : "Remove"}
    </button>
  );
}
