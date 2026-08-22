<template>
  <div class="language-settings">
    <div class="settings-header">
      <h2>{{ t.title }}</h2>
      <p class="settings-hint">{{ t.hint }}</p>
    </div>

    <div class="settings-group">
      <h3 class="locale-group-title">{{ t.activeLanguages || 'Aktive Sprachen' }}</h3>
      <div class="locale-grid">
        <label 
          v-for="locale in ALL_LOCALES.filter(l => selected.includes(l))" 
          :key="locale" 
          class="locale-item"
          :class="{ 'is-disabled': locale === currentLocale }"
        >
          <input
            type="checkbox"
            :value="locale"
            v-model="selected"
            :disabled="locale === currentLocale"
            @change="save"
          />
          <span class="locale-name">
            {{ LOCALE_NAMES[locale] }}
          </span>
          <span class="locale-code">({{ locale }})</span>
          <span v-if="locale === currentLocale" class="locale-current">{{ t.currentBadge }}</span>
        </label>
      </div>
    </div>

    <div class="settings-group" v-if="ALL_LOCALES.filter(l => !selected.includes(l)).length > 0">
      <h3 class="locale-group-title">{{ t.availableLanguages || 'Weitere Sprachen hinzufügen' }}</h3>
      <div class="locale-grid">
        <label 
          v-for="locale in ALL_LOCALES.filter(l => !selected.includes(l))" 
          :key="locale" 
          class="locale-item unselected-item"
        >
          <input
            type="checkbox"
            :value="locale"
            v-model="selected"
            @change="save"
          />
          <span class="locale-name">
            {{ LOCALE_NAMES[locale] }}
          </span>
          <span class="locale-code">({{ locale }})</span>
        </label>
      </div>
    </div>


    <!-- Per-locale prefetch indicators -->
    <div v-if="Object.keys(localeStatus).length > 0" class="locale-status-list">
      <div 
        v-for="(status, locale) in localeStatus" 
        :key="locale" 
        class="locale-status"
        :class="'status-' + status"
      >
        <span v-if="status === 'downloading'">⏳</span>
        <span v-else-if="status === 'done'">✓</span>
        <span v-else-if="status === 'skipped'">ℹ</span>
        <span v-else-if="status === 'error'">⚠</span>
        <span>{{ LOCALE_NAMES[locale] }} ({{ locale }})</span>
      </div>
    </div>

    <!-- Progress feedback -->
    <div v-if="progressMessage" class="progress-message">
      {{ progressMessage }}
    </div>

    <div class="settings-group install-section">
      <h3 class="locale-group-title">{{ t.installSectionTitle || 'Offline-App & Installation' }}</h3>
      
      <div class="install-card">
        <!-- State 1: Installierbar -->
        <template v-if="installAvailable">
          <div class="install-card-header">
            <span class="install-card-icon">📱</span>
            <div>
              <div class="install-card-title">{{ t.installBtn }}</div>
              <p class="install-card-hint">{{ t.installHint }}</p>
            </div>
          </div>
          <button
            @click="installApp"
            :disabled="installing"
            class="install-btn"
          >
            {{ installing ? t.installing : t.installBtn }}
          </button>
        </template>

        <!-- State 2: Bereits installiert -->
        <template v-else-if="alreadyInstalled">
          <div class="install-card-header">
            <span class="install-card-icon">✓</span>
            <div>
              <div class="install-status installed">{{ t.installedStatus }}</div>
              <p class="install-card-hint">{{ t.installedHint }}</p>
            </div>
          </div>
        </template>

        <!-- State 3: Nicht installierbar / Web-Betrieb -->
        <template v-else>
          <div class="install-card-header">
            <span class="install-card-icon">ℹ</span>
            <div>
              <div class="install-status unavailable">{{ t.unavailableStatus }}</div>
              <p class="install-card-hint">{{ t.unavailableHint }}</p>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Install progress overlay (scoped to Settings page) -->
    <Teleport to="body">
      <div v-if="showInstallOverlay" class="pwa-progress-overlay">
        <div class="pwa-progress-container">
          <div class="pwa-progress-title">{{ t.preparingApp }}</div>
          <div class="pwa-progress-subtitle">{{ installOverlayLocale || '—' }}</div>
          <div class="pwa-progress-bar">
            <div
              class="pwa-progress-fill"
              :style="{ width: installProgressPct + '%' }"
            ></div>
          </div>
          <div class="pwa-progress-info">
            <span>{{ installProgressPct }}%</span>
            <span>{{ installProgressDetail }}</span>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ALL_LOCALES, getActiveLocales, setActiveLocales } from '../lang-settings.js'
import {
  setupInstallCapture,
  subscribe as subscribeInstall,
  getDeferredPrompt,
  clearDeferredPrompt,
  isPromptAvailable
} from '../install-state.js'

