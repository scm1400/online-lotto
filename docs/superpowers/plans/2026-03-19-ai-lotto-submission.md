# AI 로또 번호 제출 기능 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 유저가 "AI에게 시키기" 버튼을 눌러 코딩 AI용 프롬프트를 복사하고, AI가 curl로 로또 번호를 제출할 수 있는 기능 구현

**Architecture:** 기존 `POST /api/tickets` 엔드포인트에 `mode: 'ai'` 값을 추가. 프론트엔드에 프롬프트 생성 모달과 AI 티켓 시각적 구분(뱃지+글로우) 추가. 새 파일 2개(`AiPromptModal.tsx`, `prompt.ts`), 나머지는 기존 파일 수정.

**Tech Stack:** React 18, TypeScript, Hono (Cloudflare Workers), CSS

**Spec:** `docs/superpowers/specs/2026-03-19-ai-lotto-submission-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/types/lotto.ts` | `SelectionMode`에 `'ai'` 추가, `PICK_TAGS`에 `'AI'` 추가 |
| Modify | `worker/routes/tickets.ts` | 서버 mode 유효성 검증 추가 |
| Create | `src/utils/prompt.ts` | AI 프롬프트 문자열 생성 함수 |
| Create | `src/components/AiPromptModal.tsx` | 프롬프트 표시/복사 모달 |
| Modify | `src/components/ActionBar.tsx` | "AI에게 시키기" 버튼 추가 |
| Modify | `src/components/TicketCard.tsx` | AI 티켓 뱃지 + 글로우 스타일 |
| Modify | `src/components/TicketDetail.tsx` | 모드 라벨에 `'ai'` → "AI 선택" 추가 |
| Modify | `src/components/MyTicketsPanel.tsx` | 모드 라벨에 `'ai'` → "AI 선택" 추가, AI 뱃지 |
| Modify | `src/styles/app.css` | AI 티켓 카드 스타일, 모달 스타일, 버튼 스타일 |
| Modify | `src/components/HeatmapOverlay.tsx` | 사람/AI 인기번호 분리 표시 |

---

### Task 1: 타입 확장 — SelectionMode에 'ai' 추가

**Files:**
- Modify: `src/types/lotto.ts:21-24`

- [ ] **Step 1: `SelectionMode` 타입에 `'ai'` 추가**

`src/types/lotto.ts:21`을 수정:

```typescript
export type SelectionMode = 'manual' | 'semi_auto' | 'auto' | 'ai';
```

- [ ] **Step 2: `PICK_TAGS`에 `'AI'` 추가**

`src/types/lotto.ts:23`을 수정:

```typescript
export const PICK_TAGS = ['감', '생일', '꿈', '역배', '자동', '매번 고정', 'AI'] as const;
```

- [ ] **Step 3: 커밋**

```bash
git add src/types/lotto.ts
git commit -m "feat: add 'ai' to SelectionMode type and PICK_TAGS"
```

---

### Task 2: 백엔드 — mode 유효성 검증 추가

**Files:**
- Modify: `worker/routes/tickets.ts:11-18`

- [ ] **Step 1: mode 유효성 검증 로직 추가**

`worker/routes/tickets.ts`의 POST 핸들러에서, numbers 검증 블록 이후(`line 30` 다음), round 생성 이전에 추가:

```typescript
  // Validate mode
  const VALID_MODES = ['manual', 'semi_auto', 'auto', 'ai'];
  if (!body.mode || !VALID_MODES.includes(body.mode)) {
    return c.json({ ok: false, error: '유효하지 않은 모드입니다' }, 400);
  }
```

삽입 위치: `line 30` (`번호는 1~45 사이여야 합니다` 에러 반환) 바로 다음, `line 32` (`const roundId`) 이전.

- [ ] **Step 2: curl로 유효/무효 mode 테스트**

유효한 요청 (로컬 개발 서버 실행 중일 때):
```bash
curl -s -X POST http://localhost:8787/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"numbers":[1,2,3,4,5,6],"mode":"ai","userId":"test-user","roundId":"1"}' | head -c 200
```
Expected: `{"ok":true,...}` (201)

