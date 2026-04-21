<template>
  <div v-if="showFooter" class="payer-doc-footer">
    <!-- Vorherige Seite -->
    <a v-if="prev" :href="prev.link" class="pager-card pager-prev">
      <span class="pager-label">{{ isEn ? 'Previous' : 'Vorherige Seite' }}</span>
      <span class="pager-title">{{ prev.text }}</span>
    </a>
    <span v-else-if="hasSchrift" class="pager-spacer" />

    <!-- Schriftübung (nur für Lektionen mit Schriftlink) -->
    <a v-if="hasSchrift" :href="schriftUrl" class="pager-card pager-mid">
      <span class="pager-label">{{ isEn ? 'Exercise' : 'Zusätzliche Übung' }}</span>
      <span class="pager-title">{{ schriftText }}</span>
    </a>

    <!-- Nächste Seite -->
    <a v-if="next" :href="next.link" class="pager-card pager-next">
      <span class="pager-label">{{ isEn ? 'Next' : 'Nächste Seite' }}</span>
      <span class="pager-title">{{ next.text }}</span>
    </a>
    <span v-else-if="hasSchrift" class="pager-spacer" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useData, useRoute } from 'vitepress'
import navMapping from '../../data/nav_mapping.json'

const { theme, lang } = useData()
const route = useRoute()

const isEn = computed(() => route.path.startsWith('/en/'))

// Alle Sidebar-Links der Reihe nach einsammeln
function flattenSidebar(sidebar) {
  const items = []
  function walk(arr) {
    for (const item of arr) {
      if (item.link) items.push({ text: item.text, link: item.link })
      if (item.items) walk(item.items)
    }
  }
  if (Array.isArray(sidebar)) {
    walk(sidebar)
  } else if (sidebar && typeof sidebar === 'object') {
    for (const key of Object.keys(sidebar)) walk(sidebar[key])
  }
  return items
}

const prevNext = computed(() => {
  const all = flattenSidebar(theme.value.sidebar || [])
  const cur = route.path.replace(/\/$/, '').replace(/\.html$/, '')
  const idx = all.findIndex(item => {
    const l = (item.link || '').replace(/\/$/, '').replace(/\.html$/, '')
    return cur === l || cur.endsWith(l)
  })
  if (idx < 0) return { prev: null, next: null }
  return {
    prev: idx > 0 ? all[idx - 1] : null,
    next: idx < all.length - 1 ? all[idx + 1] : null
  }
})

const prev = computed(() => prevNext.value.prev)
const next = computed(() => prevNext.value.next)

// Schriftlink aus nav_mapping
const schriftData = computed(() => {
  const m = route.path.match(/lektion(\d+)/)
  if (!m) return null
  const key = `lektion${m[1].padStart(2, '0')}`
  const d = navMapping[key]
  if (!d || !d.schrift) return null
  return d
})

const hasSchrift = computed(() => !!schriftData.value)

const schriftUrl = computed(() => {
  if (!schriftData.value) return ''
  const base = isEn.value ? '/en/lektionen/' : '/lektionen/'
  return base + schriftData.value.schrift.replace(/\.md$/, '')
})

const schriftText = computed(() => {
  if (!schriftData.value) return ''
  let text = schriftData.value.schrift_text
  if (isEn.value) {
    text = text.replace('Schriftübung', 'Script Exercise')
    text = text.replace('Schrift', 'Script')
  }
  return text
})

const showFooter = computed(() => prev.value || next.value || hasSchrift.value)
</script>

<style scoped>
.payer-doc-footer {
  display: flex;
  gap: 8px;
  margin: 2rem 0 1rem 0;
  padding-top: 1.5rem;
  border-top: 1px solid var(--vp-c-divider);
}

.pager-card {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 11px 16px 13px;
  text-decoration: none !important;
  transition: border-color 0.25s;
  font-family: "Inter", sans-serif;
}

.pager-card:hover {
  border-color: var(--vp-c-brand-1);
}

.pager-prev {
  text-align: left;
}

.pager-mid,
.pager-next {
  text-align: right;
}

.pager-spacer {
  flex: 1;
}

.pager-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
  color: var(--vp-c-text-2);
}

.pager-title {
  display: block;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: var(--vp-c-brand-1);
  transition: color 0.25s;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