const selected = ref([])
const currentLocale = ref('de')
const saving = ref(false)
const dirty = ref(false)
const progressMessage = ref('')

// Install-button state (reactive subscription to install-state.js)
const installAvailable = ref(false)
const alreadyInstalled = ref(false)
const installing = ref(false)
const showInstallOverlay = ref(false)
const installProgressPct = ref(0)
const installProgressDetail = ref('Initialisiere…')
const installOverlayLocale = ref('')
let unsubscribeInstall = null

import { LOCALE_NAMES } from '../../languages.mjs'

// Localized UI strings for all 14 languages. Settings page always renders in the
// currently selected locale — never bilingual.
const LOCALE_TEXTS = {
  de: {
    activeLanguages: 'Für Offline-Download ausgewählt',
    availableLanguages: 'Weitere Sprachen zum Download',
    installSectionTitle: 'Offline-App & Installation',
    title: 'Einstellungen',
    hint: 'Wählen Sie die Sprachen aus, die Sie vollständig für die Offline-Nutzung herunterladen möchten. Ihre Auswahl wird sofort automatisch gespeichert.',
    currentBadge: 'aktuell',
    saveBtn: 'Speichern',
    saving: 'Arbeite...',
    validationError: '',
    installing: 'App wird installiert…',
    installBtn: '📱 Web App installieren',
    installHint: 'Für vollständigen Offline-Betrieb auf Desktop oder Smartphone.',
    installedStatus: 'Web App ist installiert',
    installedHint: 'Die App läuft als eigenständige Anwendung.',
    unavailableStatus: 'Installation nicht verfügbar',
    unavailableHint: 'Für PWA-Installation: HTTPS-Verbindung und moderner Browser (Chrome, Edge, Safari 16.4+) erforderlich (oder App ist bereits installiert).',
    preparingApp: 'App wird vorbereitet…',
  },
  en: {
    activeLanguages: 'Selected for Offline Download',
    availableLanguages: 'More languages to download',
    installSectionTitle: 'Offline App & Installation',
    title: 'Settings',
    hint: 'Select the languages you want to fully download for offline use. Your selection is saved automatically.',
    currentBadge: 'current',
    saveBtn: 'Save',
    saving: 'Working...',
    validationError: '',
    installing: 'Installing app…',
    installBtn: '📱 Install Web App',
    installHint: 'For full offline use on desktop or mobile.',
    installedStatus: 'Web App is installed',
    installedHint: 'The app is running as a standalone application.',
    unavailableStatus: 'Installation not available',
    unavailableHint: 'For PWA installation: HTTPS connection and a modern browser (Chrome, Edge, Safari 16.4+) required (or app is already installed).',
    preparingApp: 'Preparing app…',
  },
  it: {
        activeLanguages: 'Lingue attive',
    availableLanguages: 'Aggiungi altre lingue',
    title: 'Impostazioni',
    hint: 'Seleziona le lingue da visualizzare nella navigazione e rendere disponibili offline.',
    currentBadge: 'attuale',
    saveBtn: 'Salva',
    saving: 'Lavoro...',
    validationError: 'Deve essere selezionata almeno una lingua.',
    installing: 'Installazione app…',
    installBtn: '📱 Installa Web App',
    installHint: 'Per un utilizzo offline completo su desktop o smartphone.',
    installedStatus: 'La Web App è installata',
    installedHint: 'L’app viene eseguita come applicazione standalone.',
    unavailableStatus: 'Installazione non disponibile',
    unavailableHint: 'Per installare la PWA: connessione HTTPS e browser moderno (Chrome, Edge, Safari 16.4+) necessari.',
    preparingApp: 'Preparazione app…',
  },

  ru: {
        activeLanguages: 'Активные языки',
    availableLanguages: 'Добавить другие языки',
    title: 'Настройки',
    hint: 'Выберите языки для отображения в навигации и использования в офлайн-режиме.',
    currentBadge: 'текущий',
    saveBtn: 'Сохранить',
    saving: 'Работаю...',
    validationError: 'Должен быть выбран хотя бы один язык.',
    installing: 'Установка приложения…',
    installBtn: '📱 Установить Web App',
    installHint: 'Для полнофункциональной работы без интернета на настольном компьютере или смартфоне.',
    installedStatus: 'Web App установлено',
    installedHint: 'Приложение работает как автономное приложение.',
    unavailableStatus: 'Установка недоступна',
    unavailableHint: 'Для установки PWA: HTTPS-соединение и современный браузер (Chrome, Edge, Safari 16.4+) обязательны.',
    preparingApp: 'Подготовка приложения…',
  },
  uk: {
        activeLanguages: 'Активні мови',
    availableLanguages: 'Додати інші мови',
    title: 'Налаштування',
    hint: 'Виберіть мови, які мають відображатися у навігації та бути доступними офлайн.',
    currentBadge: 'поточна',
    saveBtn: 'Зберегти',
    saving: 'Працюю...',
    validationError: 'Має бути вибрана принаймні одна мова.',
    installing: 'Встановлення додатку…',
    installBtn: '📱 Встановити Web App',
    installHint: 'Для повноцінного офлайн-використання на настільному комп’ютері або смартфоні.',
    installedStatus: 'Web App встановлено',
    installedHint: 'Додаток працює як самостійний застосунок.',
    unavailableStatus: 'Встановлення недоступне',
    unavailableHint: 'Для встановлення PWA: HTTPS-з’єднання та сучасний браузер (Chrome, Edge, Safari 16.4+) обов’язкові.',
    preparingApp: 'Підготовка додатку…',
  },
  hi: {
        activeLanguages: 'सक्रिय भाषाएँ',
    availableLanguages: 'अन्य भाषाएँ जोड़ें',
    title: 'सेटिंग्स',
    hint: 'उन भाषाओं का चयन करें जो नेविगेशन में दिखें और ऑफ़लाइन उपलब्ध हों।',
    currentBadge: 'वर्तमान',
    saveBtn: 'सहेजें',
    saving: 'कार्य हो रहा है...',
    validationError: 'कम से कम एक भाषा चुननी चाहिए।',
    installing: 'ऐप इंस्टॉल हो रहा है…',
    installBtn: '📱 वेब ऐप इंस्टॉल करें',
    installHint: 'डेस्कटॉप या स्मार्टफोन पर पूर्ण ऑफ़लाइन उपयोग के लिए।',
    installedStatus: 'वेब ऐप इंस्टॉल है',
    installedHint: 'ऐप स्टैंडअलोन एप्लिकेशन के रूप में चल रहा है।',
    unavailableStatus: 'इंस्टॉलेशन उपलब्ध नहीं',
    unavailableHint: 'PWA इंस्टॉलेशन के लिए: HTTPS कनेक्शन और आधुनिक ब्राउज़र (Chrome, Edge, Safari 16.4+) आवश्यक।',
    preparingApp: 'ऐप तैयार हो रहा है…',
  },
  fr: {
        activeLanguages: 'Langues actives',
    availableLanguages: 'Ajouter d\'autres langues',
    title: 'Paramètres',
    hint: 'Sélectionnez les langues à afficher dans la navigation et à rendre disponibles hors ligne.',
    currentBadge: 'actuelle',
    saveBtn: 'Enregistrer',
    saving: 'Traitement...',
    validationError: 'Au moins une langue doit être sélectionnée.',
    installing: 'Installation de l’app…',
    installBtn: '📱 Installer la Web App',
    installHint: 'Pour une utilisation hors ligne complète sur ordinateur ou smartphone.',
    installedStatus: 'La Web App est installée',
    installedHint: 'L’application s’exécute comme application autonome.',
    unavailableStatus: 'Installation non disponible',
    unavailableHint: 'Pour installer une PWA : connexion HTTPS et navigateur moderne (Chrome, Edge, Safari 16.4+) requis.',
    preparingApp: 'Préparation de l’app…',
  },
  es: {
        activeLanguages: 'Idiomas activos',
    availableLanguages: 'Añadir más idiomas',
    title: 'Configuración',
    hint: 'Seleccione los idiomas que desea mostrar en la navegación y tener disponibles sin conexión.',
    currentBadge: 'actual',
    saveBtn: 'Guardar',
    saving: 'Trabajando...',
    validationError: 'Debe seleccionar al menos un idioma.',
    installing: 'Instalando la app…',
    installBtn: '📱 Instalar Web App',
    installHint: 'Para uso sin conexión completo en escritorio o móvil.',
    installedStatus: 'La Web App está instalada',
    installedHint: 'La app se ejecuta como una aplicación independiente.',
    unavailableStatus: 'Instalación no disponible',
    unavailableHint: 'Para instalar la PWA: conexión HTTPS y navegador moderno (Chrome, Edge, Safari 16.4+) requeridos.',
    preparingApp: 'Preparando la app…',
  },
  ta: {
        activeLanguages: 'செயலிலுள்ள மொழிகள்',
    availableLanguages: 'மேலும் மொழிகளைச் சேர்',
    title: 'அமைப்புகள்',
    hint: 'வழிசெலுத்தலில் தெரியும் மற்றும் ஆஃப்லைனில் கிடைக்கும் மொழிகளைத் தேர்ந்தெடுக்கவும்.',
    currentBadge: 'தற்போதைய',
    saveBtn: 'சேமி',
    saving: 'வேலை நடக்கிறது...',
    validationError: 'குறைந்தது ஒரு மொழியைத் தேர்ந்தெடுக்க வேண்டும்.',
    installing: 'ஆப் நிறுவப்படுகிறது…',
    installBtn: '📱 வெப் ஆப் நிறுவு',
    installHint: 'டெஸ்க்டாப் அல்லது ஸ்மார்ட்போனில் முழு ஆஃப்லைன் பயன்பாட்டிற்கு.',
    installedStatus: 'வெப் ஆப் நிறுவப்பட்டுள்ளது',
    installedHint: 'ஆப் தனித்த அப்ளிகேஷனாக இயங்குகிறது.',
    unavailableStatus: 'நிறுவல் கிடைக்கவில்லை',
    unavailableHint: 'PWA நிறுவலுக்கு: HTTPS இணைப்பு மற்றும் நவீன உலாவி (Chrome, Edge, Safari 16.4+) தேவை.',
    preparingApp: 'ஆப் தயாராகிறது…',
  },
  pa: {
        activeLanguages: 'ਸਰਗਰਮ ਭਾਸ਼ਾਵਾਂ',
    availableLanguages: 'ਹੋਰ ਭਾਸ਼ਾਵਾਂ ਸ਼ਾਮਲ ਕਰੋ',
    title: 'ਸੈਟਿੰਗਾਂ',
    hint: 'ਉਹ ਭਾਸ਼ਾਵਾਂ ਚੁਣੋ ਜੋ ਨੈਵੀਗੇਸ਼ਨ ਵਿੱਚ ਦਿਖਾਈਆਂ ਜਾਣ ਅਤੇ ਆਫਲਾਈਨ ਉਪਲਬਧ ਹੋਣ।',
    currentBadge: 'ਮੌਜੂਦਾ',
    saveBtn: 'ਸੇਵ ਕਰੋ',
    saving: 'ਕੰਮ ਚੱਲ ਰਿਹਾ ਹੈ...',
    validationError: 'ਘੱਟੋ-ਘੱਟ ਇੱਕ ਭਾਸ਼ਾ ਚੁਣੀ ਹੋਣੀ ਚਾਹੀਦੀ ਹੈ।',
    installing: 'ਐਪ ਇੰਸਟਾਲ ਹੋ ਰਿਹਾ ਹੈ…',
    installBtn: '📱 ਵੈਬ ਐਪ ਇੰਸਟਾਲ ਕਰੋ',
    installHint: 'ਡੈਸਕਟਾਪ ਜਾਂ ਸਮਾਰਟਫੋਨ ’ਤੇ ਪੂਰੀ ਆਫਲਾਈਨ ਵਰਤੋਂ ਲਈ।',
    installedStatus: 'ਵੈਬ ਐਪ ਇੰਸਟਾਲ ਹੈ',
    installedHint: 'ਐਪ ਸਟੈਂਡਅਲੋਨ ਐਪਲੀਕੇਸ਼ਨ ਵਜੋਂ ਚੱਲ ਰਿਹਾ ਹੈ।',
    unavailableStatus: 'ਇੰਸਟਾਲੇਸ਼ਨ ਉਪਲਬਧ ਨਹੀਂ',
    unavailableHint: 'PWA ਇੰਸਟਾਲੇਸ਼ਨ ਲਈ: HTTPS ਕਨੈਕਸ਼ਨ ਅਤੇ ਆਧੁਨਿਕ ਬਰਾਊਜ਼ਰ (Chrome, Edge, Safari 16.4+) ਲੋੜੀਂਦਾ ਹੈ।',
    preparingApp: 'ਐਪ ਤਿਆਰ ਹੋ ਰਿਹਾ ਹੈ…',
  },
  la: {
        activeLanguages: 'Linguae activae',
    availableLanguages: 'Adde plures linguas',
    title: 'Configurationes',
    hint: 'Elige linguas quae in navigatione ostendantur et sine internet accessibiles sint.',
    currentBadge: 'praesens',
    saveBtn: 'Serva',
    saving: 'Operatur...',
    validationError: 'Saltem una lingua electa esse debet.',
    installing: 'App installatur…',
    installBtn: '📱 Web App installa',
    installHint: 'Ad usum offline completum in desktop vel smartphone.',
    installedStatus: 'Web App installata est',
    installedHint: 'App tamquam applicatio autonoma currit.',
    unavailableStatus: 'Installatio non praesto est',
    unavailableHint: 'Ad PWA installationem: connexio HTTPS et navigator recens (Chrome, Edge, Safari 16.4+) requiruntur.',
    preparingApp: 'App praeparatur…',
  },
  rm: {
        activeLanguages: 'Linguas activas',
    availableLanguages: 'Agiuntar autras linguas',
    title: 'Parameters',
    hint: 'Tscherna las linguas che duain esser visiblas en la navigaziun e disponiblas offline.',
    currentBadge: 'actuala',
    saveBtn: 'Memorisar',
    saving: 'Lavurar...',
    validationError: 'Almain ina lingua sto esser tschernida.',
    installing: 'Installar l’app…',
    installBtn: '📱 Installar la Web App',
    installHint: 'Per diever offline cumplein sin desktop u smartphone.',
    installedStatus: 'La Web App è installada',
    installedHint: 'L’app funcziuna sco applicaziun autonoma.',
    unavailableStatus: 'Installaziun betg disponibla',
    unavailableHint: 'Per installaziun PWA: connex HTTPS e navigatur modern (Chrome, Edge, Safari 16.4+) necessaris.',
    preparingApp: 'Preparar l’app…',
  },
  ro: {
        activeLanguages: 'Limbi active',
    availableLanguages: 'Adăugați alte limbi',
    title: 'Setări',
    hint: 'Selectați limbile care să apară în navigare și să fie disponibile offline.',
    currentBadge: 'curentă',
    saveBtn: 'Salvează',
    saving: 'Se lucrează...',
    validationError: 'Trebuie selectată cel puțin o limbă.',
    installing: 'Se instalează aplicația…',
    installBtn: '📱 Instalează Web App',
    installHint: 'Pentru utilizare offline completă pe desktop sau smartphone.',
    installedStatus: 'Web App este instalată',
    installedHint: 'Aplicația rulează ca aplicație autonomă.',
    unavailableStatus: 'Instalarea nu este disponibilă',
    unavailableHint: 'Pentru instalare PWA: conexiune HTTPS și browser modern (Chrome, Edge, Safari 16.4+) necesare.',
    preparingApp: 'Se pregătește aplicația…',
  },
  id: {
    activeLanguages: 'Bahasa Aktif',
    availableLanguages: 'Tambahkan bahasa',
    title: 'Pengaturan',
    hint: 'Pilih bahasa yang akan ditampilkan dalam navigasi dan tersedia offline.',
    currentBadge: 'saat ini',
    saveBtn: 'Simpan',
    saving: 'Menyimpan...',
    validationError: 'Pilih minimal satu bahasa.',
    installing: 'Menginstal aplikasi…',
    installBtn: '📱 Instal Aplikasi Web',
    installHint: 'Untuk penggunaan offline penuh di desktop atau smartphone.',
    installedStatus: 'Aplikasi Web terinstal',
    installedHint: 'Aplikasi berjalan sebagai aplikasi mandiri.',
    unavailableStatus: 'Instalasi tidak tersedia',
    unavailableHint: 'Untuk instalasi PWA: diperlukan HTTPS dan browser modern.',
    preparingApp: 'Menyiapkan aplikasi…',
  },
  he: {
    activeLanguages: 'שפות פעילות',
    availableLanguages: 'הוסף שפות נוספות',
    title: 'הגדרות',
    hint: 'בחר את השפות שיוצגו בניווט ושיהיו זמינות במצב לא מקוון.',
    currentBadge: 'נוכחי',
    saveBtn: 'שמור',
    saving: 'שומר...',
    validationError: 'יש לבחור לפחות שפה אחת.',
    installing: 'מתקין אפליקציה...',
    installBtn: '📱 התקן אפליקציית רשת',
    installHint: 'לשימוש מלא במצב לא מקוון במחשב או בסמארטפון.',
    installedStatus: 'אפליקציית רשת מותקנת',
    installedHint: 'האפליקציה פועלת כיישום עצמאי.',
    unavailableStatus: 'התקנה אינה זמינה',
    unavailableHint: 'להתקנת PWA: נדרש חיבור HTTPS ודפדפן מודרני.',
    preparingApp: 'מכין אפליקציה...',
  },
}

