import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import './styles/themes.css' // 引入之前定义的多主题 CSS 变量
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout
} satisfies Theme