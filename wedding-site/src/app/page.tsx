"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { WEDDING_DATE } from "@/lib/event";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(): TimeLeft {
  const difference = WEDDING_DATE.getTime() - new Date().getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-serif text-4xl md:text-6xl font-light text-accent">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-2 text-xs md:text-sm uppercase tracking-[0.2em] text-muted font-sans">
        {label}
      </span>
    </div>
  );
}

function Divider() {
  return (
    <div className="w-24 md:w-32 h-px bg-accent-light mx-auto" />
  );
}

export default function Home() {
  // Start at zeros so the server render and first client render match (no
  // hydration mismatch); the real values are filled in after mount.
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const tick = () => setTimeLeft(calculateTimeLeft());
    // setTimeout(0) keeps the first update out of the synchronous effect body.
    const initial = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);

    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      {/* Decorative top element */}
      <div className="text-accent-light text-2xl mb-8 tracking-[0.5em] font-serif">
        ✦
      </div>

      {/* Save the Date header */}
      <p className="text-sm md:text-base uppercase tracking-[0.3em] text-muted font-sans mb-8">
        Save the Date
      </p>

      {/* Couple Photo */}
      <div className="relative mb-8">
        {/* Outer decorative ring */}
        <div className="absolute inset-0 rounded-full border border-accent-light scale-110" />
        {/* Photo container */}
        <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-white shadow-lg">
          <Image
            src="/couple.jpeg"
            alt="Tyler and Kylie"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      <Divider />

      {/* Names */}
      <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-light text-foreground mt-8 mb-4 text-center leading-tight">
        Tyler
        <span className="text-accent mx-3 md:mx-4">&amp;</span>
        Kylie
      </h1>

      {/* Tagline */}
      <p className="font-serif text-xl md:text-2xl text-muted italic mb-8">
        are getting married
      </p>

      <Divider />

      {/* Date */}
      <div className="mt-8 mb-12 text-center">
        <p className="font-serif text-3xl md:text-4xl text-foreground mb-2">
          November 21, 2026
        </p>
        <p className="text-sm uppercase tracking-[0.2em] text-muted font-sans">
          Saturday
        </p>
      </div>

      {/* RSVP call to action */}
      <Link
        href="/rsvp"
        className="mb-12 inline-block rounded-full bg-accent px-10 py-4 font-sans text-sm uppercase tracking-[0.25em] text-white shadow-md transition-colors duration-300 hover:bg-foreground"
      >
        RSVP
      </Link>

      {/* Countdown */}
      <div className="mb-12">
        <p className="text-xs uppercase tracking-[0.3em] text-muted font-sans text-center mb-6">
          Counting down
        </p>
        <div className="flex gap-6 md:gap-10">
          <CountdownUnit value={timeLeft.days} label="Days" />
          <CountdownUnit value={timeLeft.hours} label="Hours" />
          <CountdownUnit value={timeLeft.minutes} label="Minutes" />
          <CountdownUnit value={timeLeft.seconds} label="Seconds" />
        </div>
      </div>

      <Divider />

      {/* Venue */}
      <div className="mt-8 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-muted font-sans mb-3">
          Venue
        </p>
        <a
          href="https://www.desertviewweddings.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-serif text-xl md:text-2xl text-accent hover:text-foreground transition-colors duration-300"
        >
          Desert View Weddings
        </a>
      </div>

      {/* Footer note */}
      <p className="mt-16 text-sm text-muted font-sans text-center max-w-md">
        Formal invitation to follow
      </p>

      {/* Decorative bottom element */}
      <div className="text-accent-light text-2xl mt-8 tracking-[0.5em] font-serif">
        ✦
      </div>
    </main>
  );
}