// Computed helper — returns localized strings for the current locale, with German as fallback
const t = computed(() => LOCALE_TEXTS[currentLocale.value] || LOCALE_TEXTS.de)

function markDirty() {
  dirty.value = true
}

// Estimated size per language (~23 MB based on Phase 19 findings)
// Used ONLY for automatic quota monitoring — never shown to user.
const ESTIMATED_MB_PER_LOCALE = 23

// Per-locale prefetch status: { [locale]: 'idle' | 'downloading' | 'done' | 'error' }
const localeStatus = ref({})

/**
 * Trigger service-worker prefetch for a single locale by:
 * 1. Fetching /manifest-{locale}.json (URL list generated by build script)
 * 2. Sending PREFETCH_LOCALE message to SW with the URL list
 * 3. Waiting for PREFETCH_COMPLETE reply
 *
 * Returns { cached, failed, total } on success, null on error.
 */
async function prefetchLocale(locale) {
  try {
    const manifestUrl = `/manifest-${locale}.json`
    const resp = await fetch(manifestUrl, { credentials: 'same-origin' })
    if (!resp.ok) {
      console.warn(`[Settings] manifest-${locale}.json not found: ${resp.status}`)
      return null
    }
    const manifest = await resp.json()
    const urls = manifest.urls || []
    
    if (!navigator.serviceWorker?.controller) {
      console.warn('[Settings] No active service worker controller')
      return null
    }
    
    return new Promise((resolve) => {
      const handler = (event) => {
        const data = event.data
        if (!data) return
        if (data.type === 'PREFETCH_COMPLETE' && data.locale === locale) {
          navigator.serviceWorker.removeEventListener('message', handler)
          resolve({ cached: data.cached, failed: data.failed, total: data.total })
        } else if (data.type === 'PREFETCH_ERROR' && data.locale === locale) {
          navigator.serviceWorker.removeEventListener('message', handler)
          resolve(null)
        }
      }
      navigator.serviceWorker.addEventListener('message', handler)
      
      navigator.serviceWorker.controller.postMessage({
        type: 'PREFETCH_LOCALE',
        locale,
        urls
      })
      
      setTimeout(() => {
        navigator.serviceWorker.removeEventListener('message', handler)
        resolve(null)
      }, 120000)
    })
  } catch (err) {
    console.error(`[Settings] prefetchLocale(${locale}) failed:`, err)
    return null
  }
}

