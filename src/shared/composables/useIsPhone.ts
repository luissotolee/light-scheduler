import { onBeforeUnmount, readonly, ref, type Ref } from 'vue'
import { PHONE_MEDIA_QUERY } from '@/shared/utils/viewport'

export function useIsPhone(): Readonly<Ref<boolean>> {
  const isPhone = ref(false)

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return readonly(isPhone)
  }

  const query = window.matchMedia(PHONE_MEDIA_QUERY)
  isPhone.value = query.matches

  const handleChange = (event: MediaQueryListEvent): void => {
    isPhone.value = event.matches
  }

  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', handleChange)
  } else if (typeof query.addListener === 'function') {
    query.addListener(handleChange)
  }

  onBeforeUnmount(() => {
    if (typeof query.removeEventListener === 'function') {
      query.removeEventListener('change', handleChange)
    } else if (typeof query.removeListener === 'function') {
      query.removeListener(handleChange)
    }
  })

  return readonly(isPhone)
}
