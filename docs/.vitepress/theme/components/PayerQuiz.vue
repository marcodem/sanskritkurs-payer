<template>
  <div class="payer-quiz shadow-sm">
    <div v-if="!completed" class="quiz-content">
      <div class="quiz-header">
        <span class="quiz-step">{{ labels.questionPrefix }} {{ currentStep + 1 }} {{ labels.of }} {{ questions.length }}</span>
      </div>
      
      <h3 class="quiz-question">{{ currentQuestion.question }}</h3>
      
      <div class="quiz-options">
        <button 
          v-for="(option, index) in currentQuestion.options" 
          :key="index"
          @click="selectOption(index)"
          :class="['quiz-option-btn', { 'selected': selectedIndex === index, 'correct': showFeedback && index === currentQuestion.answer, 'wrong': showFeedback && selectedIndex === index && index !== currentQuestion.answer }]"
          :disabled="showFeedback"
        >
          <span class="option-label">{{ String.fromCharCode(65 + index) }}.</span>
          <span class="option-text">{{ option }}</span>
        </button>
      </div>
 
      <div v-if="showFeedback" class="quiz-feedback" :class="isCorrect ? 'text-success' : 'text-error'">
        <p v-if="isCorrect" class="feedback-msg">{{ labels.correct }} {{ currentQuestion.explanation || '' }}</p>
        <p v-else class="feedback-msg">{{ labels.wrong }} {{ currentQuestion.explanation || '' }}</p>
        
        <button @click="nextStep" class="next-btn">
          {{ currentStep + 1 === questions.length ? labels.viewResult : labels.nextQuestion }}
        </button>
      </div>
      
      <div v-else class="quiz-actions">
        <button 
          @click="checkAnswer" 
          :disabled="selectedIndex === null"
          class="check-btn"
        >
          {{ labels.checkAnswer }}
        </button>
      </div>
    </div>
 
    <div v-else class="quiz-result">
      <h3 class="result-title">{{ labels.result }}</h3>
      <p class="result-score">{{ labels.scorePrefix }} {{ score }} {{ labels.of }} {{ questions.length }} {{ labels.scoreSuffix }}</p>
      <div class="result-visual">
        <div class="score-bar">
          <div class="score-progress" :style="{ width: (score / questions.length * 100) + '%' }"></div>
        </div>
      </div>
      <button @click="resetQuiz" class="reset-btn">{{ labels.reset }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useData } from 'vitepress'

const { lang } = useData()

const props = defineProps({
  questions: {
    type: Array,
    required: true,
    default: () => []
  }
})

const i18n = {
  de: {
    questionPrefix: 'Frage',
    of: 'von',
    correct: '✨ Richtig!',
    wrong: '❌ Leider falsch.',
    viewResult: 'Ergebnis anzeigen',
    nextQuestion: 'Nächste Frage',
    checkAnswer: 'Antwort prüfen',
    result: 'Ergebnis',
    scorePrefix: 'Sie haben',
    scoreSuffix: 'Fragen richtig beantwortet.',
    reset: 'Quiz wiederholen'
  },
  en: {
    questionPrefix: 'Question',
    of: 'of',
    correct: '✨ Correct!',
    wrong: '❌ Incorrect.',
    viewResult: 'View Result',
    nextQuestion: 'Next Question',
    checkAnswer: 'Check Answer',
    result: 'Result',
    scorePrefix: 'You answered',
    scoreSuffix: 'questions correctly.',
    reset: 'Restart Quiz'
  }
}

const labels = computed(() => {
  const currentLang = lang.value || ''
  const locale = currentLang.startsWith('en') ? 'en' : 'de'
  return i18n[locale]
})

const currentStep = ref(0)
const selectedIndex = ref(null)
const showFeedback = ref(false)
const completed = ref(false)
const score = ref(0)

const currentQuestion = computed(() => props.questions[currentStep.value])
const isCorrect = computed(() => selectedIndex.value === currentQuestion.value.answer)

const selectOption = (index) => {
  if (showFeedback.value) return
  selectedIndex.value = index
}

const checkAnswer = () => {
  if (selectedIndex.value === null) return
  showFeedback.value = true
  if (isCorrect.value) {
    score.value++
  }
}

const nextStep = () => {
  if (currentStep.value + 1 < props.questions.length) {
    currentStep.value++
    selectedIndex.value = null
    showFeedback.value = false
  } else {
    completed.value = true
  }
}

const resetQuiz = () => {
  currentStep.value = 0
  selectedIndex.value = null
  showFeedback.value = false
  completed.value = false
  score.value = 0
}
</script>

<style scoped>
.payer-quiz {
  background-color: var(--vp-c-bg-alt);
  border-left: 4px solid var(--vp-c-brand-1);
  padding: 2rem;
  margin: 2rem 0;
  border-radius: 0 8px 8px 0;
  font-family: var(--vp-font-family-base);
}

.quiz-step {
  font-family: "Inter", sans-serif;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.quiz-question {
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 1.4rem;
  color: var(--vp-c-text-1);
}

.quiz-options {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.quiz-option-btn {
  display: flex;
  align-items: center;
  padding: 0.8rem 1.2rem;
  background-color: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  text-align: left;
  transition: all 0.2s ease;
  cursor: pointer;
  font-family: "Inter", sans-serif;
  color: var(--vp-c-text-1);
}

.quiz-option-btn:hover:not(:disabled) {
  border-color: var(--vp-c-brand-1);
  background-color: var(--vp-c-bg-soft);
}

.quiz-option-btn.selected {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px var(--vp-c-brand-soft);
}

.quiz-option-btn.correct {
  background-color: #f0fdf4;
  border-color: #22c55e;
  color: #166534;
}

.quiz-option-btn.wrong {
  background-color: #fef2f2;
  border-color: #ef4444;
  color: #991b1b;
}

.option-label {
  font-weight: 600;
  margin-right: 1rem;
  color: var(--vp-c-text-2);
  width: 20px;
}

.quiz-feedback {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--vp-c-divider);
}

.feedback-msg {
  font-style: italic;
  margin-bottom: 1rem;
}

.check-btn, .next-btn, .reset-btn {
  margin-top: 1rem;
  padding: 0.6rem 1.5rem;
  background-color: var(--vp-c-brand-1);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-family: "Inter", sans-serif;
  font-weight: 500;
  transition: opacity 0.2s;
}

.check-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.check-btn:hover:not(:disabled), .next-btn:hover, .reset-btn:hover {
  opacity: 0.9;
}

.quiz-result {
  text-align: center;
}

.result-title {
  font-size: 1.8rem;
  margin-bottom: 1rem;
}

.result-score {
  font-size: 1.2rem;
  color: var(--vp-c-text-2);
  margin-bottom: 1.5rem;
}

.score-bar {
  height: 12px;
  background-color: var(--vp-c-bg);
  border-radius: 6px;
  margin-bottom: 2rem;
  overflow: hidden;
}

.score-progress {
  height: 100%;
  background-color: var(--vp-c-brand-1);
  transition: width 0.6s ease-out;
}

.text-success { color: #166534; }
.text-error { color: #991b1b; }
</style>