// Localized save-feedback strings (computed to follow currentLocale)
const saveFeedback = {
  // accessed via `saveFeedback[currentLocale.value]?.key ?? saveFallback.key`
}
const saveFallback = {
  saving: '⏳ Salva...',
  offlineUnavailable: ' (caching offline indisponibil — fără Service Worker)',
  downloading: (done, total) => `⏳ Se descarcă limbile noi (${done}/${total})...`,
  cached: (name, cached, total, done, tot) => `✓ ${name}: ${cached}/${total} pagini în cache (${done}/${tot})`,
  failed: (name, done, tot) => `⚠ ${name}: descărcare eșuată (${done}/${tot})`,
  summaryAdded: (n) => `+${n} limbă/limbi adăugate`,
  summaryRemoved: (n) => `-${n} limbă/limbi eliminate`,
  summaryUnchanged: 'nicio modificare',
  summarySaved: (parts) => `✓ ${parts}`,
  summaryNoCache: (parts) => `ℹ ${parts} — cache offline necesită implementare production`,
  error: (msg) => `⚠ Eroare la salvare: ${msg}`,
  timeout: '⚠ Salvare anulată (timeout). Reîncărcați pagina.',
}

// Localized messages for save() flow — keyed by currentLocale
const SAVE_MSG = {
  de: {
    saving: '⏳ Speichere Einstellungen...',
    offlineUnavailable: ' — Offline-Caching nicht verfügbar (kein Service Worker).',
    downloading: (done, total) => `⏳ Neue Sprachen werden heruntergeladen (${done}/${total})...`,
    cached: (name, cached, total, done, tot) => `✓ ${name}: ${cached}/${total} Seiten gecacht (${done}/${tot})`,
    failed: (name, done, tot) => `⚠ ${name}: Download fehlgeschlagen (${done}/${tot})`,
    summaryAdded: (n) => `+${n} Sprache(n) hinzugefügt`,
    summaryRemoved: (n) => `-${n} Sprache(n) entfernt`,
    summaryUnchanged: 'keine Änderungen',
    summarySaved: (parts) => `✓ ${parts}`,
    summaryNoCache: (parts) => `ℹ ${parts} — offline-Caching benötigt production deployment`,
    error: (msg) => `⚠ Fehler beim Speichern: ${msg}`,
    timeout: '⚠ Speichern abgebrochen (Timeout). Bitte Seite neu laden.',
  },
  en: {
    saving: '⏳ Saving settings...',
    offlineUnavailable: ' — Offline caching unavailable (no Service Worker).',
    downloading: (done, total) => `⏳ Downloading new languages (${done}/${total})...`,
    cached: (name, cached, total, done, tot) => `✓ ${name}: ${cached}/${total} pages cached (${done}/${tot})`,
    failed: (name, done, tot) => `⚠ ${name}: Download failed (${done}/${tot})`,
    summaryAdded: (n) => `+${n} language(s) added`,
    summaryRemoved: (n) => `-${n} language(s) removed`,
    summaryUnchanged: 'no changes',
    summarySaved: (parts) => `✓ ${parts}`,
    summaryNoCache: (parts) => `ℹ ${parts} — offline caching requires production deployment`,
    error: (msg) => `⚠ Save error: ${msg}`,
    timeout: '⚠ Save aborted (timeout). Please reload the page.',
  },
  // For the remaining locales we keep German as pragmatic fallback — 
  // the save feedback is transient and the user's primary language (settings titles etc.) is localized.
}