무효한 mode:
```bash
curl -s -X POST http://localhost:8787/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"numbers":[1,2,3,4,5,6],"mode":"invalid","userId":"test-user","roundId":"1"}' | head -c 200
```
Expected: `{"ok":false,"error":"유효하지 않은 모드입니다"}` (400)

- [ ] **Step 3: 커밋**

```bash
git add worker/routes/tickets.ts
git commit -m "feat: add server-side mode validation for ticket submissions"
```

---

### Task 3: 프롬프트 생성 유틸리티 함수

**Files:**
- Create: `src/utils/prompt.ts`

- [ ] **Step 1: `generateAiPrompt` 함수 작성**

`src/utils/prompt.ts` 파일 생성:

```typescript
export function generateAiPrompt(userId: string, roundId: string): string {
  const origin = window.location.origin;

  return `1~45 사이의 숫자 6개를 랜덤으로 골라서, 아래 curl 명령어의 numbers 배열에 넣어 실행해줘.

curl -X POST "${origin}/api/tickets" \\
  -H "Content-Type: application/json" \\
  -d '{
    "numbers": [여기에 6개 숫자],
    "mode": "ai",
    "pickTag": "AI",
    "userId": "${userId}",
    "roundId": "${roundId}"
  }'`;
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/utils/prompt.ts
git commit -m "feat: add AI prompt generation utility"
```

---

### Task 4: AiPromptModal 컴포넌트

**Files:**
- Create: `src/components/AiPromptModal.tsx`

- [ ] **Step 1: 모달 컴포넌트 작성**

`src/components/AiPromptModal.tsx` 파일 생성. 기존 `TicketDetail.tsx`의 모달 패턴(overlay click, Escape 키, focus 복원)을 따른다.

```tsx
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
```

- [ ] **Step 2: 커밋**

```bash
git add src/components/AiPromptModal.tsx
git commit -m "feat: add AiPromptModal component"
```

---

### Task 5: ActionBar에 "AI에게 시키기" 버튼 추가

**Files:**
- Modify: `src/components/ActionBar.tsx`

- [ ] **Step 1: props에 `onAiSubmit` 콜백 추가**

`ActionBar.tsx`의 `ActionBarProps` 인터페이스에 추가:

```typescript
interface ActionBarProps {
  selectionCount: number;
  isComplete: boolean;
  isAnimating: boolean;
  isInventoryFull: boolean;
  isEditMode: boolean;
  widgetMode?: 'standalone' | 'wall';
  onAutoFill: () => void;
  onReset: () => void;
  onComplete: () => void;
  onAiSubmit?: () => void;  // 새로 추가
}
```

함수 파라미터에도 `onAiSubmit` 추가.

- [ ] **Step 2: "AI에게 시키기" 버튼 추가**

기존 "벽에 붙이기" 버튼 앞에 (즉, `</div>` 태그와 primary 버튼 사이) AI 버튼 추가:

```tsx
      {onAiSubmit && (
        <button
          className="lotto-btn lotto-btn--ai"
          onClick={onAiSubmit}
          disabled={isAnimating}
          type="button"
        >
          AI에게 시키기
        </button>
      )}
```

삽입 위치: `</div>` (line 43, action-bar__row 닫는 태그) 이후, 기존 primary 버튼 (line 44) 이전.

- [ ] **Step 3: 커밋**

```bash
git add src/components/ActionBar.tsx
git commit -m "feat: add AI submit button to ActionBar"
```

---

### Task 6: App.tsx에 모달 상태 연결

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: import 추가**

`src/App.tsx` 상단에 추가:

```typescript
import { AiPromptModal } from './components/AiPromptModal';
```

- [ ] **Step 2: 모달 상태 추가**

`App` 컴포넌트 안, 기존 state 선언들 근처(`showMyTickets` 근처)에 추가:

```typescript
const [showAiPrompt, setShowAiPrompt] = useState(false);
```

- [ ] **Step 3: LottoWidget에 onAiSubmit prop 연결**

`LottoWidget` 컴포넌트를 찾아서 확인 — `LottoWidget`이 내부적으로 `ActionBar`를 렌더링하므로, `LottoWidget`에도 `onAiSubmit` prop을 전달해야 한다.

먼저 `src/components/LottoWidget.tsx`를 확인하여 `ActionBar`에 props를 어떻게 전달하는지 파악한 후, `LottoWidgetProps` 인터페이스(`src/types/lotto.ts:41-52`)에 `onAiSubmit?: () => void`를 추가하고, `LottoWidget` 내부에서 `ActionBar`에 전달.

`src/types/lotto.ts`의 `LottoWidgetProps`에 추가:
```typescript
onAiSubmit?: () => void;
```

`LottoWidget.tsx` 내부에서 `ActionBar` 렌더링 시 `onAiSubmit={onAiSubmit}` prop 전달.

`App.tsx`의 `LottoWidget` 사용 부분에서:
```tsx
<LottoWidget
  penSkin={DEFAULT_PEN}
  reducedAnimations={false}
  widgetMode="wall"
  onDraftComplete={async () => {}}
  onSubmitSuccess={handleSubmitSuccess}
  onWidgetClose={() => setView('wall')}
  onAiSubmit={() => setShowAiPrompt(true)}
