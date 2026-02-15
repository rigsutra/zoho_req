import { eachDayOfInterval, isWeekend, parseISO } from "date-fns";

export function calculateBusinessDays(startDate: string, endDate: string): number {
  const days = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  });
  return days.filter((day) => !isWeekend(day)).length;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

export function getTodayISO(): string {
  return new Date().toISOString().split("T")[0]!;
}

export function getWeekBounds(): { weekStart: string; weekEnd: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    weekStart: monday.toISOString().split("T")[0]!,
    weekEnd: sunday.toISOString().split("T")[0]!,
  };
}
