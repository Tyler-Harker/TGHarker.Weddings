"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./logout-button";

const COMING_SOON = ["Schedule", "Travel & Stay", "Registry"];

interface DashboardNavProps {
  firstName: string;
  partyDone: boolean;
  mealsDone: boolean;
  declined: boolean;
}

function CheckIcon() {
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
      <svg
        viewBox="0 0 20 20"
        className="w-3.5 h-3.5 text-green-600"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3 3 6.8-6.8a1 1 0 011.4 0z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="w-4 h-4 text-muted/50"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 2a4 4 0 00-4 4v2H5a1 1 0 00-1 1v7a1 1 0 001 1h10a1 1 0 001-1V9a1 1 0 00-1-1h-1V6a4 4 0 00-4-4zm2 6V6a2 2 0 10-4 0v2h4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function DashboardNav({
  firstName,
  partyDone,
  mealsDone,
  declined,
}: DashboardNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);

  const linkClass =
    "flex items-center justify-between rounded-md px-3 py-2 font-sans text-sm text-foreground hover:bg-accent-light/20 transition-colors";

  const navBody = (
    <>
      <Link
        href="/dashboard"
        onClick={close}
        className="font-serif text-2xl text-foreground"
      >
        Tyler <span className="text-accent">&amp;</span> Kylie
      </Link>
      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted font-sans">
        November 21, 2026
      </p>

      <p className="mt-8 font-serif text-lg text-foreground">
        Welcome, {firstName}
      </p>

      <nav className="mt-8 flex flex-col gap-1">
        <Link
          href="/dashboard"
          onClick={close}
          className={`${linkClass} ${
            pathname === "/dashboard" ? "bg-accent-light/20" : ""
          }`}
        >
          <span>Overview</span>
        </Link>
      </nav>

      <p className="mt-6 mb-1 px-3 text-[0.65rem] uppercase tracking-[0.2em] text-muted/70 font-sans">
        Your RSVP
      </p>
      <nav className="flex flex-col gap-1">
        <Link
          href="/dashboard/party"
          onClick={close}
          className={`${linkClass} ${
            pathname === "/dashboard/party" ? "bg-accent-light/20" : ""
          }`}
        >
          <span>Your Party{declined ? " · Declined" : ""}</span>
          {partyDone && <CheckIcon />}
        </Link>

        {declined ? (
          <span className="flex items-center justify-between rounded-md px-3 py-2 font-sans text-sm text-muted/50 cursor-default">
            <span>Dinner Choices</span>
            <span className="text-[0.6rem] uppercase tracking-wide">N/A</span>
          </span>
        ) : partyDone ? (
          <Link
            href="/dashboard/dinner"
            onClick={close}
            className={`${linkClass} ${
              pathname === "/dashboard/dinner" ? "bg-accent-light/20" : ""
            }`}
          >
            <span>Dinner Choices</span>
            {mealsDone && <CheckIcon />}
          </Link>
        ) : (
          <span
            className="flex items-center justify-between rounded-md px-3 py-2 font-sans text-sm text-muted/60 cursor-default"
            title="Complete Your Party first"
          >
            <span>Dinner Choices</span>
            <LockIcon />
          </span>
        )}
      </nav>

      <p className="mt-6 mb-1 px-3 text-[0.65rem] uppercase tracking-[0.2em] text-muted/70 font-sans">
        More
      </p>
      <nav className="flex flex-col gap-1">
        {COMING_SOON.map((label) => (
          <span
            key={label}
            className="rounded-md px-3 py-2 font-sans text-sm text-muted/60 cursor-default"
            title="Coming soon"
          >
            {label}
          </span>
        ))}
      </nav>

      <div className="mt-auto pt-8">
        <LogoutButton />
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-accent-light/60 bg-background/95 backdrop-blur px-4 py-3">
        <Link href="/dashboard" className="font-serif text-xl text-foreground">
          Tyler <span className="text-accent">&amp;</span> Kylie
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="p-2 -mr-2 text-foreground"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={close}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[82%] bg-background border-r border-accent-light/60 px-6 py-6 flex flex-col overflow-y-auto">
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="self-end p-2 -mr-2 -mt-2 mb-2 text-muted hover:text-accent"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            {navBody}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 border-r border-accent-light/60 bg-white/40 px-6 py-8 flex-col">
        {navBody}
      </aside>
    </>
  );
}
