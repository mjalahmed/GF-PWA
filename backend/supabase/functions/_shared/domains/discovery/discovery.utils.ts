/** Haversine great-circle distance in kilometers (approximate). */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
}

const BAHRAIN_TZ = "Asia/Bahrain";

export type BahrainClock = {
  dateStr: string;
  dayOfWeek: number;
  minutesNow: number;
};

export function getBahrainClock(): BahrainClock {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BAHRAIN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(new Date());

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

  const timeStr = `${get("hour")}:${get("minute")}:${get("second")}`;

  return {
    dateStr: `${get("year")}-${get("month")}-${get("day")}`,
    dayOfWeek: weekdayMap[get("weekday")] ?? 0,
    minutesNow: parseTimeToMinutes(timeStr),
  };
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function parseTimeOnlyToMinutes(time: string | null): number | null {
  if (!time) return null;
  const normalized = time.length === 5 ? `${time}:00` : time;
  return parseTimeToMinutes(normalized.slice(0, 8));
}

export type OpeningHoursLike = {
  branchId: string | null;
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
};

export type ClosureDateLike = {
  branchId: string | null;
  closureDate: string;
  isFullDay: boolean;
  opensAt: string | null;
  closesAt: string | null;
};

export type BranchLike = {
  id: string;
  name: string;
  isActive: boolean;
  isPrimary: boolean;
};

export function evaluateOpenNow(input: {
  branches: BranchLike[];
  openingHours: OpeningHoursLike[];
  closureDates: ClosureDateLike[];
}): { isOpen: boolean; branchId: string | null; branchName: string | null } {
  const now = getBahrainClock();
  const activeBranches = input.branches.filter((b) => b.isActive);
  const ordered = [
    ...activeBranches.filter((b) => b.isPrimary),
    ...activeBranches.filter((b) => !b.isPrimary),
  ];

  for (const branch of ordered) {
    if (isBranchOpenAt(branch.id, now, input.openingHours, input.closureDates)) {
      return { isOpen: true, branchId: branch.id, branchName: branch.name };
    }
  }

  return {
    isOpen: isBranchOpenAt(null, now, input.openingHours, input.closureDates),
    branchId: null,
    branchName: null,
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

function isBranchOpenAt(
  branchId: string | null,
  now: BahrainClock,
  openingHours: OpeningHoursLike[],
  closureDates: ClosureDateLike[],
): boolean {
  const closure = findClosure(branchId, now.dateStr, closureDates);
  if (closure) {
    if (closure.isFullDay) return false;
    const openMin = parseTimeOnlyToMinutes(closure.opensAt);
    const closeMin = parseTimeOnlyToMinutes(closure.closesAt);
    if (openMin != null && closeMin != null) {
      return now.minutesNow >= openMin && now.minutesNow < closeMin;
    }
    return false;
  }

  const hours = findHours(branchId, now.dayOfWeek, openingHours);
  if (!hours || hours.isClosed) return false;

  const openMin = parseTimeOnlyToMinutes(hours.opensAt);
  const closeMin = parseTimeOnlyToMinutes(hours.closesAt);
  if (openMin == null || closeMin == null) return false;

  return now.minutesNow >= openMin && now.minutesNow < closeMin;
}

export function normalizeSearchQuery(query?: string): string | undefined {
  if (!query) return undefined;
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return undefined;
  return trimmed.replace(/[%_\\]/g, "");
}
