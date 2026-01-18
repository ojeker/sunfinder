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
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import type { RootConfig } from '@webcam-sunline/config/parse';
import { compass8FromBearing, planarBearingDeg, planarDistanceKm } from '@webcam-sunline/domain';
import {
  isWorkerBypass,
  nextRetryDelayMs,
  resolvePreviewBaseUrl,
  shouldRetry
} from '../services/previewResolver';

type Webcam = RootConfig['webcams'][number];
type Coord = RootConfig['settings']['user_coord_ch2056'];

const props = defineProps<{
  webcam: Webcam;
  userCoord: Coord;
  workerBaseUrl: string;
  refreshMinutes: number;
  paused: boolean;
}>();

const refreshToken = ref(Date.now());
const loadError = ref<string | null>(null);
const retryAttempt = ref(0);
const retryTimeoutId = ref<number | null>(null);

const distanceKm = computed(() => planarDistanceKm(props.userCoord, props.webcam.coord_ch2056));
const bearingDeg = computed(() => planarBearingDeg(props.userCoord, props.webcam.coord_ch2056));
const compass = computed(() => compass8FromBearing(bearingDeg.value));
const arrowStyle = computed(() => ({
  transform: `rotate(${bearingDeg.value}deg)`
}));

const isBypass = computed(() => isWorkerBypass(props.webcam));

const previewBaseUrl = computed(() => {
  return resolvePreviewBaseUrl(props.webcam, props.workerBaseUrl);
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
  loadError.value = isBypass.value
    ? 'Direct image failed (worker bypass enabled)'
    : 'Preview failed';
  scheduleRetry();
}

function handleImageLoad() {
  loadError.value = null;
  retryAttempt.value = 0;
  clearRetryTimer();
}

let intervalId: number | null = null;

function clearRetryTimer() {
  if (retryTimeoutId.value !== null) {
    window.clearTimeout(retryTimeoutId.value);
    retryTimeoutId.value = null;
  }
}

function clearIntervalTimer() {
  if (intervalId !== null) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
}

function startRefresh(triggerImmediate = false) {
  clearIntervalTimer();
  if (props.paused || !Number.isFinite(props.refreshMinutes) || props.refreshMinutes <= 0) {
    return;
  }
  if (triggerImmediate) {
    refreshToken.value = Date.now();
  }
  const intervalMs = props.refreshMinutes * 60 * 1000;
  intervalId = window.setInterval(() => {
    refreshToken.value = Date.now();
  }, intervalMs);
}

function stopRefresh() {
  clearIntervalTimer();
  clearRetryTimer();
}

function scheduleRetry() {
  if (props.paused || !previewBaseUrl.value || !shouldRetry(retryAttempt.value)) {
    return;
  }

  const delayMs = nextRetryDelayMs(retryAttempt.value);
  retryAttempt.value += 1;
  clearRetryTimer();
  retryTimeoutId.value = window.setTimeout(() => {
    refreshToken.value = Date.now();
  }, delayMs);
}

onMounted(() => {
  startRefresh();
});

onUnmounted(() => {
  stopRefresh();
});

watch(
  () => props.paused,
  paused => {
    if (paused) {
      stopRefresh();
    } else {
      startRefresh(true);
      if (loadError.value) {
        refreshToken.value = Date.now();
      }
    }
  }
);

watch(
  () => props.refreshMinutes,
  () => {
    startRefresh();
  }
);
</script>
