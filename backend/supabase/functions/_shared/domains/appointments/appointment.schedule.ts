import type {
  ClosureDateLike,
  OpeningHoursLike,
} from "../discovery/discovery.utils.ts";

const BAHRAIN_TZ = "Asia/Bahrain";

function parseTimeOnlyToMinutes(time: string | null): number | null {
  if (!time) return null;
  const normalized = time.length === 5 ? `${time}:00` : time;
  const [h, m] = normalized.slice(0, 8).split(":").map(Number);
  return h * 60 + m;
}

function bahrainParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BAHRAIN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "0";

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    dateStr: `${get("year")}-${get("month")}-${get("day")}`,
    dayOfWeek: weekdayMap[get("weekday")] ?? 0,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

function findClosure(
  branchId: string | null,
  dateStr: string,
  closures: ClosureDateLike[],
): ClosureDateLike | null {
  if (branchId) {
    const branchClosure = closures.find(
      (c) => c.branchId === branchId && c.closureDate === dateStr,
    );
    if (branchClosure) return branchClosure;
  }
  return closures.find(
    (c) => c.branchId == null && c.closureDate === dateStr,
  ) ?? null;
}

function findHours(
  branchId: string | null,
  dayOfWeek: number,
  hours: OpeningHoursLike[],
): OpeningHoursLike | null {
  if (branchId) {
    const branchHours = hours.find(
      (h) => h.branchId === branchId && h.dayOfWeek === dayOfWeek,
    );
    if (branchHours) return branchHours;
  }
  return hours.find(
    (h) => h.branchId == null && h.dayOfWeek === dayOfWeek,
  ) ?? null;
}

/** Open window for a branch on a Bahrain calendar date, in minutes from midnight. */
export function getOpenWindowMinutes(
  branchId: string,
  dateStr: string,
  openingHours: OpeningHoursLike[],
  closureDates: ClosureDateLike[],
): { openMin: number; closeMin: number } | null {
  const closure = findClosure(branchId, dateStr, closureDates);
  if (closure) {
    if (closure.isFullDay) return null;
    const openMin = parseTimeOnlyToMinutes(closure.opensAt);
    const closeMin = parseTimeOnlyToMinutes(closure.closesAt);
    if (openMin == null || closeMin == null || closeMin <= openMin) return null;
    return { openMin, closeMin };
  }

  const dayOfWeek = bahrainDayOfWeek(dateStr);
  const hours = findHours(branchId, dayOfWeek, openingHours);
  if (!hours || hours.isClosed) return null;
  const openMin = parseTimeOnlyToMinutes(hours.opensAt);
  const closeMin = parseTimeOnlyToMinutes(hours.closesAt);
  if (openMin == null || closeMin == null || closeMin <= openMin) return null;
  return { openMin, closeMin };
}

function bahrainDayOfWeek(dateStr: string): number {
  // Noon UTC avoids DST edge issues; Bahrain has no DST.
  const d = new Date(`${dateStr}T12:00:00+03:00`);
  return bahrainParts(d).dayOfWeek;
}

/** Instant for Bahrain local date + minutes-from-midnight as ISO string. */
export function bahrainLocalToIso(dateStr: string, minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return new Date(
    `${dateStr}T${pad(h)}:${pad(m)}:00+03:00`,
  ).toISOString();
}

export function isIntervalWithinOpenHours(
  branchId: string,
  start: Date,
  end: Date,
  openingHours: OpeningHoursLike[],
  closureDates: ClosureDateLike[],
): boolean {
  if (end <= start) return false;
  const startParts = bahrainParts(start);
  const endParts = bahrainParts(end);
  // Multi-day appointments not supported for booking.
  if (startParts.dateStr !== endParts.dateStr) return false;

  const window = getOpenWindowMinutes(
    branchId,
    startParts.dateStr,
    openingHours,
    closureDates,
  );
  if (!window) return false;

  return startParts.minutes >= window.openMin &&
    endParts.minutes <= window.closeMin;
}

export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  const as = new Date(aStart).getTime();
  const ae = new Date(aEnd).getTime();
  const bs = new Date(bStart).getTime();
  const be = new Date(bEnd).getTime();
  return as < be && ae > bs;
}

export function generateCandidateSlots(input: {
  dateStr: string;
  branchId: string;
  durationMinutes: number;
  openingHours: OpeningHoursLike[];
  closureDates: ClosureDateLike[];
  occupied: Array<{ start: string; end: string }>;
  slotStepMinutes?: number;
  now?: Date;
  minimumNoticeMinutes?: number;
}): Array<{ start: string; end: string }> {
  const step = input.slotStepMinutes ?? 30;
  const window = getOpenWindowMinutes(
    input.branchId,
    input.dateStr,
    input.openingHours,
    input.closureDates,
  );
  if (!window) return [];

  const now = input.now ?? new Date();
  const noticeMs = (input.minimumNoticeMinutes ?? 0) * 60_000;
  const earliest = new Date(now.getTime() + noticeMs);

  const slots: Array<{ start: string; end: string }> = [];
  for (
    let startMin = window.openMin;
    startMin + input.durationMinutes <= window.closeMin;
    startMin += step
  ) {
    const startIso = bahrainLocalToIso(input.dateStr, startMin);
    const endIso = bahrainLocalToIso(
      input.dateStr,
      startMin + input.durationMinutes,
    );
    const startDate = new Date(startIso);
    if (startDate < earliest) continue;

    const conflicts = input.occupied.some((o) =>
      rangesOverlap(startIso, endIso, o.start, o.end)
    );
    if (conflicts) continue;
    slots.push({ start: startIso, end: endIso });
  }
  return slots;
}
