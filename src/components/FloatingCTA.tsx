interface FloatingCTAProps {
  onClick: () => void;
}

export function FloatingCTA({ onClick }: FloatingCTAProps) {
  return (
    <div className="floating-cta">
      <button className="floating-cta__button" onClick={onClick}>
        나도 해보기
      </button>
    </div>
  );
}
