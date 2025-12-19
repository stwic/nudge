<template>
  <div>
    <!-- Overlay with spotlight -->
    <TutorialOverlay
      :is-active="tutorial.isActive.value"
      :target-rect="tutorial.targetRect.value"
      :block-interactions="currentStep?.blockInteractions || false"
      @overlay-click="handleOverlayClick"
    />

    <!-- Popover -->
    <TutorialPopover
      v-if="currentStep"
      :is-visible="tutorial.isActive.value"
      :title="currentStep.title"
      :description="currentStep.description"
      :placement="currentStep.placement || 'bottom'"
      :target-rect="tutorial.targetRect.value"
      :current-step="tutorial.currentStepIndex.value + 1"
      :total-steps="tutorial.totalSteps.value"
      :progress="tutorial.progress.value"
      :show-progress="config?.showProgress !== false"
      :allow-close="config?.allowClose !== false"
      :can-go-previous="tutorial.canGoPrevious.value"
      :can-go-next="tutorial.canGoNext.value"
      :is-last-step="tutorial.currentStepIndex.value === tutorial.totalSteps.value - 1"
      :is-waiting="tutorial.isWaitingForAction.value"
      :allow-skip-to="currentStep.allowSkipTo"
      :popover-class="currentStep.popoverClass"
      @close="tutorial.close()"
      @next="tutorial.next()"
      @previous="tutorial.previous()"
      @complete="tutorial.complete()"
      @skip-to="tutorial.skipTo($event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { getTutorial } from '../composables/useTutorial'
import TutorialOverlay from './TutorialOverlay.vue'
import TutorialPopover from './TutorialPopover.vue'
import type { TutorialConfig } from '../types'

const props = defineProps<{
  config?: TutorialConfig | null
}>()

const tutorial = getTutorial()

const currentStep = computed(() => tutorial.currentStep.value)
const config = computed(() => props.config)

function handleOverlayClick() {
  // Don't close if waiting for a specific action
  if (tutorial.isWaitingForAction.value) {
    return
  }

  // Only close if not blocking interactions
  if (!currentStep.value?.blockInteractions && config.value?.allowClose !== false) {
    tutorial.close()
  }
}

// Watch for window resize and scroll
let resizeObserver: ResizeObserver | null = null
let mutationObserver: MutationObserver | null = null

function setupObservers() {
  // ResizeObserver to watch for element size changes
  if (currentStep.value?.target) {
    const element = document.querySelector(currentStep.value.target)
    if (element) {
      resizeObserver = new ResizeObserver(() => {
        tutorial.updateTargetRect()
      })
      resizeObserver.observe(element)

      // Also observe all children
      element.querySelectorAll('*').forEach(child => {
        resizeObserver!.observe(child)
      })
    }
  }

  // MutationObserver to watch for DOM changes
  if (currentStep.value?.target) {
    const element = document.querySelector(currentStep.value.target)
    if (element) {
      mutationObserver = new MutationObserver(() => {
        tutorial.updateTargetRect()
      })
      mutationObserver.observe(element, {
        childList: true,
        subtree: true,
        attributes: true
      })
    }
  }
}

function cleanupObservers() {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (mutationObserver) {
    mutationObserver.disconnect()
    mutationObserver = null
  }
}

// Re-setup observers when step changes
watch(() => tutorial.currentStepIndex.value, () => {
  cleanupObservers()
  setupObservers()
})

// Setup on mount
onMounted(() => {
  setupObservers()

  // Update target rect on scroll
  window.addEventListener('scroll', tutorial.updateTargetRect, true)
  window.addEventListener('resize', tutorial.updateTargetRect)
})

// Cleanup on unmount
onUnmounted(() => {
  cleanupObservers()
  window.removeEventListener('scroll', tutorial.updateTargetRect, true)
  window.removeEventListener('resize', tutorial.updateTargetRect)
})
</script>
