"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Status = "idle" | "loading" | "error";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        router.push("/admin");
        router.refresh();
        return;
      }
      setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <p className="text-xs uppercase tracking-[0.3em] text-muted font-sans mb-3">
        Tyler &amp; Kylie
      </p>
      <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-8">
        Admin
      </h1>

      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="email"
            className="text-xs uppercase tracking-[0.2em] text-muted font-sans"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            className="w-full border border-accent-light bg-white/60 rounded-md px-4 py-3 font-sans text-foreground outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="password"
            className="text-xs uppercase tracking-[0.2em] text-muted font-sans"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            className="w-full border border-accent-light bg-white/60 rounded-md px-4 py-3 font-sans text-foreground outline-none focus:border-accent transition-colors"
          />
        </div>

        {status === "error" && (
          <p role="alert" className="text-sm font-sans text-red-700">
            Invalid email or password.
          </p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="mt-2 w-full rounded-full bg-accent px-8 py-3 font-sans text-sm uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-foreground disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === "loading" ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </main>
  );
}