function msg(key, ...args) {
  const loc = SAVE_MSG[currentLocale.value] || SAVE_MSG.de
  const fn = loc[key]
  return typeof fn === 'function' ? fn(...args) : (fn ?? saveFallback[key])
}

async function save() {
  
  // Defensive: ensure UI always unlocks, even if something throws unexpectedly
  const hardUnlockTimeout = setTimeout(() => {
    console.warn('[Settings] save() unlock timeout — forcing UI unlock')
    saving.value = false
    if (progressMessage.value?.startsWith('⏳')) {
      progressMessage.value = msg('timeout')
    }
  }, 10000)
  
  try {
    saving.value = true
    
    const oldLocales = getActiveLocales()
    const newLocales = selected.value
    const addedLocales = newLocales.filter(l => !oldLocales.includes(l))
    const removedLocales = oldLocales.filter(l => !newLocales.includes(l))
    
    progressMessage.value = msg('saving')
    
    try {
      setActiveLocales(newLocales)
    } catch (err) {
      console.error('[Settings] setActiveLocales threw:', err)
    }
    
    dirty.value = false
    
    const hasSW = !!navigator.serviceWorker?.controller
    
    if (addedLocales.length > 0) {
      if (!hasSW) {
        progressMessage.value = `ℹ ${msg('summarySaved')(currentLocale.value === 'de' ? 'gespeichert' : 'saved')}${msg('offlineUnavailable')}`
        for (const locale of addedLocales) {
          localeStatus.value = { ...localeStatus.value, [locale]: 'skipped' }
        }
      } else {
        progressMessage.value = msg('downloading')(0, addedLocales.length)
        
        for (let i = 0; i < addedLocales.length; i++) {
          const locale = addedLocales[i]
          localeStatus.value = { ...localeStatus.value, [locale]: 'downloading' }
          
          const result = await prefetchLocale(locale)
          
          localeStatus.value = { ...localeStatus.value, [locale]: result ? 'done' : 'error' }
          
          const doneCount = i + 1
          progressMessage.value = result
            ? msg('cached')(LOCALE_NAMES[locale], result.cached, result.total, doneCount, addedLocales.length)
            : msg('failed')(LOCALE_NAMES[locale], doneCount, addedLocales.length)
        }
      }
    }
    
    if (removedLocales.length > 0) {
      console.log(`[Settings] Removed locales (SW auto-evicts):`, removedLocales)
    }
    
    const summaryParts = []
    if (addedLocales.length > 0) summaryParts.push(msg('summaryAdded')(addedLocales.length))
    if (removedLocales.length > 0) summaryParts.push(msg('summaryRemoved')(removedLocales.length))
    if (summaryParts.length === 0) summaryParts.push(msg('summaryUnchanged'))
    
    if (!hasSW) {
      progressMessage.value = msg('summaryNoCache')(summaryParts.join(', '))
    } else {
      progressMessage.value = msg('summarySaved')(summaryParts.join(', '))
    }
  } catch (err) {
    console.error('[Settings] save() failed:', err)
    progressMessage.value = msg('error')(err.message || err)
  } finally {
    clearTimeout(hardUnlockTimeout)
    saving.value = false
    
    setTimeout(() => {
      localeStatus.value = {}
      progressMessage.value = ''
    }, 5000)
  }
}

