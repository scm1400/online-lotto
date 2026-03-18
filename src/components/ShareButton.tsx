import { useState, useCallback } from 'react';

interface ShareButtonProps {
  ticketId: string;
}

export function ShareButton({ ticketId }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}?ticket=${ticketId}`;

  const handleShare = useCallback(async () => {
    // Try Web Share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: '온라인로또방 — 나의 로또 번호',
          text: '이번 주 로또 번호를 확인해보세요!',
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or not supported — fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  return (
    <button
      className={`share-btn ${copied ? 'share-btn--copied' : ''}`}
      onClick={handleShare}
    >
      {copied ? '복사됨!' : '공유하기'}
    </button>
  );
}
