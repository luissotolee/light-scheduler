import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '@/router'
import { NAV_ITEMS } from '@/router/nav'

describe('routes', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('resolves every navigation route including lazy chunks', async () => {
    const router = createAppRouter(createMemoryHistory())

    for (const item of NAV_ITEMS) {
      await router.push(item.path)

      expect(router.currentRoute.value.name).toBe(item.name)
      expect(router.currentRoute.value.matched).toHaveLength(1)
    }
  })
})
