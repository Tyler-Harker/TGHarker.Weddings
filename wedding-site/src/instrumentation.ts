// Runs once when the server process starts (Next.js instrumentation hook).
export async function register() {
  // Only the Node.js server runtime — not the Edge proxy/middleware.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Startup diagnostics: presence only, never the secret values. If you see a
  // MISSING here, that's why routes are returning 500s.
  console.log(
    "[startup] env — " +
      `DATABASE_URL: ${process.env.DATABASE_URL ? "set" : "MISSING"} | ` +
      `JWT_SECRET: ${process.env.JWT_SECRET ? "set" : "MISSING"} | ` +
      `ADMIN_EMAIL: ${process.env.ADMIN_EMAIL ? "set" : "default(test@test.com)"}`
  );

  try {
    const { runMigrations } = await import("@/lib/migrate");
    await runMigrations();
  } catch (err) {
    // Don't crash-loop the container; the error is logged so it's diagnosable.
    console.error("[startup] migrations failed:", err);
  }
}
