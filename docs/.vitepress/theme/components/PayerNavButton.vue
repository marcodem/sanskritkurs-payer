<template>
  <div class="pager">
    <a :href="cleanLink" class="pager-link next">
      <span class="desc">{{ labelText }}</span>
      <span class="title">{{ textWithoutPrefix }}</span>
    </a>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  }
})

const cleanLink = computed(() => {
  // Entfernt .md und stellt sicher, dass der Pfad relativ ist
  let l = props.link.replace(/\.md$/, '')
  if (!l.startsWith('.') && !l.startsWith('/')) {
    l = './' + l
  }
  return l
})

const labelText = computed(() => {
  // Standard-Label für die Übungsschaltfläche
  return 'Zusätzliche Übung'
})

const textWithoutPrefix = computed(() => {
  // Entfernt händische Präfixe wie "Zu", falls sie im Mapping noch drin sind
  return props.text.replace(/^(Zu |To )/, '')
})
</script>

<style scoped>
.pager {
  display: flex;
  flex-direction: column;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

.pager-link {
  display: block;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 11px 16px 13px;
  width: 100%;
  transition: border-color 0.25s;
  text-decoration: none !important;
  font-family: "Inter", sans-serif;
}

.pager-link:hover {
  border-color: var(--vp-c-brand-1);
}

.pager-link.next {
  margin-left: auto;
  text-align: right;
}

.desc {
  display: block;
  line-height: 20px;
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.title {
  display: block;
  line-height: 20px;
  font-size: 14px;
  font-weight: 400;
  color: var(--vp-c-brand-1);
  transition: color 0.25s;
}

@media (min-width: 640px) {
  .pager-link {
    max-width: 48%;
  }
}
</style>
