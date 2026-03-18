// Saturday 20:45 KST = Saturday 11:45 UTC
const DRAW_UTC_HOUR = 11;
const DRAW_UTC_MINUTE = 45;
const SATURDAY = 6;

export function getNextDrawTime(): Date {
  const now = new Date();
  const target = new Date(now);

  // Set to next Saturday 11:45 UTC
  const currentDay = target.getUTCDay();
  let daysUntil = (SATURDAY - currentDay + 7) % 7;

  if (daysUntil === 0) {
    // It's Saturday — check if draw time passed
    const currentMinutes = target.getUTCHours() * 60 + target.getUTCMinutes();
    const drawMinutes = DRAW_UTC_HOUR * 60 + DRAW_UTC_MINUTE;
    if (currentMinutes >= drawMinutes) {
      daysUntil = 7;
    }
  }

  target.setUTCDate(target.getUTCDate() + daysUntil);
  target.setUTCHours(DRAW_UTC_HOUR, DRAW_UTC_MINUTE, 0, 0);

  return target;
}

export function isPastDraw(): boolean {
  const now = new Date();
  if (now.getUTCDay() !== SATURDAY) return false;
  const mins = now.getUTCHours() * 60 + now.getUTCMinutes();
  const drawMins = DRAW_UTC_HOUR * 60 + DRAW_UTC_MINUTE;
  return mins >= drawMins;
}

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export function getTimeRemaining(target: Date): TimeRemaining {
  const total = Math.max(0, target.getTime() - Date.now());
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  return { days, hours, minutes, seconds, total };
}

export function getRoundId(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  // ISO week: use Thursday-based calculation
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const jan1Day = jan1.getUTCDay() || 7; // Mon=1..Sun=7
  const firstThursday = new Date(jan1);
  firstThursday.setUTCDate(jan1.getUTCDate() + (4 - jan1Day));
  const weekStart = new Date(firstThursday);
  weekStart.setUTCDate(firstThursday.getUTCDate() - 3); // Monday of week 1

  const diff = now.getTime() - weekStart.getTime();
  const weekNum = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;

  if (weekNum < 1) {
    // Belongs to last year's last week
    return getRoundIdForDate(new Date(Date.UTC(year - 1, 11, 28)));
  }

  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

function getRoundIdForDate(d: Date): string {
  const year = d.getUTCFullYear();
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const jan1Day = jan1.getUTCDay() || 7;
  const firstThursday = new Date(jan1);
  firstThursday.setUTCDate(jan1.getUTCDate() + (4 - jan1Day));
  const weekStart = new Date(firstThursday);
  weekStart.setUTCDate(firstThursday.getUTCDate() - 3);
  const diff = d.getTime() - weekStart.getTime();
  const weekNum = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}
