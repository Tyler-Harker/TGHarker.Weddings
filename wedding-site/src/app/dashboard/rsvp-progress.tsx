import Link from "next/link";

interface RsvpProgressProps {
  partyDone: boolean;
  mealsDone: boolean;
  declined: boolean;
}

interface Step {
  label: string;
  done: boolean;
  href: string | null; // navigable when set (i.e. the step is unlocked)
}

function CheckSvg() {
  return (
    <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3 3 6.8-6.8a1 1 0 011.4 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function RsvpProgress({
  partyDone,
  mealsDone,
  declined,
}: RsvpProgressProps) {
  const steps: Step[] = declined
    ? [
        { label: "Signed In", done: true, href: null },
        { label: "Response Sent", done: true, href: "/dashboard/party" },
      ]
    : [
        { label: "Signed In", done: true, href: null },
        { label: "Your Party", done: partyDone, href: "/dashboard/party" },
        {
          label: "Dinner",
          done: mealsDone,
          href: partyDone ? "/dashboard/dinner" : null, // locked until party submitted
        },
      ];

  const completed = steps.filter((s) => s.done).length;
  const percent = Math.round((completed / steps.length) * 100);
  // Fill the track to the centre of the last completed node.
  const lastDoneIndex = steps.reduce((acc, s, i) => (s.done ? i : acc), 0);
  const fillPercent =
    steps.length > 1 ? (lastDoneIndex / (steps.length - 1)) * 100 : 0;

  return (
    <div className="rounded-lg border border-accent-light/60 bg-white/40 px-5 py-5 sm:px-6">
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs uppercase tracking-[0.2em] text-muted font-sans">
          Your RSVP Progress
        </p>
        <p className="font-sans text-sm text-foreground">
          {declined ? "Not attending" : `${percent}% complete`}
        </p>
      </div>

      <div className="relative">
        {/* Track behind the nodes (spans node centre to node centre) */}
        <div className="absolute left-3.5 right-3.5 top-[13px] h-0.5 bg-accent-light/40">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${fillPercent}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, i) => {
            const node = (
              <span
                className={`inline-flex items-center justify-center w-7 h-7 shrink-0 rounded-full text-xs font-sans transition-colors ${
                  step.done
                    ? "bg-accent text-white"
                    : "border border-accent-light bg-background text-muted group-hover:border-accent"
                }`}
              >
                {step.done ? <CheckSvg /> : i + 1}
              </span>
            );
            const label = (
              <span
                className={`font-sans text-xs ${
                  step.done ? "text-foreground" : "text-muted"
                } ${
                  step.href
                    ? "group-hover:text-accent group-hover:underline underline-offset-2"
                    : ""
                }`}
              >
                {step.label}
              </span>
            );

            return step.href ? (
              <Link
                key={step.label}
                href={step.href}
                className="group flex flex-col items-center gap-2 text-center"
              >
                {node}
                {label}
              </Link>
            ) : (
              <div
                key={step.label}
                className="flex flex-col items-center gap-2 text-center"
              >
                {node}
                {label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
