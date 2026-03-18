const KST_OFFSET = 9 * 60; // UTC+9 in minutes
const DRAW_HOUR = 20;
const DRAW_MINUTE = 45;
const SATURDAY = 6;

function toKST(date: Date): Date {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + KST_OFFSET * 60000);
}

export function getNextDrawTime(): Date {
  const now = new Date();
  const kstNow = toKST(now);

  const dayOfWeek = kstNow.getDay();
  let daysUntilSaturday = (SATURDAY - dayOfWeek + 7) % 7;

  // If it's Saturday, check if draw time has passed
  if (daysUntilSaturday === 0) {
    const drawToday = new Date(kstNow);
    drawToday.setHours(DRAW_HOUR, DRAW_MINUTE, 0, 0);
    if (kstNow >= drawToday) {
      daysUntilSaturday = 7; // Next Saturday
    }
  }

  const drawKST = new Date(kstNow);
  drawKST.setDate(drawKST.getDate() + daysUntilSaturday);
  drawKST.setHours(DRAW_HOUR, DRAW_MINUTE, 0, 0);

  // Convert back from KST to local
  const drawUTC = drawKST.getTime() - KST_OFFSET * 60000;
  const drawLocal = new Date(drawUTC - now.getTimezoneOffset() * 60000);

  return drawLocal;
}

export function isPastDraw(): boolean {
  const kstNow = toKST(new Date());
  if (kstNow.getDay() !== SATURDAY) return false;
  const hours = kstNow.getHours();
  const minutes = kstNow.getMinutes();
  return hours > DRAW_HOUR || (hours === DRAW_HOUR && minutes >= DRAW_MINUTE);
}

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number; // total milliseconds
}

export function getTimeRemaining(target: Date): TimeRemaining {
  const total = Math.max(0, target.getTime() - Date.now());
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  return { days, hours, minutes, seconds, total };
}

export function getRoundId(date?: Date): string {
  const d = date ? toKST(date) : toKST(new Date());
  // If past Saturday draw time, use current week; otherwise use current week
  // ISO week: Monday is first day of week
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const dayOfYear = Math.floor((d.getTime() - jan4.getTime()) / 86400000) + 1;
  const weekNum = Math.ceil((dayOfYear + jan4.getDay()) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}
