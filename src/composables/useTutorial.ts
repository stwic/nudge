/**
 * Nudge Tutorial System - Core Composable
 *
 * @license MIT
 */

import { ref, computed, nextTick } from 'vue'
import type { TutorialConfig, TutorialStep, TutorialState } from '../types'

// Event bus for tutorial events
const eventBus = new Map<string, Set<Function>>()

export function useTutorial() {
  const config = ref<TutorialConfig | null>(null)
  const currentStepIndex = ref(-1)
  const isActive = ref(false)
  const isWaitingForAction = ref(false)
  const targetRect = ref<DOMRect | null>(null)

  // Track current action listener for cleanup
  let currentActionHandler: { event: string; handler: Function } | null = null

  const currentStep = computed<TutorialStep | null>(() => {
    if (!config.value || currentStepIndex.value < 0) return null
    return config.value.steps[currentStepIndex.value] || null
  })

  const totalSteps = computed(() => config.value?.steps.length || 0)

  const progress = computed(() => {
    if (totalSteps.value === 0) return 0
    return ((currentStepIndex.value + 1) / totalSteps.value) * 100
  })

  const canGoNext = computed(() => {
    if (isWaitingForAction.value) return false
    return currentStepIndex.value < totalSteps.value - 1
  })

  const canGoPrevious = computed(() => {
    return currentStepIndex.value > 0
  })

  /**
   * Start the tutorial
   */
  async function start(tutorialConfig: TutorialConfig) {
    config.value = tutorialConfig
    currentStepIndex.value = 0
    isActive.value = true

    // Check if already completed
    const completed = localStorage.getItem(`tutorial:${tutorialConfig.id}:completed`)
    if (completed === 'true') {
      console.log(`[Tutorial] "${tutorialConfig.id}" already completed`)
    }

    emit('tutorial:start')
    await goToStep(0)
  }

  /**
   * Go to a specific step
   */
  async function goToStep(index: number) {
    if (!config.value) return

    const step = config.value.steps[index]
    if (!step) return

    // Clean up previous action listener
    if (currentActionHandler) {
      off(currentActionHandler.event, currentActionHandler.handler)
      currentActionHandler = null
    }

    // Exit current step
    if (currentStep.value?.onExit) {
      await currentStep.value.onExit()
    }

    currentStepIndex.value = index
    isWaitingForAction.value = false

    // Update target rect
    await nextTick()
    updateTargetRect()

    // First scroll to get element in a reasonable position
    if (step.target) {
      const element = document.querySelector(step.target)
      if (element) {
        scrollElementIntoView(element, step.placement || 'bottom')
      }
    }

    // Enter new step
    if (step.onEnter) {
      await step.onEnter()
    }

    // Set up wait for action if needed
    if (step.waitForAction) {
      isWaitingForAction.value = true
      setupActionListener(step.waitForAction.event, step.waitForAction.timeout)
    }

    emit('tutorial:step-change', { step, index })
  }

  /**
   * Move to next step
   */
  async function next() {
    if (!canGoNext.value) return
    await goToStep(currentStepIndex.value + 1)
  }

  /**
   * Move to previous step
   */
  async function previous() {
    if (!canGoPrevious.value) return
    await goToStep(currentStepIndex.value - 1)
  }

  /**
   * Skip to a specific step by ID
   */
  async function skipTo(stepId: string) {
    if (!config.value) return

    const index = config.value.steps.findIndex(s => s.id === stepId)
    if (index >= 0) {
      await goToStep(index)
    }
  }

  /**
   * Complete the tutorial
   */
  function complete() {
    if (!config.value) return

    localStorage.setItem(`tutorial:${config.value.id}:completed`, 'true')
    emit('tutorial:complete')

    if (config.value.onComplete) {
      config.value.onComplete()
    }

    close()
  }

  /**
   * Close/skip the tutorial
   */
  function close() {
    if (!config.value) return

    // Clean up action listener
    if (currentActionHandler) {
      off(currentActionHandler.event, currentActionHandler.handler)
      currentActionHandler = null
    }

    emit('tutorial:close')

    if (config.value.onClose) {
      config.value.onClose()
    }

    isActive.value = false
    currentStepIndex.value = -1
    config.value = null
    targetRect.value = null
    isWaitingForAction.value = false
  }

  /**
   * Update target element bounding rectangle
   */
  function updateTargetRect() {
    if (!currentStep.value?.target) {
      targetRect.value = null
      return
    }

    const element = document.querySelector(currentStep.value.target)
    if (element) {
      targetRect.value = element.getBoundingClientRect()
    } else {
      targetRect.value = null
    }
  }

  /**
   * Scroll element into a reasonable position based on popover placement
   */
  function scrollElementIntoView(element: Element, placement: string) {
    const rect = element.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const margin = 150 // Space to leave for popover

    let needsScroll = false
    let targetScrollY = window.scrollY

    if (placement === 'top') {
      // Need space above element for popover
      if (rect.top < margin) {
        targetScrollY = window.scrollY + rect.top - margin
        needsScroll = true
      }
    } else if (placement === 'bottom') {
      // Need space below element for popover
      if (rect.bottom > viewportHeight - margin) {
        targetScrollY = window.scrollY + (rect.bottom - viewportHeight + margin)
        needsScroll = true
      }
    } else if (placement === 'left' || placement === 'right') {
      // Center element vertically
      const elementCenter = rect.top + rect.height / 2
      const viewportCenter = viewportHeight / 2
      if (Math.abs(elementCenter - viewportCenter) > 100) {
        targetScrollY = window.scrollY + (elementCenter - viewportCenter)
        needsScroll = true
      }
    }

    if (needsScroll) {
      window.scrollTo({
        top: targetScrollY,
        behavior: 'smooth'
      })

      // Update target rect after scroll
      setTimeout(() => {
        updateTargetRect()
      }, 350)
    }
  }

  /**
   * Setup listener for user action
   */
  function setupActionListener(eventName: string, timeout?: number) {
    const handler = () => {
      isWaitingForAction.value = false
      emit('tutorial:action-completed', { eventName })
      off(eventName, handler)
      currentActionHandler = null
    }

    on(eventName, handler)

    // Store current handler for cleanup
    currentActionHandler = { event: eventName, handler }

    // Optional timeout
    if (timeout) {
      setTimeout(() => {
        if (isWaitingForAction.value) {
          isWaitingForAction.value = false
          off(eventName, handler)
          currentActionHandler = null
        }
      }, timeout)
    }
  }

  /**
   * Emit a tutorial event
   */
  function emit(event: string, data?: any) {
    const handlers = eventBus.get(event)
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }

  /**
   * Listen to tutorial events
   */
  function on(event: string, handler: Function) {
    if (!eventBus.has(event)) {
      eventBus.set(event, new Set())
    }
    eventBus.get(event)!.add(handler)
  }

  /**
   * Remove event listener
   */
  function off(event: string, handler: Function) {
    const handlers = eventBus.get(event)
    if (handlers) {
      handlers.delete(handler)
    }
  }

  /**
   * Trigger a custom action (for components to call)
   */
  function triggerAction(actionName: string, data?: any) {
    emit(actionName, data)
  }

  /**
   * Check if tutorial is completed
   */
  function isCompleted(tutorialId: string): boolean {
    return localStorage.getItem(`tutorial:${tutorialId}:completed`) === 'true'
  }

  /**
   * Reset tutorial completion status
   */
  function resetCompletion(tutorialId: string) {
    localStorage.removeItem(`tutorial:${tutorialId}:completed`)
  }

  const state = computed<TutorialState>(() => ({
    isActive: isActive.value,
    currentStepIndex: currentStepIndex.value,
    currentStep: currentStep.value,
    totalSteps: totalSteps.value,
    isWaitingForAction: isWaitingForAction.value,
    targetRect: targetRect.value
  }))

  // Watch for window resize and update target rect
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateTargetRect)
  }

  return {
    // State
    state,
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    progress,
    canGoNext,
    canGoPrevious,
    isWaitingForAction,
    targetRect,

    // Methods
    start,
    next,
    previous,
    goToStep,
    skipTo,
    complete,
    close,
    updateTargetRect,
    triggerAction,
    on,
    off,
    emit,
    isCompleted,
    resetCompletion
  }
}

// Singleton instance for global access
let tutorialInstance: ReturnType<typeof useTutorial> | null = null

export function getTutorial() {
  if (!tutorialInstance) {
    tutorialInstance = useTutorial()
  }
  return tutorialInstance
}
