<template>
  <Teleport to="body">
    <Transition name="tutorial-fade">
      <div
        v-if="isActive"
        class="tutorial-overlay"
        :class="{ 'tutorial-overlay--blocking': blockInteractions }"
        @click="handleOverlayClick"
      >
        <!-- Dark overlay with spotlight cutout -->
        <svg class="tutorial-overlay__svg">
          <defs>
            <mask :id="`tutorial-mask-${maskId}`">
              <!-- White background -->
              <rect x="0" y="0" width="100%" height="100%" fill="white" />

              <!-- Black cutout for spotlight (if target exists) -->
              <rect
                v-if="spotlightRect"
                :x="spotlightRect.x - padding"
                :y="spotlightRect.y - padding"
                :width="spotlightRect.width + padding * 2"
                :height="spotlightRect.height + padding * 2"
                :rx="borderRadius"
                fill="black"
              />
            </mask>
          </defs>

          <!-- Apply mask to create spotlight effect -->
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            :mask="`url(#tutorial-mask-${maskId})`"
            :fill="overlayColor"
          />
        </svg>

        <!-- Glowing border around highlighted element -->
        <div
          v-if="spotlightRect"
          class="tutorial-overlay__glow"
          :style="glowStyle"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PropType, CSSProperties } from 'vue'

const props = defineProps({
  isActive: {
    type: Boolean,
    default: false
  },
  targetRect: {
    type: Object as PropType<DOMRect | null>,
    default: null
  },
  blockInteractions: {
    type: Boolean,
    default: false
  },
  overlayColor: {
    type: String,
    default: 'rgba(0, 0, 0, 0.75)'
  },
  glowColor: {
    type: String,
    default: '#FF1493'
  }
})

const emit = defineEmits<{
  'overlay-click': []
}>()

const maskId = ref(Math.random().toString(36).substring(7))
const padding = 8
const borderRadius = 12

// Reactive spotlight rectangle that updates with target
const spotlightRect = computed(() => {
  if (!props.targetRect) return null

  return {
    x: props.targetRect.x,
    y: props.targetRect.y,
    width: props.targetRect.width,
    height: props.targetRect.height
  }
})

// Glow effect style
const glowStyle = computed<CSSProperties>(() => {
  if (!spotlightRect.value) return {}

  return {
    left: `${spotlightRect.value.x - padding}px`,
    top: `${spotlightRect.value.y - padding}px`,
    width: `${spotlightRect.value.width + padding * 2}px`,
    height: `${spotlightRect.value.height + padding * 2}px`,
    borderRadius: `${borderRadius}px`,
    boxShadow: `
      0 0 0 4px ${props.glowColor},
      0 0 20px ${props.glowColor}80,
      0 0 40px ${props.glowColor}40
    `,
    // Always allow clicks to pass through to the element beneath
    pointerEvents: 'none' as 'none'
  }
})

function handleOverlayClick() {
  emit('overlay-click')
}

// Update mask ID when target changes to force re-render
watch(() => props.targetRect, () => {
  maskId.value = Math.random().toString(36).substring(7)
})
</script>

<style scoped>
.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9998;
  pointer-events: none;
}

.tutorial-overlay--blocking {
  pointer-events: auto;
}

.tutorial-overlay__svg {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.tutorial-overlay__glow {
  position: absolute;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: auto;
  z-index: 1;
}

/* Fade transition */
.tutorial-fade-enter-active,
.tutorial-fade-leave-active {
  transition: opacity 0.3s ease;
}

.tutorial-fade-enter-from,
.tutorial-fade-leave-to {
  opacity: 0;
}
</style>
