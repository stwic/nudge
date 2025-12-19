<template>
  <Teleport to="body">
    <Transition name="tutorial-popover-fade">
      <div
        v-if="isVisible"
        ref="popoverRef"
        class="tutorial-popover"
        :class="[`tutorial-popover--${placement}`, popoverClass]"
        :style="popoverStyle"
      >
        <!-- Close button -->
        <button
          v-if="allowClose"
          class="tutorial-popover__close"
          @click="$emit('close')"
          aria-label="Close tutorial"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>

        <!-- Progress indicator -->
        <div v-if="showProgress" class="tutorial-popover__progress">
          <span class="tutorial-popover__progress-text">{{ currentStep }} of {{ totalSteps }}</span>
          <div class="tutorial-popover__progress-bar">
            <div
              class="tutorial-popover__progress-fill"
              :style="{ width: `${progress}%` }"
            />
          </div>
        </div>

        <!-- Title -->
        <h3 class="tutorial-popover__title">{{ title }}</h3>

        <!-- Description -->
        <div
          class="tutorial-popover__description"
          v-html="description"
        />

        <!-- Skip buttons (if any) -->
        <div v-if="allowSkipTo && allowSkipTo.length > 0" class="tutorial-popover__skip">
          <button
            v-for="skipId in allowSkipTo"
            :key="skipId"
            class="tutorial-popover__skip-btn"
            @click="$emit('skip-to', skipId)"
          >
            Skip to {{ getSkipLabel(skipId) }} →
          </button>
        </div>

        <!-- Waiting indicator -->
        <div v-if="isWaiting" class="tutorial-popover__waiting">
          <div class="tutorial-popover__waiting-spinner"></div>
          <span>Waiting for your action...</span>
        </div>

        <!-- Action buttons -->
        <div class="tutorial-popover__footer">
          <button
            v-if="canGoPrevious"
            class="tutorial-popover__btn tutorial-popover__btn--secondary"
            @click="$emit('previous')"
          >
            ← Previous
          </button>

          <button
            v-if="canGoNext"
            class="tutorial-popover__btn tutorial-popover__btn--primary"
            :disabled="isWaiting"
            @click="$emit('next')"
          >
            Next →
          </button>

          <button
            v-if="isLastStep"
            class="tutorial-popover__btn tutorial-popover__btn--primary"
            :disabled="isWaiting"
            @click="$emit('complete')"
          >
            Finish! 🎉
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { PropType } from 'vue'

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  placement: {
    type: String as PropType<'top' | 'bottom' | 'left' | 'right' | 'center'>,
    default: 'bottom'
  },
  targetRect: {
    type: Object as PropType<DOMRect | null>,
    default: null
  },
  currentStep: {
    type: Number,
    default: 1
  },
  totalSteps: {
    type: Number,
    default: 1
  },
  progress: {
    type: Number,
    default: 0
  },
  showProgress: {
    type: Boolean,
    default: true
  },
  allowClose: {
    type: Boolean,
    default: true
  },
  canGoPrevious: {
    type: Boolean,
    default: false
  },
  canGoNext: {
    type: Boolean,
    default: true
  },
  isLastStep: {
    type: Boolean,
    default: false
  },
  isWaiting: {
    type: Boolean,
    default: false
  },
  allowSkipTo: {
    type: Array as PropType<string[]>,
    default: () => []
  },
  popoverClass: {
    type: String,
    default: ''
  }
})

const emit = defineEmits<{
  'close': []
  'next': []
  'previous': []
  'complete': []
  'skip-to': [stepId: string]
}>()

const popoverRef = ref<HTMLElement | null>(null)

const popoverStyle = computed(() => {
  if (!props.targetRect) {
    // Center on screen
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    }
  }

  const spacing = 16
  const margin = 16 // Margin from viewport edges
  const popover = popoverRef.value
  const popoverHeight = popover?.offsetHeight || 200
  const popoverWidth = popover?.offsetWidth || 400

  const target = props.targetRect
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let top = 0
  let left = 0
  let transform = ''

  switch (props.placement) {
    case 'top':
      left = target.left + target.width / 2
      top = target.top - popoverHeight - spacing
      transform = 'translateX(-50%)'

      // Check if popover goes above viewport
      if (top < margin) {
        // Flip to bottom
        top = target.bottom + spacing
      }
      break

    case 'bottom':
      left = target.left + target.width / 2
      top = target.bottom + spacing
      transform = 'translateX(-50%)'

      // Check if popover goes below viewport
      if (top + popoverHeight > viewportHeight - margin) {
        // Flip to top
        top = target.top - popoverHeight - spacing
      }
      break

    case 'left':
      left = target.left - popoverWidth - spacing
      top = target.top + target.height / 2
      transform = 'translateY(-50%)'

      // Check if popover goes off left edge
      if (left < margin) {
        // Flip to right
        left = target.right + spacing
        transform = 'translateY(-50%)'
      }
      break

    case 'right':
      left = target.right + spacing
      top = target.top + target.height / 2
      transform = 'translateY(-50%)'

      // Check if popover goes off right edge
      if (left + popoverWidth > viewportWidth - margin) {
        // Flip to left
        left = target.left - popoverWidth - spacing
      }
      break

    default:
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }
  }

  // Horizontal boundary check for centered popovers
  if (transform.includes('translateX(-50%)')) {
    const halfWidth = popoverWidth / 2
    if (left - halfWidth < margin) {
      left = margin + halfWidth
    } else if (left + halfWidth > viewportWidth - margin) {
      left = viewportWidth - margin - halfWidth
    }
  }

  // Vertical boundary check for centered popovers
  if (transform.includes('translateY(-50%)')) {
    const halfHeight = popoverHeight / 2
    if (top - halfHeight < margin) {
      top = margin + halfHeight
    } else if (top + halfHeight > viewportHeight - margin) {
      top = viewportHeight - margin - halfHeight
    }
  }

  return {
    left: `${left}px`,
    top: `${top}px`,
    transform
  }
})