/>
```

- [ ] **Step 4: 모달 렌더링 추가**

`App.tsx`의 JSX 맨 아래, `{showMyTickets && ...}` 블록 다음에 추가:

```tsx
{showAiPrompt && roundId && (
  <AiPromptModal
    userId={getUserId()}
    roundId={roundId}
    onClose={() => setShowAiPrompt(false)}
  />
)}
```

- [ ] **Step 5: 커밋**

```bash
git add src/App.tsx src/components/LottoWidget.tsx src/types/lotto.ts
git commit -m "feat: wire AiPromptModal into App via LottoWidget"
```

---

### Task 7: AI 티켓 시각 구분 — TicketCard

**Files:**
- Modify: `src/components/TicketCard.tsx`
- Modify: `src/styles/app.css`

- [ ] **Step 1: TicketCard에 AI 뱃지 + 클래스 추가**

`src/components/TicketCard.tsx`의 `ticket-card` div에 AI 조건 클래스 추가:

```tsx
<div
  className={`ticket-card ${isMine ? 'ticket-card--mine' : ''} ${ticket.mode === 'ai' ? 'ticket-card--ai' : ''}`}
  onClick={onClick}
  role="button"
  tabIndex={0}
  aria-label={`로또 번호: ${ticket.numbers.join(', ')}`}
  onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
>
  <div className="ticket-card__tape" />
  {ticket.mode === 'ai' && <div className="ticket-card__ai-badge">AI</div>}
  <div className="ticket-card__numbers">
```

- [ ] **Step 2: CSS 스타일 추가**

`src/styles/app.css`에 AI 티켓 카드 스타일 추가 (기존 `.ticket-card` 스타일 블록 근처):

```css
.ticket-card--ai {
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.4), 0 0 4px rgba(139, 92, 246, 0.2);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(168, 85, 247, 0.1));
}

.ticket-card__ai-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  color: white;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
  line-height: 1.4;
}
```

`.ticket-card`에 `position: relative`가 이미 있는지 확인. 없으면 추가.

- [ ] **Step 3: 커밋**

```bash
git add src/components/TicketCard.tsx src/styles/app.css
git commit -m "feat: add AI badge and glow style to TicketCard"
```

---

### Task 8: 모드 라벨 업데이트 — TicketDetail, MyTicketsPanel

**Files:**
- Modify: `src/components/TicketDetail.tsx:51`
- Modify: `src/components/MyTicketsPanel.tsx:47`

- [ ] **Step 1: TicketDetail 모드 라벨 업데이트**

`src/components/TicketDetail.tsx:51`의 모드 표시 로직을 수정:

기존:
```tsx
<span>{ticket.mode === 'auto' ? '자동' : ticket.mode === 'semi_auto' ? '반자동' : '수동'}</span>
```

변경:
```tsx
<span>{ticket.mode === 'ai' ? 'AI 선택' : ticket.mode === 'auto' ? '자동' : ticket.mode === 'semi_auto' ? '반자동' : '수동'}</span>
```

- [ ] **Step 2: MyTicketsPanel 모드 라벨 업데이트**

`src/components/MyTicketsPanel.tsx:46-48`의 모드 표시 로직을 수정:

기존:
```tsx
<span className="my-tickets-panel__mode">
  {ticket.mode === 'auto' ? '자동' : ticket.mode === 'semi_auto' ? '반자동' : '수동'}
