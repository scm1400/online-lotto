import { useState, useEffect } from 'react';
import { getNextDrawTime, getTimeRemaining, isPastDraw, type TimeRemaining } from '../utils/countdown';

export function useCountdown() {
  const [drawTime, setDrawTime] = useState(() => getNextDrawTime());
  const [remaining, setRemaining] = useState<TimeRemaining>(() => getTimeRemaining(drawTime));
  const [pastDraw, setPastDraw] = useState(() => isPastDraw());

  useEffect(() => {
    const tick = () => {
      const nowPast = isPastDraw();
      setPastDraw(nowPast);
      const timeLeft = getTimeRemaining(drawTime);
      setRemaining(timeLeft);
      // Recalculate draw time when countdown reaches 0 or past draw flips
      if (timeLeft.total <= 0 && !nowPast) {
        setDrawTime(getNextDrawTime());
      }
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [drawTime]);

  return {
    days: remaining.days,
    hours: remaining.hours,
    minutes: remaining.minutes,
    seconds: remaining.seconds,
    isPastDraw: pastDraw,
    drawTime,
  };
}
