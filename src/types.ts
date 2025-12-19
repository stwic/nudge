/**
 * Nudge Tutorial System
 * A game-quality, interactive tutorial library for Vue 3
 *
 * @license MIT
 * @author Amir Talic
 */

export interface TutorialStep {
  /** Unique identifier for this step */
  id: string

  /** CSS selector for the element to highlight */
  target?: string

  /** Tutorial popover title */
  title: string

  /** Tutorial popover description (supports HTML) */
  description: string

  /** Where to position the popover relative to target */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center'

  /** Block all interactions except on the target element */
  blockInteractions?: boolean

  /** Wait for a specific action before allowing "Next" button */
  waitForAction?: {
    /** Event name to wait for (e.g., 'expand-rewards', 'click-card') */
    event: string
    /** Element selector that should emit the event */
    target?: string
    /** Timeout in ms (optional) */
    timeout?: number
  }

  /** Allow user to skip to a specific step */
  allowSkipTo?: string[]

  /** Callback when step becomes active */
  onEnter?: () => void | Promise<void>

  /** Callback when leaving this step */
  onExit?: () => void | Promise<void>

  /** Custom CSS classes for the popover */
  popoverClass?: string
}

export interface TutorialConfig {
  /** Array of tutorial steps */
  steps: TutorialStep[]

  /** Tutorial identifier (for localStorage tracking) */
  id: string

  /** Show progress indicator */
  showProgress?: boolean

  /** Allow closing/skipping tutorial */
  allowClose?: boolean

  /** Callback when tutorial completes */
  onComplete?: () => void

  /** Callback when tutorial is skipped/closed */
  onClose?: () => void

  /** Custom theme colors */
  theme?: {
    primary?: string
    background?: string
    text?: string
  }
}

export interface TutorialState {
  /** Is tutorial currently active */
  isActive: boolean

  /** Current step index */
  currentStepIndex: number

  /** Current step */
  currentStep: TutorialStep | null

  /** Total steps */
  totalSteps: number

  /** Is waiting for user action */
  isWaitingForAction: boolean

  /** Target element bounding box */
  targetRect: DOMRect | null
}

export type TutorialEventType =
  | 'tutorial:start'
  | 'tutorial:complete'
  | 'tutorial:close'
  | 'tutorial:step-change'
  | 'tutorial:action-completed'
  | string // Allow custom events