</span>
```

변경:
```tsx
<span className="my-tickets-panel__mode">
  {ticket.mode === 'ai' ? 'AI 선택' : ticket.mode === 'auto' ? '자동' : ticket.mode === 'semi_auto' ? '반자동' : '수동'}
</span>
```

- [ ] **Step 3: MyTicketsPanel에도 AI 뱃지 추가**

`src/components/MyTicketsPanel.tsx`의 각 티켓 아이템에 AI 표시 추가. `my-tickets-panel__idx` div 다음에:

```tsx
{ticket.mode === 'ai' && <span className="my-tickets-panel__ai-tag">AI</span>}
```

- [ ] **Step 4: 커밋**

```bash
git add src/components/TicketDetail.tsx src/components/MyTicketsPanel.tsx
git commit -m "feat: update mode labels and add AI badge in ticket views"
```

---

### Task 9: 모달 및 버튼 CSS 스타일

**Files:**
- Modify: `src/styles/app.css`

- [ ] **Step 1: AI 버튼 스타일 추가**

`src/styles/app.css`에 추가:

```css
.lotto-btn--ai {
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  color: white;
  border: none;
  font-weight: 600;
  width: 100%;
}

.lotto-btn--ai:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

- [ ] **Step 2: AiPromptModal 스타일 추가**

```css
.ai-prompt-modal {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  max-width: 440px;
  width: calc(100% - 32px);
  position: relative;
  max-height: 80vh;
  overflow-y: auto;
}

.ai-prompt-modal__title {
  font-size: 18px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 16px;
}

.ai-prompt-modal__code {
  background: #1a1a2e;
  color: #e0e0e0;
  padding: 16px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.ai-prompt-modal__hint {
  text-align: center;
  color: #666;
  font-size: 13px;
  margin: 12px 0 4px;
}

.ai-prompt-modal__warning {
  text-align: center;
  color: #b45309;
  font-size: 12px;
  margin: 4px 0 16px;
}

.ai-prompt-modal__copy-btn {
  display: block;
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.ai-prompt-modal__copy-btn:active {
  transform: scale(0.98);
}

.ai-prompt-modal__refresh-hint {
  text-align: center;
  color: #999;
  font-size: 11px;
  margin-top: 12px;
}

.my-tickets-panel__ai-tag {
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/styles/app.css
git commit -m "feat: add CSS styles for AI prompt modal and AI ticket styling"
```

---

### Task 10: 인기번호 사람/AI 분리 — HeatmapOverlay

**Files:**
- Modify: `src/components/HeatmapOverlay.tsx`
- Modify: `src/styles/app.css`

- [ ] **Step 1: HeatmapOverlay 내부에서 티켓을 사람/AI로 분리**

`src/components/HeatmapOverlay.tsx`를 수정. 기존 단일 집계 로직을 사람/AI 두 그룹으로 분리:

```tsx
import { useMemo } from 'react';
import type { Ticket } from '../types/api';

interface HeatmapOverlayProps {
  tickets: Ticket[];
}

function getTopNumbers(tickets: Ticket[], limit = 10) {
  if (tickets.length === 0) return [];
  const counts = new Map<number, number>();
  for (const ticket of tickets) {
    for (const num of ticket.numbers) {
      counts.set(num, (counts.get(num) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([num, count]) => ({ num, count }));
}

function HeatmapBar({ label, items, variant }: { label: string; items: { num: number; count: number }[]; variant?: 'ai' }) {
  if (items.length === 0) return null;
  const maxCount = items[0].count;

  return (
    <div className={`heatmap-bar ${variant === 'ai' ? 'heatmap-bar--ai' : ''}`}>
      <span className="heatmap-bar__label">{label}</span>
      <div className="heatmap-bar__items">
        {items.map(({ num, count }) => (
          <div key={num} className="heatmap-bar__item">
            <div
              className="heatmap-bar__fill"
              style={{ width: `${(count / maxCount) * 100}%` }}
            />
            <span className="heatmap-bar__num">{num}</span>
            <span className="heatmap-bar__count">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeatmapOverlay({ tickets }: HeatmapOverlayProps) {
  const { humanTop, aiTop } = useMemo(() => {
    const humanTickets = tickets.filter((t) => t.mode !== 'ai');
    const aiTickets = tickets.filter((t) => t.mode === 'ai');
    return {
      humanTop: getTopNumbers(humanTickets),
      aiTop: getTopNumbers(aiTickets),
    };
  }, [tickets]);

  if (humanTop.length === 0 && aiTop.length === 0) return null;

  return (
    <div className="heatmap-overlay">
      <HeatmapBar label="사람 인기" items={humanTop} />
      <HeatmapBar label="AI 인기" items={aiTop} variant="ai" />
    </div>
  );
}
```

