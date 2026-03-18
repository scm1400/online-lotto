interface WallCounterProps {
  count: number;
}

export function WallCounter({ count }: WallCounterProps) {
  return (
    <div className="wall-counter">
      <span className="wall-counter__number">{count.toLocaleString()}</span>개의 로또가 제출되었습니다
    </div>
  );
}
