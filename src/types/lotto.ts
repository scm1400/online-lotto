// --- Pen Skin ---

export interface PenSkin {
  id: string;
  color: string;
  opacity: number;
  blurRadius: number;
  strokeWidth: number;
}

export const DEFAULT_PEN: PenSkin = {
  id: 'default-black',
  color: '#1A1A1A',
  opacity: 0.85,
  blurRadius: 2.5,
  strokeWidth: 14,
};

// --- Lotto Draft ---

export type SelectionMode = 'manual' | 'semi_auto' | 'auto' | 'ai';

export const PICK_TAGS = ['감', '생일', '꿈', '역배', '자동', '매번 고정'] as const;
export type PickTag = (typeof PICK_TAGS)[number] | string;

export interface LottoDraft {
  draftId: string;
  numbers: number[]; // 6 numbers, ascending order
  mode: SelectionMode;
  pickTag?: string;
  createdAt: string; // ISO 8601
}

// --- Widget Props ---

export interface InventoryStatus {
  count: number;
  max: number;
}

export interface LottoWidgetProps {
  penSkin?: PenSkin;
  reducedAnimations?: boolean;
  inventoryStatus?: InventoryStatus;
  initialDraft?: LottoDraft;
  widgetMode?: 'standalone' | 'wall';
  onDraftComplete?: (draft: LottoDraft) => Promise<void> | void;
  onDraftUpdate?: (draft: LottoDraft) => Promise<void> | void;
  onRequestInventoryStatus?: () => Promise<InventoryStatus>;
  onSubmitSuccess?: (draft: LottoDraft) => void;
  onAiSubmit?: () => void;
  onWidgetClose?: () => void;
}

// --- Grid Constants ---

export const GRID_COLS = 7;
export const GRID_ROWS = 7;
export const MIN_NUMBER = 1;
export const MAX_NUMBER = 45;
export const MAX_SELECTION = 6;
export const MAX_INVENTORY = 50;

// --- Animation Durations (ms) ---

export const ANIM = {
  INK_FILL: 300,
  ERASER_WIPE: 300,
  AUTO_FILL_PER_CELL: 250,
  RESET_ALL: 500,
  COMPLETION_FOLD: 400,
} as const;

export function getAnimDuration(base: number, reduced: boolean): number {
  return reduced ? base * 0.5 : base;
}
