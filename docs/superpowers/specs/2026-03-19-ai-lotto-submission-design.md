# AI 로또 번호 제출 기능 설계

## 개요

"당신의 AI에게 로또 번호를 제출하라고 시켜보세요" 컨셉의 기능. 버튼을 누르면 코딩 AI(Claude Code, Codex 등)에게 붙여넣을 수 있는 프롬프트가 클립보드에 복사되고, AI가 랜덤 번호를 생성하여 POST 요청으로 티켓을 제출한다.

## 접근 방식

기존 `POST /api/tickets`의 `mode` 필드에 `'ai'` 값을 추가하는 방식. 기존 API 구조 변경을 최소화하면서 자연스럽게 확장.

## 1. 백엔드 변경

### mode 유효성 검증 추가

현재 서버에 mode 유효성 검증이 없다. 이번 기능에서 검증 로직을 추가한다.

```typescript
const VALID_MODES = ['manual', 'semi_auto', 'auto', 'ai'];
if (!VALID_MODES.includes(body.mode)) {
  return c.json({ ok: false, error: 'Invalid mode' }, 400);
}
```

### mode 타입 확장

- 기존: `mode: 'manual' | 'semi_auto' | 'auto'`
- 변경: `mode: 'manual' | 'semi_auto' | 'auto' | 'ai'`

### POST /api/tickets 변경사항

- mode 유효성 검증 로직 신규 추가 (기존에 없었음)
- `mode === 'ai'`일 때도 기존과 동일한 검증 (6개 번호, 1~45, 중복 불가)
- rate limit 동일하게 적용 (시간당 10장)
- 응답 구조 변경 없음

### DB 변경

없음. `mode` 컬럼은 이미 TEXT 타입이라 `'ai'` 값 저장에 문제 없음.

## 2. 프롬프트 생성 및 복사

### 프롬프트 템플릿

버튼 클릭 시 아래 프롬프트가 생성됨. URL은 `window.location.origin`으로 동적 생성하여 개발/스테이징/프로덕션 모두 대응.

```
1~45 사이의 숫자 6개를 랜덤으로 골라서, 아래 curl 명령어의 numbers 배열에 넣어 실행해줘.

curl -X POST "{origin}/api/tickets" \
  -H "Content-Type: application/json" \
  -d '{
    "numbers": [여기에 6개 숫자],
    "mode": "ai",
    "pickTag": "AI",
    "userId": "{현재 유저의 UUID}",
    "roundId": "{현재 라운드 ID}"
  }'
```

### 설계 포인트

- curl 기반: Claude Code, Codex, 터미널 접근 가능한 모든 코딩 AI에서 동작
- URL은 `window.location.origin + '/api/tickets'`로 동적 생성
- `userId`와 `roundId`는 현재 상태에서 동적으로 주입
- `mode: "ai"`로 고정하여 AI 제출임을 명시
- `pickTag: "AI"`로 태그 지정
- AI가 번호를 자유롭게 생성하되, 유효성은 서버에서 검증
- curl은 브라우저 CORS를 우회하므로 CORS 관련 이슈 없음

### userId 노출에 대한 고려

프롬프트에 userId(UUID)가 포함된다. 이 프로젝트에서 userId는 익명 UUID이며 개인정보와 연결되지 않으므로 노출 리스크가 낮다. 다만 모달 UI에 안내 문구를 표시한다: "이 프롬프트에는 당신의 익명 ID가 포함되어 있습니다."

## 3. UI - 버튼 및 모달

### ActionBar 버튼 추가

- 기존 "자동 채우기", "초기화", "벽에 붙이기" 버튼 영역에 "AI에게 시키기" 버튼 추가
- 번호 선택 상태와 무관하게 항상 활성화 (번호 생성도 AI가 하므로)
- 버튼 스타일: 기존 버튼과 톤은 맞추되, AI 느낌을 주는 차별화 (보라색 계열 또는 그라데이션)

### 모달 구성

