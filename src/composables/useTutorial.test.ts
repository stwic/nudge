/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTutorial } from './useTutorial'
import type { TutorialConfig } from '../types'

describe('useTutorial', () => {
  let tutorial: ReturnType<typeof useTutorial>

  beforeEach(() => {
    tutorial = useTutorial()
    tutorial.close() // Reset any previous state
    localStorage.clear()
  })

  describe('initialization', () => {
    it('should initialize with inactive state', () => {
      expect(tutorial.isActive.value).toBe(false)
      expect(tutorial.currentStepIndex.value).toBe(-1)
      expect(tutorial.currentStep.value).toBe(null)
    })

    it('should have zero total steps initially', () => {
      expect(tutorial.totalSteps.value).toBe(0)
    })

    it('should not be waiting for action initially', () => {
      expect(tutorial.isWaitingForAction.value).toBe(false)
    })
  })

  describe('start', () => {
    it('should activate tutorial and go to first step', async () => {
      const config: TutorialConfig = {
        id: 'test-tutorial',
        steps: [
          {
            id: 'step1',
            title: 'Step 1',
            description: 'First step',
            placement: 'center'
          }
        ]
      }

      await tutorial.start(config)

      expect(tutorial.isActive.value).toBe(true)
      expect(tutorial.currentStepIndex.value).toBe(0)
      expect(tutorial.currentStep.value?.id).toBe('step1')
    })

    it('should set total steps correctly', async () => {
      const config: TutorialConfig = {
        id: 'test-tutorial',
        steps: [
          { id: 'step1', title: 'Step 1', description: 'Desc 1' },
          { id: 'step2', title: 'Step 2', description: 'Desc 2' },
          { id: 'step3', title: 'Step 3', description: 'Desc 3' }
        ]
      }

      await tutorial.start(config)

      expect(tutorial.totalSteps.value).toBe(3)
    })

    it('should call onEnter callback when starting', async () => {
      const onEnter = vi.fn()
      const config: TutorialConfig = {
        id: 'test-tutorial',
        steps: [
          {
            id: 'step1',
            title: 'Step 1',
            description: 'Desc',
            onEnter
          }
        ]
      }

      await tutorial.start(config)

      expect(onEnter).toHaveBeenCalledTimes(1)
    })
  })

  describe('navigation', () => {
    const createConfig = (): TutorialConfig => ({
      id: 'test-tutorial',
      steps: [
        { id: 'step1', title: 'Step 1', description: 'Desc 1' },
        { id: 'step2', title: 'Step 2', description: 'Desc 2' },
        { id: 'step3', title: 'Step 3', description: 'Desc 3' }
      ]
    })

    it('should move to next step', async () => {
      await tutorial.start(createConfig())

      await tutorial.next()

      expect(tutorial.currentStepIndex.value).toBe(1)
      expect(tutorial.currentStep.value?.id).toBe('step2')
    })

    it('should move to previous step', async () => {
      await tutorial.start(createConfig())
      await tutorial.next()

      await tutorial.previous()

      expect(tutorial.currentStepIndex.value).toBe(0)
      expect(tutorial.currentStep.value?.id).toBe('step1')
    })

    it('should skip to specific step by id', async () => {
      await tutorial.start(createConfig())

      await tutorial.skipTo('step3')

      expect(tutorial.currentStepIndex.value).toBe(2)
      expect(tutorial.currentStep.value?.id).toBe('step3')
    })

    it('should not go beyond last step', async () => {
      await tutorial.start(createConfig())
      await tutorial.skipTo('step3')

      await tutorial.next()

      expect(tutorial.currentStepIndex.value).toBe(2)
    })

    it('should not go before first step', async () => {
      await tutorial.start(createConfig())

      await tutorial.previous()

      expect(tutorial.currentStepIndex.value).toBe(0)
    })
  })

  describe('canGoPrevious and canGoNext', () => {
    it('should not allow previous on first step', async () => {
      const config: TutorialConfig = {
        id: 'test',
        steps: [
          { id: 'step1', title: 'Step 1', description: 'Desc' }
        ]
      }

      await tutorial.start(config)

      expect(tutorial.canGoPrevious.value).toBe(false)
    })

    it('should allow previous after moving forward', async () => {
      const config: TutorialConfig = {
        id: 'test',
        steps: [
          { id: 'step1', title: 'Step 1', description: 'Desc' },
          { id: 'step2', title: 'Step 2', description: 'Desc' }
        ]
      }

      await tutorial.start(config)
      await tutorial.next()

      expect(tutorial.canGoPrevious.value).toBe(true)
    })

    it('should not allow next when waiting for action', async () => {
      const config: TutorialConfig = {
        id: 'test',
        steps: [
          {
            id: 'step1',
            title: 'Step 1',
            description: 'Desc',
            waitForAction: { event: 'test-action' }
          },
          { id: 'step2', title: 'Step 2', description: 'Desc' }
        ]
      }

      await tutorial.start(config)

      expect(tutorial.isWaitingForAction.value).toBe(true)
      expect(tutorial.canGoNext.value).toBe(false)
    })
  })

  describe('waitForAction', () => {
    it('should wait for action before allowing next', async () => {
      const config: TutorialConfig = {
        id: 'test',
        steps: [
          {
            id: 'step1',
            title: 'Step 1',
            description: 'Desc',
            waitForAction: { event: 'button-clicked' }
          },
          { id: 'step2', title: 'Step 2', description: 'Desc' }
        ]
      }

      await tutorial.start(config)

      expect(tutorial.isWaitingForAction.value).toBe(true)

      tutorial.triggerAction('button-clicked')

      expect(tutorial.isWaitingForAction.value).toBe(false)
    })

    it('should timeout waiting for action', async () => {
      vi.useFakeTimers()

      const config: TutorialConfig = {
        id: 'test',
        steps: [
          {
            id: 'step1',
            title: 'Step 1',
            description: 'Desc',
            waitForAction: { event: 'test-event', timeout: 1000 }
          }
        ]
      }

      await tutorial.start(config)
      expect(tutorial.isWaitingForAction.value).toBe(true)

      vi.advanceTimersByTime(1000)

      expect(tutorial.isWaitingForAction.value).toBe(false)

      vi.useRealTimers()
    })
  })

  describe('complete', () => {
    it('should mark tutorial as completed in localStorage', async () => {
      const config: TutorialConfig = {
        id: 'test-tutorial',
        steps: [
          { id: 'step1', title: 'Step 1', description: 'Desc' }
        ]
      }

      await tutorial.start(config)
      tutorial.complete()

      expect(tutorial.isCompleted('test-tutorial')).toBe(true)
    })

    it('should call onComplete callback', async () => {
      const onComplete = vi.fn()
      const config: TutorialConfig = {
        id: 'test-tutorial',
        steps: [
          { id: 'step1', title: 'Step 1', description: 'Desc' }
        ],
        onComplete
      }

      await tutorial.start(config)
      tutorial.complete()

      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it('should close tutorial after completing', async () => {
      const config: TutorialConfig = {
        id: 'test-tutorial',
        steps: [
          { id: 'step1', title: 'Step 1', description: 'Desc' }
        ]
      }

      await tutorial.start(config)
      tutorial.complete()

      expect(tutorial.isActive.value).toBe(false)
    })
  })

  describe('close', () => {
    it('should deactivate tutorial', async () => {
      const config: TutorialConfig = {
        id: 'test-tutorial',
        steps: [
          { id: 'step1', title: 'Step 1', description: 'Desc' }
        ]
      }

      await tutorial.start(config)
      tutorial.close()

      expect(tutorial.isActive.value).toBe(false)
      expect(tutorial.currentStepIndex.value).toBe(-1)
    })

    it('should call onClose callback', async () => {
      const onClose = vi.fn()
      const config: TutorialConfig = {
        id: 'test-tutorial',
        steps: [
          { id: 'step1', title: 'Step 1', description: 'Desc' }
        ],
        onClose
      }

      await tutorial.start(config)
      tutorial.close()

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should clean up action listeners when closing', async () => {
      const config: TutorialConfig = {
        id: 'test',
        steps: [
          {
            id: 'step1',
            title: 'Step 1',
            description: 'Desc',
            waitForAction: { event: 'test-event' }
          }
        ]
      }

      await tutorial.start(config)
      expect(tutorial.isWaitingForAction.value).toBe(true)

      tutorial.close()

      expect(tutorial.isWaitingForAction.value).toBe(false)
    })
  })

  describe('progress', () => {
    it('should calculate progress percentage correctly', async () => {
      const config: TutorialConfig = {
        id: 'test',
        steps: [
          { id: 'step1', title: 'Step 1', description: 'Desc' },
          { id: 'step2', title: 'Step 2', description: 'Desc' },
          { id: 'step3', title: 'Step 3', description: 'Desc' },
          { id: 'step4', title: 'Step 4', description: 'Desc' }
        ]
      }

      await tutorial.start(config)
      expect(tutorial.progress.value).toBe(25) // 1/4 = 25%

      await tutorial.next()
      expect(tutorial.progress.value).toBe(50) // 2/4 = 50%

      await tutorial.next()
      expect(tutorial.progress.value).toBe(75) // 3/4 = 75%

      await tutorial.next()
      expect(tutorial.progress.value).toBe(100) // 4/4 = 100%
    })
  })

  describe('event system', () => {
    it('should emit and listen to custom events', async () => {
      const handler = vi.fn()

      tutorial.on('custom-event', handler)
      tutorial.emit('custom-event', { data: 'test' })

      expect(handler).toHaveBeenCalledWith({ data: 'test' })
    })

    it('should remove event listeners with off', async () => {
      const handler = vi.fn()

      tutorial.on('custom-event', handler)
      tutorial.off('custom-event', handler)
      tutorial.emit('custom-event')

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('resetCompletion', () => {
    it('should reset completion status', async () => {
      const config: TutorialConfig = {
        id: 'test-tutorial',
        steps: [
          { id: 'step1', title: 'Step 1', description: 'Desc' }
        ]
      }

      await tutorial.start(config)
      tutorial.complete()
      expect(tutorial.isCompleted('test-tutorial')).toBe(true)

      tutorial.resetCompletion('test-tutorial')
      expect(tutorial.isCompleted('test-tutorial')).toBe(false)
    })
  })
})