- [ ] **Step 2: AI 인기 바 CSS 스타일 추가**

`src/styles/app.css`에 추가:

```css
.heatmap-overlay {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.heatmap-bar--ai .heatmap-bar__fill {
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.3), rgba(168, 85, 247, 0.6));
}

.heatmap-bar--ai .heatmap-bar__label {
  color: #8b5cf6;
}
```

기존 `.heatmap-bar` 스타일은 유지. `--ai` 변형만 추가.

- [ ] **Step 3: 커밋**

```bash
git add src/components/HeatmapOverlay.tsx src/styles/app.css
git commit -m "feat: split popular numbers display into human vs AI"
```

---

### Task 11: 수동 통합 테스트

- [ ] **Step 1: 개발 서버 실행**

```bash
npm run dev
```

- [ ] **Step 2: UI 테스트 — 모달 흐름**

1. 브라우저에서 `http://localhost:5173` 접속
2. 티켓 작성 화면에서 "AI에게 시키기" 버튼 확인
3. 버튼 클릭 → 모달 열림 확인
4. 프롬프트에 userId, roundId가 올바르게 삽입되었는지 확인
5. "복사하기" 클릭 → 클립보드 복사 확인, "복사되었습니다!" 피드백
6. Escape 키, 배경 클릭, X 버튼으로 모달 닫기 확인

- [ ] **Step 3: curl 테스트 — AI 모드 제출**

복사된 프롬프트를 터미널에서 직접 실행 (숫자를 직접 채워서):

```bash
curl -X POST "http://localhost:8787/api/tickets" \
  -H "Content-Type: application/json" \
  -d '{"numbers":[3,12,17,28,33,41],"mode":"ai","pickTag":"AI","userId":"test-uuid","roundId":"1"}'
```

Expected: `{"ok":true,"data":{...,"mode":"ai",...}}`

- [ ] **Step 4: 벽 UI 테스트**

1. 페이지 새로고침하여 벽 보기로 전환
2. AI 제출 티켓에 보라색 글로우 + "AI" 뱃지 확인
3. 티켓 클릭 → TicketDetail에서 "AI 선택" 모드 라벨 확인
4. "내 번호 보기"에서 AI 티켓에 "AI 선택" 라벨 확인

- [ ] **Step 5: mode 검증 테스트**

```bash
curl -s -X POST "http://localhost:8787/api/tickets" \
  -H "Content-Type: application/json" \
  -d '{"numbers":[1,2,3,4,5,6],"mode":"hack","userId":"test","roundId":"1"}'
```

Expected: 400 에러, `"유효하지 않은 모드입니다"`

- [ ] **Step 6: 인기번호 분리 테스트**

1. AI 티켓과 일반 티켓이 모두 있는 상태에서 벽 보기 확인
2. "사람 인기" 바와 "AI 인기" 바가 각각 나란히 표시되는지 확인
3. AI 인기 바가 보라색 계열인지 확인
4. AI 티켓만 있을 때 → "AI 인기" 바만 표시, "사람 인기" 숨김
5. 일반 티켓만 있을 때 → "사람 인기" 바만 표시, "AI 인기" 숨김

- [ ] **Step 7: 최종 커밋**

모든 테스트 통과 확인 후:

```bash
git add -A
git commit -m "feat: complete AI lotto submission feature"
```