- 헤더: "AI에게 로또 번호를 맡겨보세요"
- 본문: 생성된 프롬프트를 코드 블록으로 표시 (읽기 전용)
- 안내 문구: "Claude Code, Codex 등 코딩 AI에 붙여넣기 하세요"
- 경고 문구: "이 프롬프트에는 당신의 익명 ID가 포함되어 있습니다."
- "복사하기" 버튼: 클릭 시 클립보드 복사 + "복사되었습니다!" 피드백
- 모달 닫기: X 버튼, 배경 클릭, 또는 Escape 키
- 접근성: 기존 모달 패턴 준수 (`role="dialog"`, `aria-label`, 포커스 트랩)

### 제출 후 UX

AI가 curl로 직접 서버에 제출하므로, 프론트엔드의 기존 제출 흐름(sticking 애니메이션, localStorage 저장, hourlyRemaining 업데이트)을 우회한다. 모달 하단에 안내: "AI가 제출을 완료하면, 페이지를 새로고침하여 벽에서 확인하세요."

## 4. 벽 UI - AI 티켓 시각적 구분

### AI 티켓 카드 스타일

- 뱃지: 티켓 카드 우상단에 작은 로봇 아이콘 뱃지
- 테두리: 보라색 계열 글로우 효과 (`box-shadow`로 은은한 네온)
- 배경: 기존 티켓과 살짝 다른 톤 (연보라 또는 그라데이션 틴트)

### mode 표시 라벨 업데이트

기존 모드 표시 로직이 `'ai'`를 처리하지 않아 "수동"으로 잘못 표시됨. 업데이트 필요:
- `'manual'` → "수동"
- `'semi_auto'` → "반자동"
- `'auto'` → "자동"
- `'ai'` → "AI 선택"

### 적용 범위

- `WallView`의 `TicketCard` 컴포넌트에서 `mode === 'ai'` 조건 분기
- `TicketDetail` 모달에서도 AI 제출임을 표시 ("AI가 선택한 번호") + 모드 라벨 업데이트
- `MyTicketsPanel`에서도 동일 뱃지 표시 + 모드 라벨 업데이트

### 데이터 흐름

- 티켓 조회 API 응답에 이미 `mode` 필드가 포함되어 있으므로, 프론트엔드에서 별도 API 변경 없이 `mode` 값만 확인하면 됨

## 5. 인기번호 사람/AI 분리 표시

### 현재 동작

`HeatmapOverlay` 컴포넌트가 전체 티켓의 번호 빈도를 합산하여 top 10 인기번호를 하나의 바로 표시.

### 변경 사항

기존 하나의 "인기" 바를 "사람 인기"와 "AI 인기" 두 개 바로 분리하여 위아래로 나란히 표시.

- 사람 티켓: `mode !== 'ai'`인 티켓들의 번호 집계
- AI 티켓: `mode === 'ai'`인 티켓들의 번호 집계
- 각각 독립적으로 top 10 인기번호 산출
- AI 인기 바는 보라색 계열로 시각 구분
- 어느 한쪽에 데이터가 없으면 해당 바만 숨김

### 데이터 흐름

- `HeatmapOverlay`가 이미 `tickets: Ticket[]`을 받고 있으므로, `ticket.mode`로 필터링만 추가하면 됨
- 별도 API 변경 불필요

## 영향 받는 파일

### 백엔드
- `worker/routes/tickets.ts` — mode 유효성 검증 로직 추가 (`VALID_MODES` 배열 + 검증)

### 타입
- `src/types/lotto.ts` — `SelectionMode` 타입에 `'ai'` 추가, `PICK_TAGS` 배열에 `'AI'` 추가
- `src/types/api.ts` — 필요 시 타입 업데이트

### 프론트엔드
- `src/components/ActionBar.tsx` — "AI에게 시키기" 버튼 추가
- 새 컴포넌트: `src/components/AiPromptModal.tsx` — 프롬프트 모달
- `src/utils/prompt.ts` — 프롬프트 생성 유틸리티 함수
- `src/components/TicketCard.tsx` — AI 뱃지 + 글로우 스타일
- `src/components/TicketDetail.tsx` — AI 제출 표시 + 모드 라벨("AI 선택") 업데이트
- `src/components/MyTicketsPanel.tsx` — AI 뱃지 표시 + 모드 라벨 업데이트
- `src/App.tsx` — 모달 상태 관리 (또는 ActionBar 내부에서 처리)
- `src/components/HeatmapOverlay.tsx` — 사람/AI 인기번호 분리 표시
- `src/styles/app.css` — AI 인기 바 스타일 추가
