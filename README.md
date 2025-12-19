# Vue Nudge

Interactive tutorial library for Vue 3 applications. Inspired by tutorials from games like Crusader Kings 3 and Europa Universalis V. Made primarily because all the other free options did not have the features I needed. Still a work in progress with customization incoming.

[![npm version](https://badge.fury.io/js/vue-nudge.svg)](https://www.npmjs.com/package/vue-nudge)

[![npm downloads](https://img.shields.io/npm/dm/vue-nudge.svg)](https://www.npmjs.com/package/vue-nudge)

## Features

- 🎯 **Interactive Tutorials** - Step-by-step guided experiences with spotlight effects
- ⏸️ **Wait for Actions** - Pause tutorial until user performs specific actions
- 🚫 **Block Interactions** - Control what users can interact with during tutorials
- 📍 **Smart Positioning** - Auto-adjusts popover placement to stay visible
- 📜 **Auto-scroll** - Automatically scrolls to keep elements and popovers in view
- ⏭️ **Skip Sections** - Allow users to jump between tutorial sections
- 🔄 **Reactive Updates** - ResizeObserver and MutationObserver for dynamic content
- 📝 **TypeScript** - Full type safety and IntelliSense support

## Installation

```bash
npm install vue-nudge
# or
yarn add vue-nudge
# or
pnpm add vue-nudge
```

## Quick Start

### 1. Add Tutorial component to your app

```vue
<template>
  <div>
    <YourApp />
    <Tutorial />
  </div>
</template>

<script setup lang="ts">
import { Tutorial } from 'vue-nudge'
</script>
```

### 2. Create a tutorial configuration

```typescript
import type { TutorialConfig } from 'vue-nudge'

export const myTutorialConfig: TutorialConfig = {
  id: 'my-first-tutorial',
  showProgress: true,
  allowClose: true,

  steps: [
    {
      id: 'welcome',
      title: 'Welcome! 👋',
      description: 'Let me show you around',
      placement: 'center'
    },
    {
      id: 'click-button',
      target: '[data-tutorial="my-button"]',
      title: 'Click This Button',
      description: 'Go ahead, click it!',
      placement: 'bottom',
      blockInteractions: false,
      waitForAction: {
        event: 'button-clicked',
        timeout: 30000
      }
    },
    {
      id: 'explore',
      target: '[data-tutorial="feature-panel"]',
      title: 'Explore This Feature',
      description: 'This panel contains important information',
      placement: 'right',
      allowSkipTo: ['final-step']
    },
    {
      id: 'final-step',
      title: 'All Done! 🎉',
      description: 'You're ready to go!',
      placement: 'center'
    }
  ],

  onComplete: () => {
    console.log('Tutorial completed!')
  },

  onClose: () => {
    console.log('Tutorial closed')
  }
}
```

### 3. Add data attributes to your elements

```vue
<template>
  <button data-tutorial="my-button" @click="handleClick">
    Click Me
  </button>

  <div data-tutorial="feature-panel">
    Feature content here
  </div>
</template>
```

### 4. Start the tutorial

```vue
<script setup lang="ts">
import { getTutorial } from 'vue-nudge'
import { myTutorialConfig } from './config/myTutorial'

const tutorial = getTutorial()

function startTutorial() {
  tutorial.start(myTutorialConfig)
}

function handleClick() {
  // Trigger tutorial progression when user clicks
  tutorial.triggerAction('button-clicked')
}
</script>

<template>
  <button @click="startTutorial">Start Tutorial</button>
</template>
```

## API Reference

### TutorialConfig

```typescript
interface TutorialConfig {
  id: string                    // Unique identifier for this tutorial
  steps: TutorialStep[]         // Array of tutorial steps
  showProgress?: boolean        // Show progress indicator (default: true)
  allowClose?: boolean          // Allow closing tutorial (default: true)
  onComplete?: () => void       // Callback when tutorial completes
  onClose?: () => void          // Callback when tutorial is closed/skipped
}
```

### TutorialStep

```typescript
interface TutorialStep {
  id: string                    // Unique step identifier
  title: string                 // Step title
  description: string           // Step description (supports HTML)
  target?: string               // CSS selector for highlighted element
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  blockInteractions?: boolean   // Block clicks on other elements
  waitForAction?: {
    event: string               // Event name to wait for
    timeout?: number            // Optional timeout in ms
  }
  allowSkipTo?: string[]        // Step IDs that can be skipped to
  popoverClass?: string         // Additional CSS class for popover
  onEnter?: () => void | Promise<void>
  onExit?: () => void | Promise<void>
}
```

### Tutorial Methods

```typescript
const tutorial = getTutorial()

// Start a tutorial
await tutorial.start(config: TutorialConfig)

// Navigation
await tutorial.next()          // Go to next step
await tutorial.previous()      // Go to previous step
await tutorial.skipTo(stepId: string)  // Skip to specific step

// Control
tutorial.complete()            // Mark tutorial as complete
tutorial.close()               // Close/cancel tutorial

// Events
tutorial.triggerAction(actionName: string, data?: any)
tutorial.on(event: string, handler: Function)
tutorial.off(event: string, handler: Function)

// Utility
tutorial.isCompleted(tutorialId: string): boolean
tutorial.resetCompletion(tutorialId: string)
```

## Advanced Usage

### Waiting for User Actions

```typescript
{
  id: 'expand-menu',
  target: '[data-tutorial="menu"]',
  title: 'Open the Menu',
  description: 'Click to expand this menu',
  waitForAction: {
    event: 'menu-expanded',
    timeout: 30000  // 30 second timeout
  }
}
```

Then in your component:

```vue
<script setup>
import { getTutorial } from 'vue-nudge'

const tutorial = getTutorial()

function expandMenu() {
  // ... your menu logic
  tutorial.triggerAction('menu-expanded')
}
</script>
```

### Skip Buttons

Allow users to skip sections of the tutorial:

```typescript
{
  id: 'beginner-tips',
  title: 'Tips for Beginners',
  description: 'Some helpful advice...',
  allowSkipTo: ['advanced-features', 'final-step']
}
```

This will show skip buttons like "Skip to Advanced Features →"

### Custom Styling

Override default styles with CSS variables or by targeting classes:

```css
.tutorial-popover {
  --tutorial-primary-color: #ff1493;
  --tutorial-bg-color: #1e293b;
  --tutorial-border-radius: 12px;
}

.tutorial-overlay__glow {
  /* Customize glow effect */
}
```

### Dynamic Content

The tutorial automatically tracks size and position changes:

```vue
<template>
  <div data-tutorial="expanding-panel" :class="{ expanded }">
    <!-- Content that changes size -->
  </div>
</template>
```

The spotlight and popover will automatically adjust when the panel expands!

## Examples

Check out the `examples/` directory for complete working examples:

- Basic tutorial
- Multi-step onboarding flow
- Form validation tutorial
- Feature tour

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type {
  TutorialConfig,
  TutorialStep,
  TutorialState,
  TutorialEventType
} from 'vue-nudge'
```

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+

Requires:
- Vue 3.3+
- ResizeObserver API
- MutationObserver API

## Contributing

Contributions are currently closed, but will be open in near future!

## License
[![license](https://img.shields.io/npm/l/vue-nudge.svg)](https://github.com/stwic/nudge/blob/main/LICENSE)
MIT License - see [LICENSE](LICENSE) file for details

## Credits

Built by [Amir Talic](https://github.com/stwic) for game-quality user experiences.

Inspired by tutorials from:
- Crusader Kings 3
- Europa Universalis V
- Cities: Skylines 2
