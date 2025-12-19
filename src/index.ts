/**
 * Nudge Talic Tutorial System
 * A game-quality, interactive tutorial library for Vue 3
 *
 * @license MIT
 * @author Amir Talic
 * @version 1.0.0
 *
 * Features:
 * - Interactive tutorials with spotlight effects
 * - Wait for user actions before proceeding
 * - Block interactions on unwanted elements
 * - Skip sections with custom logic
 * - Automatic resize/repositioning
 * - Theme customization
 * - Progress tracking
 *
 * Usage:
 * ```typescript
 * import { getTutorial, Tutorial } from '@/lib/tutorial'
 * import type { TutorialConfig } from '@/lib/tutorial'
 *
 * const tutorial = getTutorial()
 *
 * const config: TutorialConfig = {
 *   id: 'home-tutorial',
 *   steps: [
 *     {
 *       id: 'welcome',
 *       title: 'Welcome!',
 *       description: 'Let me show you around',
 *       placement: 'center'
 *     },
 *     {
 *       id: 'click-button',
 *       target: '[data-tutorial="my-button"]',
 *       title: 'Click This',
 *       description: 'Go ahead, click it!',
 *       waitForAction: {
 *         event: 'button-clicked'
 *       }
 *     }
 *   ]
 * }
 *
 * tutorial.start(config)
 *
 * // Later, when user clicks:
 * tutorial.triggerAction('button-clicked')
 * ```
 */

// Components
export { default as Tutorial } from './components/Tutorial.vue'
export { default as TutorialOverlay } from './components/TutorialOverlay.vue'
export { default as TutorialPopover } from './components/TutorialPopover.vue'

// Composables
export { useTutorial, getTutorial } from './composables/useTutorial'

// Types
export type {
  TutorialStep,
  TutorialConfig,
  TutorialState,
  TutorialEventType
} from './types'