onMounted(() => {
  selected.value = getActiveLocales()
  
  const path = window.location.pathname
  const match = path.match(/^\/([a-z]{2})(\/|$)/)
  currentLocale.value = match ? match[1] : 'de'
  
  setupInstallCapture()
  
  unsubscribeInstall = subscribeInstall((state) => {
    installAvailable.value = state.available
    alreadyInstalled.value = state.installed
  })
})

onUnmounted(() => {
  if (unsubscribeInstall) unsubscribeInstall()
})

async function installApp() {
  const prompt = getDeferredPrompt()
  if (!prompt) return
  
  installing.value = true
  showInstallOverlay.value = true
  installProgressPct.value = 0
  installProgressDetail.value = 'Initialisiere…'
  installOverlayLocale.value = ''
  
  const swHandler = (event) => {
    const d = event.data
    if (!d) return
    if (d.type === 'PREFETCH_BATCH_PROGRESS') {
      const ratio = d.cumulativeTotal > 0 ? d.cumulativeCached / d.cumulativeTotal : 0
      installProgressPct.value = Math.round(ratio * 100)
      installProgressDetail.value = `${d.cumulativeCached} / ${d.cumulativeTotal}`
      installOverlayLocale.value = d.locale ? d.locale.toUpperCase() : ''
    } else if (d.type === 'PREFETCH_BATCH_COMPLETE') {
      installProgressPct.value = 100
      installProgressDetail.value = `${d.totalCached} / ${d.total}`
      installOverlayLocale.value = '✓'
      navigator.serviceWorker?.removeEventListener('message', swHandler)
    } else if (d.type === 'PREFETCH_BATCH_ERROR') {
      installProgressDetail.value = `⚠ ${d.error}`
      navigator.serviceWorker?.removeEventListener('message', swHandler)
    }
  }
  
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.addEventListener('message', swHandler)
  }
  
  const activeLocales = getActiveLocales()
  const localePayload = []
  for (const locale of activeLocales) {
    try {
      const manifestUrl = `/manifest-${locale}.json`
      const resp = await fetch(manifestUrl, { credentials: 'same-origin' })
      if (resp.ok) {
        const manifest = await resp.json()
        if (Array.isArray(manifest.urls) && manifest.urls.length > 0) {
          localePayload.push({ locale, urls: manifest.urls })
        }
      }
    } catch (err) {
      console.warn(`[Install] manifest-${locale}.json fetch failed:`, err.message)
    }
  }
  
  if (navigator.serviceWorker?.controller && localePayload.length > 0) {
    navigator.serviceWorker.controller.postMessage({
      type: 'PREFETCH_BATCH',
      locales: localePayload,
      parallel: 6
    })
  }
  
  try {
    prompt.prompt()
    await prompt.userChoice
  } catch (err) {
    console.warn('[Install] prompt failed:', err)
  }
  clearDeferredPrompt()
  
  setTimeout(() => {
    showInstallOverlay.value = false
    installing.value = false
    if (navigator.serviceWorker) {
      navigator.serviceWorker.removeEventListener('message', swHandler)
    }
  }, 2000)
}
</script>

