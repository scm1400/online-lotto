interface HeaderProps {
  isEditMode: boolean;
}

export function Header({ isEditMode }: HeaderProps) {
  return (
    <div className="lotto-header">
      <div className="lotto-header__label">A</div>
      <div className="lotto-header__price">1,000원</div>
      {isEditMode && <div className="lotto-header__badge">수정</div>}
    </div>
  );
}
