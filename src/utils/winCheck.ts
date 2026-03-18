import type { WinRank } from '../types/api';

export function checkWin(
  ticketNumbers: number[],
  winningNumbers: number[],
  bonusNumber: number
): WinRank {
  const winSet = new Set(winningNumbers);
  const matchCount = ticketNumbers.filter((n) => winSet.has(n)).length;
  const hasBonus = ticketNumbers.includes(bonusNumber);

  if (matchCount === 6) return 1;
  if (matchCount === 5 && hasBonus) return 2;
  if (matchCount === 5) return 3;
  if (matchCount === 4) return 4;
  if (matchCount === 3) return 5;
  return null;
}

export function getRankLabel(rank: WinRank): string {
  if (rank === null) return '낙첨';
  return `${rank}등`;
}

export function getRankEmoji(rank: WinRank): string {
  switch (rank) {
    case 1: return '🏆';
    case 2: return '🥈';
    case 3: return '🥉';
    case 4: return '🎯';
    case 5: return '🍀';
    default: return '😢';
  }
}
