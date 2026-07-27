<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, watch } from 'vue'

const { Layout } = DefaultTheme
const { frontmatter, isDark } = useData()
const CsdiyDarkHome = defineAsyncComponent(
  () => import('./components/CsdiyDarkHome.vue')
)
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
      <template #home-hero-before>
        <ClientOnly>
          <CsdiyDarkHome v-if="showDarkHome" />
          <div v-if="showDarkHome" class="csdiy-default-home-anchor" aria-hidden="true" />
        </ClientOnly>
      </template>
    </Layout>
  </div>
</template>
