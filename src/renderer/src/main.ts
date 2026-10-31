import { createApp } from 'vue'

import { detectLocale, i18n, setLocale } from './i18n'
import './styles/base.css'
import App from './ui/App.vue'

const systemLanguages =
  typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language])
setLocale(detectLocale(systemLanguages))

createApp(App).use(i18n).mount('#app')
