<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface ThemeOption {
  key: string
  name: string
  color: string
}

const THEMES: ThemeOption[] = [
  { key: 'default', name: '默认 (Default)', color: '#3eaf7c' },
  { key: 'tokyo-night', name: 'Tokyo Night', color: '#7aa2f7' },
  { key: 'dracula', name: 'Dracula', color: '#bd93f9' },
  { key: 'catppuccin', name: 'Catppuccin', color: '#f5c2e7' },
  { key: 'nord', name: 'Nord', color: '#88c0d0' }
]

const currentTheme = ref('default')
const isOpen = ref(false)

function setTheme(themeKey: string) {
  currentTheme.value = themeKey
  if (typeof document !== 'undefined') {
    if (themeKey === 'default') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', themeKey)
    }
    localStorage.setItem('site-theme-preset', themeKey)
  }
  isOpen.value = false
}

function handleClickOutside(e: MouseEvent) {
  const el = document.querySelector('.theme-picker-wrapper')
  if (el && !el.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  const saved = localStorage.getItem('site-theme-preset') || 'default'
  setTheme(saved)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="theme-picker-wrapper">
    <!-- 图标触发按钮：尺寸与原生 36x36 图标一致 -->
    <button
      class="theme-btn"
      type="button"
      aria-label="选择主题色彩"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <svg class="palette-icon" viewBox="0 0 24 24" width="20" height="20">
        <path
          fill="currentColor"
          d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c1.38 0 2.5-1.12 2.5-2.5c0-.61-.23-1.2-.64-1.67a1.49 1.49 0 0 1-.36-.96c0-.83.67-1.5 1.5-1.5H17c2.76 0 5-2.24 5-5c0-4.42-4.03-8-10-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8s1.5.67 1.5 1.5S7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"
        />
      </svg>
    </button>

    <!-- 原生菜单卡片样式 -->
    <transition name="dropdown">
      <div v-if="isOpen" class="theme-menu">
        <button
          v-for="t in THEMES"
          :key="t.key"
          class="menu-item"
          :class="{ active: currentTheme === t.key }"
          type="button"
          @click="setTheme(t.key)"
        >
          <span class="color-dot" :style="{ backgroundColor: t.color }"></span>
          <span class="theme-name">{{ t.name }}</span>
        </button>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.theme-picker-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  margin: 0 4px;
}

.theme-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 36px;
  height: 36px;
  color: var(--vp-c-text-2);
  border-radius: 50%;
  transition: color 0.25s, background-color 0.25s;
}

.theme-btn:hover {
  color: var(--vp-c-text-1);
  background-color: var(--vp-c-bg-mute);
}

.palette-icon {
  display: inline-block;
  vertical-align: middle;
}

/* 下拉菜单面板 */
.theme-menu {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
  min-width: 150px;
  padding: 6px;
  border-radius: 12px;
  border: 1px solid var(--vp-c-border);
  background-color: var(--vp-c-bg-elv);
  box-shadow: var(--vp-shadow-3);
  z-index: 100;
}

/* 选项条目 */
.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  text-align: left;
  transition: background-color 0.2s, color 0.2s;
  cursor: pointer;
}

.menu-item:hover {
  background-color: var(--vp-c-bg-mute);
  color: var(--vp-c-brand-1);
}

.menu-item.active {
  color: var(--vp-c-brand-1);
  background-color: var(--vp-c-default-soft);
  font-weight: 600;
}

/* 颜色色块小圆点 */
.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* 展开淡入淡出动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translate(-50%, -6px);
}
</style>