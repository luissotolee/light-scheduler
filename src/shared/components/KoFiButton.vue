<template>
  <a
    class="ko-fi-button"
    :href="KO_FI_URL"
    target="_blank"
    rel="noopener noreferrer"
    data-test="ko-fi-button"
  >
    <img class="ko-fi-button__icon" :src="KO_FI_ICON" alt="" aria-hidden="true" />
    <span class="ko-fi-button__text">{{ t('app.supportOnKoFi') }}</span>
  </a>
</template>

<script setup lang="ts">
import { useI18n } from '@/shared/i18n'

const KO_FI_URL = 'https://ko-fi.com/J8C02AHRYD'
const KO_FI_ICON = 'https://storage.ko-fi.com/cdn/cup-border.png'

const { t } = useI18n()
</script>

<style scoped>
.ko-fi-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.75rem;
  border-radius: 7px;
  background-color: #72a4f2;
  box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.2);
  color: #fff;
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 2.25rem;
  text-decoration: none;
}

.ko-fi-button:hover,
.ko-fi-button:active {
  color: #fff;
  opacity: 0.85;
}

.ko-fi-button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.ko-fi-button__icon {
  width: 1.375rem;
  height: 1rem;
  animation: ko-fi-wiggle 3s infinite;
}

.ko-fi-button__text {
  white-space: nowrap;
}

@keyframes ko-fi-wiggle {
  0%,
  60%,
  75%,
  100% {
    transform: rotate(0) scale(1);
  }
  80% {
    transform: rotate(0) scale(1.1);
  }
  84% {
    transform: rotate(-10deg) scale(1.1);
  }
  88% {
    transform: rotate(10deg) scale(1.1);
  }
  92% {
    transform: rotate(-10deg) scale(1.1);
  }
  96% {
    transform: rotate(10deg) scale(1.1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ko-fi-button__icon {
    animation: none;
  }
}
</style>
