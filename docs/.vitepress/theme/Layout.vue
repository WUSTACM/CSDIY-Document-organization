<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onMounted,
  onUnmounted,
  provide,
  ref,
  watch
} from 'vue'

const { Layout } = DefaultTheme
const { frontmatter, isDark } = useData()

// --- 1. 暗黑模式圆形扩散切换动画 (View Transition API) ---
const enableTransitions = () =>
  typeof document !== 'undefined' &&
  'startViewTransition' in document &&
  window.matchMedia('(prefers-reduced-motion: no-preference)').matches

provide('toggle-appearance', async ({ clientX: x, clientY: y }: MouseEvent) => {
  if (!enableTransitions()) {
    isDark.value = !isDark.value
    return
  }

  const clipPath = [
    `circle(0px at ${x}px ${y}px)`,
    `circle(${Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )}px at ${x}px ${y}px)`
  ]

  await document.startViewTransition(async () => {
    isDark.value = !isDark.value
    await nextTick()
  }).ready

  document.documentElement.animate(
    { clipPath: isDark.value ? [...clipPath].reverse() : clipPath },
    {
      duration: 300,
      easing: 'ease-in',
      fill: 'forwards',
      pseudoElement: `::view-transition-${isDark.value ? 'old' : 'new'}(root)`
    }
  )
})

// --- 2. 异步引入组件 ---
const CsdiyDarkHome = defineAsyncComponent(
  () => import('./components/CsdiyDarkHome.vue')
)
const ThemePicker = defineAsyncComponent(
  () => import('./components/ThemePicker.vue')
)

// --- 3. 桌面端暗黑首页定制逻辑 ---
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
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

::view-transition-old(root),
.dark::view-transition-new(root) {
  z-index: 1;
}

::view-transition-new(root),
.dark::view-transition-old(root) {
  z-index: 9999;
}

.VPSwitchAppearance {
  width: 22px !important;
}

.VPSwitchAppearance .check {
  transform: none !important;
}
</style>