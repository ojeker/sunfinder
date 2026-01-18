<template>
  <main>
    <h1>Webcam Sunline</h1>
    <p>Loaded from the repo root configuration.</p>

    <div v-if="error" class="error">{{ error }}</div>

    <template v-else>
      <p v-if="!config">Loading webcams…</p>
      <ul v-else class="webcam-grid">
        <li v-for="webcam in config.webcams" :key="webcam.id">
          <WebcamCard
            :webcam="webcam"
            :user-coord="config.settings.user_coord_ch2056"
            :worker-base-url="config.settings.worker_base_url"
            :refresh-minutes="config.settings.refresh_minutes"
            :paused="isPaused"
          />
        </li>
      </ul>
    </template>
  </main>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import type { RootConfig } from '@webcam-sunline/config/parse';
import { loadConfig } from './services/configLoader';
import WebcamCard from './components/WebcamCard.vue';

const config = ref<RootConfig | null>(null);
const error = ref<string | null>(null);
const isPaused = ref(false);

function updateVisibility() {
  isPaused.value = document.hidden;
}

onMounted(async () => {
  updateVisibility();
  document.addEventListener('visibilitychange', updateVisibility);
  try {
    const data = await loadConfig();
    config.value = data;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load configuration.';
  }
});

onUnmounted(() => {
  document.removeEventListener('visibilitychange', updateVisibility);
});
</script>
