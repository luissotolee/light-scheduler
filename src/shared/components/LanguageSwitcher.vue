<template>
  <div ref="root" class="language-switcher">
    <button
      ref="trigger"
      type="button"
      class="language-switcher__trigger"
      aria-haspopup="menu"
      :aria-expanded="open ? 'true' : 'false'"
      aria-controls="language-switcher-menu"
      :aria-label="triggerLabel"
      data-test="language-trigger"
      @click="toggle"
      @keydown.down.prevent="openAndFocus"
    >
      <LocaleFlag :locale="locale" />
      <span class="language-switcher__code">{{ locale.toUpperCase() }}</span>
      <i class="pi pi-chevron-down language-switcher__chevron" aria-hidden="true" />
    </button>

    <ul
      v-if="open"
      id="language-switcher-menu"
      ref="menu"
      class="language-switcher__menu"
      role="menu"
      :aria-label="t('languageSwitcher.menuLabel')"
      @keydown="handleMenuKeydown"
    >
      <li v-for="option in options" :key="option.value" role="none">
        <button
          type="button"
          role="menuitemradio"
          class="language-switcher__option"
          :class="{ 'language-switcher__option--active': option.value === locale }"
          :aria-checked="option.value === locale ? 'true' : 'false'"
          :data-test="`language-option-${option.value}`"
          @click="select(option.value)"
          @keydown.enter.prevent="select(option.value)"
          @keydown.space.prevent="select(option.value)"
        >
          <span class="language-switcher__option-main">
            <LocaleFlag :locale="option.value" />
            <span>{{ option.name }}</span>
          </span>
          <i
            v-if="option.value === locale"
            class="pi pi-check language-switcher__check"
            aria-hidden="true"
          />
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import LocaleFlag from '@/shared/components/LocaleFlag.vue'
import { useI18n } from '@/shared/i18n'
import type { Locale } from '@/shared/i18n'
import { LOCALE_META } from '@/shared/i18n/types'

const { t, locale, setLocale, availableLocales } = useI18n()

const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const menu = ref<HTMLElement | null>(null)
const open = ref(false)

const options = computed(() =>
  availableLocales.map((value) => ({ value, name: LOCALE_META[value].name })),
)
const currentName = computed(() => LOCALE_META[locale.value].name)
const currentIndex = computed(() => options.value.findIndex((option) => option.value === locale.value))
const triggerLabel = computed(() =>
  t('languageSwitcher.changeLanguage', { language: currentName.value }),
)

function menuItems(): HTMLButtonElement[] {
  const element = menu.value
  if (!element) return []
  return Array.from(element.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]'))
}

function focusItem(index: number): void {
  const items = menuItems()
  if (items.length === 0) return
  const normalized = ((index % items.length) + items.length) % items.length
  items[normalized]?.focus()
}

function moveFocus(delta: number): void {
  const items = menuItems()
  if (items.length === 0) return
  const active = document.activeElement
  const current = active instanceof HTMLButtonElement ? items.indexOf(active) : -1
  focusItem((current === -1 ? currentIndex.value : current) + delta)
}

function toggle(): void {
  open.value = !open.value
}

function openAndFocus(): void {
  if (!open.value) open.value = true
  else focusItem(currentIndex.value)
}

function close(returnFocus = false): void {
  open.value = false
  if (returnFocus) {
    void nextTick(() => trigger.value?.focus())
  }
}

function select(value: Locale): void {
  setLocale(value)
  close(true)
}

function handleMenuKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    close(true)
    return
  }
  if (event.key === 'Tab') {
    close()
    return
  }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    moveFocus(event.key === 'ArrowDown' ? 1 : -1)
  }
}

function handleOutsidePointer(event: PointerEvent): void {
  const element = root.value
  if (element && event.target instanceof Node && element.contains(event.target)) return
  open.value = false
}

watch(open, async (isOpen) => {
  if (isOpen) {
    document.addEventListener('pointerdown', handleOutsidePointer)
    await nextTick()
    focusItem(currentIndex.value)
    return
  }
  document.removeEventListener('pointerdown', handleOutsidePointer)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleOutsidePointer)
})
</script>

<style scoped>
.language-switcher {
  position: relative;
}

.language-switcher__trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
}

.language-switcher__trigger:hover {
  border-color: var(--color-accent);
}

.language-switcher__trigger:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.language-switcher__code {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.language-switcher__chevron {
  font-size: 0.7rem;
  color: var(--color-muted);
}

.language-switcher__menu {
  position: absolute;
  top: calc(100% + 0.35rem);
  right: 0;
  z-index: 10;
  min-width: 10rem;
  margin: 0;
  padding: 0.35rem;
  list-style: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.language-switcher__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  padding: 0.45rem 0.55rem;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.language-switcher__option:hover,
.language-switcher__option:focus-visible {
  background: var(--color-surface-alt);
}

.language-switcher__option:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
}

.language-switcher__option--active {
  color: var(--color-accent);
}

.language-switcher__option-main {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.language-switcher__check {
  font-size: 0.8rem;
}
</style>
