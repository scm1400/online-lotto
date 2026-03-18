import { useState, useCallback } from 'react';

interface TagSelectorProps {
  selectedTag: string | undefined;
  onSelect: (tag: string | undefined) => void;
}

const MAX_TAG_LENGTH = 20;

export function TagSelector({ selectedTag, onSelect }: TagSelectorProps) {
  const [text, setText] = useState(selectedTag || '');

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, MAX_TAG_LENGTH);
    setText(value);
    onSelect(value || undefined);
  }, [onSelect]);

  return (
    <div className="lotto-tag-input">
      <label className="lotto-tag-input__label" htmlFor="lotto-tag">
        한마디 (선택, 최대 {MAX_TAG_LENGTH}자)
      </label>
      <input
        id="lotto-tag"
        className="lotto-tag-input__field"
        type="text"
        placeholder="예: 이번엔 될 거야!"
        value={text}
        onChange={handleChange}
        maxLength={MAX_TAG_LENGTH}
        autoComplete="off"
      />
    </div>
  );
}
