import { createApp } from 'vue'

import { i18n } from './i18n'
import './styles/base.css'
import App from './ui/App.vue'

createApp(App).use(i18n).mount('#app')
