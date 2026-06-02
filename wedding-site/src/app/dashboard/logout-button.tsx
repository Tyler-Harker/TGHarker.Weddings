"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/rsvp/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="text-xs uppercase tracking-[0.2em] text-muted font-sans hover:text-accent transition-colors text-left"
    >
      Sign out
    </button>
  );
}
