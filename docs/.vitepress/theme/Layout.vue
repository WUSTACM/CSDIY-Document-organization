<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import {
  computed,
  defineAsyncComponent,
  onMounted,
  onUnmounted,
  ref,
  watch
} from 'vue'

const { Layout } = DefaultTheme
const { frontmatter, isDark } = useData()

// --- 1. 异步引入组件 ---
const CsdiyDarkHome = defineAsyncComponent(
  () => import('./components/CsdiyDarkHome.vue')
)
const ThemePicker = defineAsyncComponent(
  () => import('./components/ThemePicker.vue')
)

// --- 2. 桌面端暗黑首页定制逻辑 ---
const mobileViewport = ref(
  typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches
)
let mobileMediaQuery: MediaQueryList | undefined

function syncMobileViewport() {
  mobileViewport.value = mobileMediaQuery?.matches ?? false
}

const showDarkHome = computed(
  () => isDark.value && frontmatter.value.layout === 'home' && !mobileViewport.value
)

const darkHomeRootClass = 'csdiy-dark-home-page'
const darkHomeReadyClass = 'csdiy-dark-home-ready'

watch(
  showDarkHome,
  (active) => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle(darkHomeRootClass, active)
      if (!active) document.documentElement.classList.remove(darkHomeReadyClass)
    }
  },
  { immediate: true }
)

onMounted(() => {
  mobileMediaQuery = window.matchMedia('(max-width: 700px)')
  syncMobileViewport()
  mobileMediaQuery.addEventListener('change', syncMobileViewport)
})

onUnmounted(() => {
  mobileMediaQuery?.removeEventListener('change', syncMobileViewport)
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove(darkHomeRootClass)
    document.documentElement.classList.remove(darkHomeReadyClass)
  }
})
</script>

<template>
  <div :class="{ 'dark-home-active': showDarkHome }">
    <Layout>
      <!-- 导航栏右侧注入主题色切换器 -->
      <template #nav-bar-content-after>
        <ClientOnly>
          <ThemePicker />
        </ClientOnly>
      </template>

      <!-- 暗黑模式 3D 首页插槽 -->
      <template #home-hero-before>
        <ClientOnly>
          <CsdiyDarkHome v-if="showDarkHome" />
          <div v-if="showDarkHome" class="csdiy-default-home-anchor" aria-hidden="true" />
        </ClientOnly>
      </template>
    </Layout>
  </div>
</template>

<style>
/* =======================================
   1. 全局平滑颜色渐变过渡 (替换 View Transition)
   ======================================= */
:root {
  --vp-theme-transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, fill 0.3s ease;
}

/* 让根容器、导航栏、侧边栏和平铺卡片实现丝滑淡入淡出 */
html,
body,
#app,
.VPNav,
.VPSidebar,
.VPContent,
.VPDoc,
.VPNavBar,
.VPNavBarMenu,
.VPFooter,
.VPHero,
.VPFeature {
  transition: var(--vp-theme-transition) !important;
}

/* =======================================
   2. 导航栏右侧组件 Flex 强制重新排序
   ======================================= */
.VPNavBarMenu {
  order: 1 !important;
}
.VPNavBarAppearance {
  order: 2 !important;
}
.theme-picker-wrapper {
  order: 3 !important;
  margin-left: 10px !important;
  margin-right: 0px !important;
}
.VPNavBarSocialLinks {
  order: 4 !important;
  margin-left: 8px !important;
  padding-left: 0 !important;
}
.VPNavBarFlyout.extra {
  order: 5 !important;
}
</style>