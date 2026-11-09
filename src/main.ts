import Aura from '@primeuix/themes/aura'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'
import { createApp, watchEffect } from 'vue'
import App from './App.vue'
import { router } from './router'
import { primevueLocales } from './shared/i18n/primevue'
import { readInitialLocale, useLocaleStore } from './shared/stores/locale'
import { recoverInterruptedDemo } from '@/modules/demo/utils/storageSnapshot'
import './assets/main.css'
import 'primeicons/primeicons.css'

recoverInterruptedDemo()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(PrimeVue, {
  locale: primevueLocales[readInitialLocale()],
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.app-dark',
    },
  },
})
app.use(ToastService)
app.directive('tooltip', Tooltip)

const localeStore = useLocaleStore(pinia)
const primeVue = app.config.globalProperties.$primevue
watchEffect(() => {
  primeVue.config.locale = primevueLocales[localeStore.locale]
})

app.mount('#app')
