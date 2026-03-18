interface WallCounterProps {
  count: number;
}

export function WallCounter({ count }: WallCounterProps) {
  return (
    <div className="wall-counter">
      현재 <span className="wall-counter__number">{count.toLocaleString()}</span>명이 로또를 작성했습니다
    </div>
  );
}