function getSkipLabel(stepId: string): string {
  // Convert kebab-case to Title Case
  return stepId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Update position when target changes and scroll to popover if needed
watch(() => props.targetRect, async () => {
  await nextTick()

  // After element scroll completes (350ms) + popover renders, check if popover needs adjustment
  if (popoverRef.value && props.isVisible) {
    setTimeout(() => {
      scrollToPopoverIfNeeded()
    }, 400)
  }
})

// Scroll to popover if it's off-screen
function scrollToPopoverIfNeeded() {
  if (!popoverRef.value) return

  const popoverRect = popoverRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const margin = 20

  let needsScroll = false
  let targetScrollY = window.scrollY

  // Check if popover is above viewport
  if (popoverRect.top < margin) {
    targetScrollY = window.scrollY + popoverRect.top - margin
    needsScroll = true
  }
  // Check if popover is below viewport
  else if (popoverRect.bottom > viewportHeight - margin) {
    targetScrollY = window.scrollY + (popoverRect.bottom - viewportHeight + margin)
    needsScroll = true
  }

  if (needsScroll) {
    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth'
    })
  }
}
</script>

<style scoped>
.tutorial-popover {
  position: fixed;
  z-index: 10000;
  max-width: 450px;
  width: max-content;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 2px solid #FF1493;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow:
    0 20px 40px rgba(255, 20, 147, 0.3),
    0 0 0 1px rgba(255, 20, 147, 0.1);
  color: #f1f5f9;
}

.tutorial-popover__close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(71, 85, 105, 0.6);
  border: none;
  color: #cbd5e1;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.tutorial-popover__close:hover {
  background: rgba(239, 68, 68, 0.8);
  color: white;
}

.tutorial-popover__progress {
  margin-bottom: 1rem;
}

.tutorial-popover__progress-text {
  font-size: 0.875rem;
  color: #94a3b8;
  font-weight: 600;
  display: block;
  margin-bottom: 0.5rem;
}

.tutorial-popover__progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(71, 85, 105, 0.5);
  border-radius: 3px;
  overflow: hidden;
}

.tutorial-popover__progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF1493, #9333ea);
  transition: width 0.3s ease;
  border-radius: 3px;
}

.tutorial-popover__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #FF1493;
  margin: 0 0 0.75rem 0;
  letter-spacing: -0.01em;
}

.tutorial-popover__description {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #e2e8f0;
  margin-bottom: 1rem;
}

.tutorial-popover__description :deep(p) {
  margin: 0 0 0.5rem 0;
}

.tutorial-popover__skip {
  margin: 1rem 0;
  padding-top: 1rem;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
}

.tutorial-popover__skip-btn {
  width: 100%;
  padding: 0.625rem 1rem;
  background: rgba(71, 85, 105, 0.6);
  color: #e2e8f0;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 0.5rem;
}

.tutorial-popover__skip-btn:hover {
  background: rgba(100, 116, 139, 0.8);
  border-color: rgba(148, 163, 184, 0.5);
  transform: translateY(-1px);
}

.tutorial-popover__waiting {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #93c5fd;
}

.tutorial-popover__waiting-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-top-color: #60a5fa;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.tutorial-popover__footer {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.tutorial-popover__btn {
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  flex: 1;
}

.tutorial-popover__btn--primary {
  background: linear-gradient(135deg, #FF1493 0%, #9333ea 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(255, 20, 147, 0.3);
}

.tutorial-popover__btn--primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #ff3daa 0%, #a855f7 100%);
  box-shadow: 0 6px 16px rgba(255, 20, 147, 0.4);
  transform: translateY(-1px);
}

.tutorial-popover__btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tutorial-popover__btn--secondary {
  background: rgba(71, 85, 105, 0.8);
  color: #e2e8f0;
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.tutorial-popover__btn--secondary:hover {
  background: rgba(100, 116, 139, 0.9);
  border-color: rgba(148, 163, 184, 0.5);
  transform: translateY(-1px);
}

/* Fade transition */
.tutorial-popover-fade-enter-active,
.tutorial-popover-fade-leave-active {
  transition: all 0.2s ease;
}

.tutorial-popover-fade-enter-from,
.tutorial-popover-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.95);
}

/* Responsive */
@media (max-width: 640px) {
  .tutorial-popover {
    max-width: calc(100vw - 2rem);
    left: 1rem !important;
    right: 1rem !important;
    transform: none !important;
  }
}
</style>
