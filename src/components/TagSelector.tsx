import { PICK_TAGS, type PickTag } from '../types/lotto';

interface TagSelectorProps {
  selectedTag: PickTag | undefined;
  onSelect: (tag: PickTag | undefined) => void;
}

export function TagSelector({ selectedTag, onSelect }: TagSelectorProps) {
  return (
    <div className="lotto-tag-selector">
      <span className="lotto-tag-selector__label">태그 (선택)</span>
      <div className="lotto-tag-selector__chips">
        {PICK_TAGS.map((tag) => (
          <button
            key={tag}
            className={`lotto-tag-chip ${selectedTag === tag ? 'lotto-tag-chip--selected' : ''}`}
            onClick={() => onSelect(selectedTag === tag ? undefined : tag)}
            type="button"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
