import { useEffect, useRef, useState } from 'react';
import { generateAiPrompt } from '../utils/prompt';

interface AiPromptModalProps {
  userId: string;
  roundId: string;
  onClose: () => void;
}

export function AiPromptModal({ userId, roundId, onClose }: AiPromptModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const [copied, setCopied] = useState(false);

  const prompt = generateAiPrompt(userId, roundId);

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
      previousFocus.current?.focus();
    };
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="ticket-detail-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="ai-prompt-modal" role="dialog" aria-label="AI 프롬프트">
        <button className="ticket-detail__close" onClick={onClose} aria-label="닫기">
          ✕
        </button>

        <div className="ai-prompt-modal__title">AI에게 로또 번호를 맡겨보세요</div>

        <pre className="ai-prompt-modal__code">{prompt}</pre>

        <p className="ai-prompt-modal__hint">
          Claude Code, Codex 등 코딩 AI에 붙여넣기 하세요
        </p>

        <p className="ai-prompt-modal__warning">
          이 프롬프트에는 당신의 익명 ID가 포함되어 있습니다.
        </p>

        <button className="ai-prompt-modal__copy-btn" onClick={handleCopy}>
          {copied ? '복사되었습니다!' : '복사하기'}
        </button>

        <p className="ai-prompt-modal__refresh-hint">
          AI가 제출을 완료하면, 페이지를 새로고침하여 벽에서 확인하세요.
        </p>
      </div>
    </div>
  );
}