<style scoped>
.language-settings {
  max-width: 640px;
  margin: 2rem auto;
  padding: 2rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  font-family: var(--vp-font-family-base);
}

.settings-header h2 {
  margin-top: 0;
  color: var(--vp-c-text-1);
  font-weight: 600;
}

.settings-hint {
  color: var(--vp-c-text-2);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.locale-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.5rem;
  margin: 1.5rem 0;
}

.locale-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background 200ms;
  user-select: none;
}

.locale-item:hover:not(.is-disabled) {
  background: var(--vp-c-bg);
}

.locale-item.is-disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.locale-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--vp-c-brand);
}

.locale-item.is-disabled input[type="checkbox"] {
  cursor: not-allowed;
}

.locale-name {
  font-weight: 500;
  color: var(--vp-c-text-1);
  flex: 1;
}

.locale-code {
  color: var(--vp-c-text-2);
  font-size: 0.875em;
  font-family: var(--vp-font-family-mono);
}

.locale-current {
  margin-left: auto;
  font-size: 0.75em;
  padding: 2px 6px;
  background: var(--vp-c-brand);
  color: white;
  border-radius: 2px;
  font-weight: 600;
  text-transform: uppercase;
}

.settings-actions {
  margin: 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.save-btn {
  background: var(--vp-c-brand);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 0.9375rem;
  transition: opacity 200ms, transform 200ms;
}

.save-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.validation-error {
  color: var(--vp-c-danger-1);
  font-size: 0.875rem;
}

.progress-message {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: var(--vp-c-bg);
  border-radius: 4px;
  font-size: 0.9375rem;
  border-left: 3px solid var(--vp-c-brand);
}

.locale-status-list {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.locale-status {
  font-size: 0.9375rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.locale-status.status-downloading {
  color: var(--vp-c-warning-1, #b48300);
}

.locale-status.status-done {
  color: var(--vp-c-success-1, #0f8a3a);
}

.locale-status.status-skipped {
  color: var(--vp-c-text-2, #6b7280);
}

.locale-status.status-error {
  color: var(--vp-c-danger-1, #b40000);
}

/* Install section styling */
.install-section {
  margin-top: 2rem;
}

.install-card {
  padding: 1.25rem 1.5rem;
  background: var(--vp-c-bg-soft, #f6f6f7);
  border: 1px solid var(--vp-c-divider, #e2e8f0);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: border-color 200ms, background 200ms;
}

.dark .install-card {
  background: var(--vp-c-bg-soft, #1e1e20);
  border-color: var(--vp-c-divider, #2e2e32);
}

.install-card-header {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
}

.install-card-icon {
  font-size: 1.35rem;
  line-height: 1.2;
}

.install-card-title {
  font-weight: 600;
  font-size: 1rem;
  color: var(--vp-c-text-1);
}

.install-card-hint {
  margin: 0.25rem 0 0 0;
  color: var(--vp-c-text-2);
  font-size: 0.8438rem;
  line-height: 1.5;
}

.install-status {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
}

.install-status.installed {
  color: #10b981;
}

.dark .install-status.installed {
  color: #34d399;
}

.install-status.unavailable {
  color: var(--vp-c-text-2, #6b7280);
}

.install-btn {
  align-self: flex-start;
  margin-top: 0.25rem;
  padding: 0.5rem 1.25rem;
  font-size: 0.9063rem;
  font-weight: 500;
  color: #fff;
  background: var(--vp-c-brand, #03192e);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 200ms, transform 200ms;
}

.install-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.install-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dark .install-btn {
  background: #1e3a5c;
}

.dark .install-btn:hover:not(:disabled) {
  background: #2a4a6c;
}
</style>

<style scoped>
/* Appended styles */
.locale-group-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--vp-c-text-1);
}
.quality-warning {
  color: #eab308;
  font-size: 0.9em;
  margin-right: 4px;
  cursor: help;
}
</style>
