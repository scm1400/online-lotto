const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DRAW_HOUR = 20;
const DRAW_MINUTE = 45;

function getKSTDate(date?: Date): Date {
  const d = date || new Date();
  return new Date(d.getTime() + d.getTimezoneOffset() * 60000 + KST_OFFSET_MS);
}

export function getCurrentRoundId(): string {
  const kst = getKSTDate();
  const year = kst.getFullYear();

  // ISO week number calculation
  const jan4 = new Date(year, 0, 4);
  const startOfYear = new Date(jan4);
  startOfYear.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7)); // Monday of week 1

  const diff = kst.getTime() - startOfYear.getTime();
  const weekNum = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;

  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

export function getDrawTimeForRound(roundId: string): string {
  // Parse round ID like "2026-W12"
  const [yearStr, weekStr] = roundId.split('-W');
  const year = parseInt(yearStr);
  const week = parseInt(weekStr);

  // Find the Saturday of this ISO week
  const jan4 = new Date(year, 0, 4);
  const startOfYear = new Date(jan4);
  startOfYear.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));

  const saturday = new Date(startOfYear);
  saturday.setDate(startOfYear.getDate() + (week - 1) * 7 + 5); // +5 = Saturday
  saturday.setHours(DRAW_HOUR, DRAW_MINUTE, 0, 0);

  // Convert KST to UTC for ISO string
  const utc = new Date(saturday.getTime() - KST_OFFSET_MS);
  return utc.toISOString();
}

export type Phase = 'pre-draw' | 'post-draw' | 'confirmed';

export function getCurrentPhase(drawTimeISO: string, isConfirmed: boolean): Phase {
  if (isConfirmed) return 'confirmed';
  const now = new Date();
  const drawTime = new Date(drawTimeISO);
  return now >= drawTime ? 'post-draw' : 'pre-draw';
}

export function isWithinVoteWindow(
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number
): boolean {
  const kst = getKSTDate();
  const day = kst.getDay(); // 0=Sun, 6=Sat

  if (day !== 6) return false; // Only Saturday

  const hour = kst.getHours();
  const minute = kst.getMinutes();
  const currentMinutes = hour * 60 + minute;
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}
