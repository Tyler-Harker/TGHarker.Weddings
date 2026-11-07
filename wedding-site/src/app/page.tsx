import Home from "./home";
import ScheduleList from "./components/schedule-list";
import { getSchedule } from "@/lib/schedule-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const entries = await getSchedule("schedule");
  return (
    <Home schedule={
      <section aria-labelledby="home-schedule" className="mt-12 w-full max-w-2xl">
        <h2 id="home-schedule" className="font-serif text-3xl text-foreground text-center mb-6">Schedule</h2>
        <ScheduleList entries={entries} />
      </section>
    } />
  );
}
