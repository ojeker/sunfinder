<template>
  <article class="card">
    <div class="card__image">
      <img
        v-if="previewUrl"
        :src="previewUrl"
        :alt="`${webcam.name} preview`"
        @error="handleImageError"
        @load="handleImageLoad"
      />
      <div v-else class="card__image-placeholder">Preview unavailable</div>
    </div>

    <div class="card__body">
      <strong>{{ webcam.name }}</strong>
      <div class="stats">
        <div class="stat">
          <span class="stat__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path
                d="M3 19h18l-6.5-11-4.5 7-3-4z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span class="stat__value">{{ webcam.elevation_m_asl }} m</span>
        </div>
        <div class="stat">
          <span class="stat__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path
                d="M4 12h16M4 12l3-3M4 12l3 3M20 12l-3-3M20 12l-3 3"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <span class="stat__value">{{ distanceKm.toFixed(1) }} km</span>
        </div>
        <div class="stat">
          <span
            class="stat__icon stat__icon--rotate"
            :style="arrowStyle"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" focusable="false">
              <path
                d="M12 4l6 8h-4v8h-4v-8H6z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span class="stat__value">{{ compass }}</span>
        </div>
      </div>
      <span v-if="statusMessage" class="badge badge--warning">{{ statusMessage }}</span>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { RootConfig } from '@webcam-sunline/config/parse';
import { compass8FromBearing, planarBearingDeg, planarDistanceKm } from '@webcam-sunline/domain';
import { WorkerClient } from '../services/workerClient';

type Webcam = RootConfig['webcams'][number];
type Coord = RootConfig['settings']['user_coord_ch2056'];

const props = defineProps<{
  webcam: Webcam;
  userCoord: Coord;
  workerBaseUrl: string;
}>();

const workerClient = new WorkerClient(props.workerBaseUrl);
const refreshToken = ref(Date.now());
const loadError = ref<string | null>(null);

const distanceKm = computed(() => planarDistanceKm(props.userCoord, props.webcam.coord_ch2056));
const bearingDeg = computed(() => planarBearingDeg(props.userCoord, props.webcam.coord_ch2056));
const compass = computed(() => compass8FromBearing(bearingDeg.value));
const arrowStyle = computed(() => ({
  transform: `rotate(${bearingDeg.value}deg)`
}));

const previewBaseUrl = computed(() => {
  if (props.webcam.source.kind === 'snapshot' && props.webcam.source.url) {
    return workerClient.imageUrl(props.webcam.source.url);
  }

  if (props.webcam.source.kind === 'page' && props.webcam.source.page) {
    return workerClient.htmlImageUrl(props.webcam.source.page, props.webcam.source.selector);
  }

  return null;
});

const previewUrl = computed(() => {
  if (!previewBaseUrl.value) {
    return null;
  }
  const url = new URL(previewBaseUrl.value);
  url.searchParams.set('t', refreshToken.value.toString());
  return url.toString();
});

const statusMessage = computed(() => {
  if (loadError.value) {
    return loadError.value;
  }
  if (!previewBaseUrl.value) {
    return 'Preview unsupported';
  }
  return null;
});

function handleImageError() {
  loadError.value = 'Preview failed';
}

function handleImageLoad() {
  loadError.value = null;
}

let intervalId: number | null = null;

onMounted(() => {
  if (!Number.isFinite(props.webcam.refresh.seconds) || props.webcam.refresh.seconds <= 0) {
    return;
  }

  const intervalMs = props.webcam.refresh.seconds * 1000;
  intervalId = window.setInterval(() => {
    refreshToken.value = Date.now();
  }, intervalMs);
});

onUnmounted(() => {
  if (intervalId !== null) {
    window.clearInterval(intervalId);
  }
});
</script>
