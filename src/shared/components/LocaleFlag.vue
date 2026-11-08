<template>
  <svg
    v-if="locale === 'en'"
    class="locale-flag"
    viewBox="0 0 60 30"
    aria-hidden="true"
    focusable="false"
  >
    <rect width="60" height="30" fill="#012169" />
    <path d="M0,0 60,30 M60,0 0,30" stroke="#ffffff" stroke-width="6" />
    <path d="M0,0 60,30 M60,0 0,30" stroke="#c8102e" stroke-width="3" />
    <path d="M30,0 V30 M0,15 H60" stroke="#ffffff" stroke-width="10" />
    <path d="M30,0 V30 M0,15 H60" stroke="#c8102e" stroke-width="6" />
  </svg>
  <svg
    v-else
    class="locale-flag"
    viewBox="0 0 60 40"
    aria-hidden="true"
    focusable="false"
  >
    <rect width="60" height="40" fill="#aa151b" />
    <rect y="10" width="60" height="20" fill="#f1bf00" />
  </svg>
</template>

<script setup lang="ts">
import type { Locale } from '@/shared/i18n'

defineProps<{
  locale: Locale
}>()
</script>

<style scoped>
.locale-flag {
  display: block;
  flex-shrink: 0;
  width: 1.4rem;
  height: 1rem;
  border-radius: 2px;
}
</style>
