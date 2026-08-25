<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface ThemeOption {
  key: string
  name: string
}

const THEMES: ThemeOption[] = [
  { key: 'default', name: '⚡ 默认 (Default)' },
  { key: 'tokyo-night', name: '🌃 Tokyo Night' },
  { key: 'dracula', name: '🧛 Dracula' },
  { key: 'catppuccin', name: '🐱 Catppuccin' },
  { key: 'nord', name: '❄️ Nord' }
]

const currentTheme = ref('default')

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
}

onMounted(() => {
  const saved = localStorage.getItem('site-theme-preset') || 'default'
  setTheme(saved)
})
</script>

<template>
  <div class="theme-select-wrapper">
    <select
      :value="currentTheme"
      class="theme-select"
      aria-label="选择主题预设"
      @change="(e) => setTheme((e.target as HTMLSelectElement).value)"
    >
      <option v-for="t in THEMES" :key="t.key" :value="t.key">
        {{ t.name }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.theme-select-wrapper {
  display: inline-flex;
  align-items: center;
  margin: 0 6px;
}
.theme-select {
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  line-height: 22px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-border);
  background-color: var(--vp-c-bg-alt);
  color: var(--vp-c-text-1);
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s, color 0.2s;
}
.theme-select:hover {
  border-color: var(--vp-c-brand-1);
}
</style>