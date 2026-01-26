<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from "vue";
import { ElMessage } from "element-plus";
import {
  SkipForward,
  Disc3,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Mic2,
} from "lucide-vue-next";
import { adminNext } from "@/api/rooms";
import { getPlayUrl, getLyric } from "@/api/songs";
import { useRoomActions, useRoomSelector } from "@/stores/useRoomStore";
import { parseLrc, findCurrentLineIndex, type LrcLine } from "@/lib/lrc";
import Button from "@/components/ui/Button.vue";

const actions = useRoomActions();
const nowPlaying = useRoomSelector((s) => s.nowPlaying);
const role = useRoomSelector((s) => s.currentUser?.role);
const roomId = useRoomSelector((s) => s.room?.id);
const actionLoading = useRoomSelector((s) => s.actionLoading);

const audioRef = ref<HTMLAudioElement | null>(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const audioUrl = ref("");
const volume = ref(1);
const isMuted = ref(false);
const prevVolume = ref(1);

// Lyrics state
const showLyrics = ref(false);
const lyrics = ref<LrcLine[]>([]);
const currentLineIndex = ref(-1);
const lyricsContainerRef = ref<HTMLDivElement | null>(null);

const canAdmin = computed(
  () => role.value === "HOST" || role.value === "MODERATOR",
);
const nextLoadingKey = computed(() => `admin:next:${roomId.value || ""}`);
const nextLoading = computed(() => !!actionLoading.value[nextLoadingKey.value]);

// Format seconds to MM:SS
function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

async function loadAndPlay() {
  if (!nowPlaying.value) {
    audioUrl.value = "";
    currentTime.value = 0;
    duration.value = 0;
    lyrics.value = [];
    currentLineIndex.value = -1;
    return;
  }

  const songId = nowPlaying.value.song.id;

  // Load Lyrics
  getLyric(songId).then((res) => {
    if (res.ok) {
      lyrics.value = parseLrc(res.data.lyric);
    } else {
      lyrics.value = [];
    }
  });

  try {
    const res = await getPlayUrl(songId);
    if (!res.ok) throw new Error((res as any).error.message);

    audioUrl.value = res.data.url;

    // Auto play
    setTimeout(() => {
      if (audioRef.value) {
        audioRef.value.play().catch((e) => {
          console.warn("Auto play failed:", e);
          ElMessage.info("点击播放按钮开始听歌");
        });
      }
    }, 100);
  } catch (e) {
    console.error("Failed to get play url:", e);
    ElMessage.error("无法播放该歌曲");
  }
}

watch(
  () => nowPlaying.value?.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      loadAndPlay();
    }
  },
  { immediate: true },
);

function togglePlay() {
  if (!audioRef.value || !canAdmin.value) return;
  if (isPlaying.value) {
    audioRef.value.pause();
  } else {
    audioRef.value.play();
  }
}

function handleProgressClick(e: MouseEvent) {
  if (!canAdmin.value || !audioRef.value) return;
  const rect = (e.target as HTMLElement).getBoundingClientRect();
  const pos = (e.clientX - rect.left) / rect.width;
  audioRef.value.currentTime = pos * (audioRef.value.duration || 0);
}

function toggleMute() {
  if (!audioRef.value) return;
  if (isMuted.value) {
    audioRef.value.muted = false;
    volume.value = prevVolume.value;
    isMuted.value = false;
  } else {
    prevVolume.value = volume.value;
    audioRef.value.muted = true;
    volume.value = 0;
    isMuted.value = true;
  }
}

function onVolumeChange(e: Event) {
  const val = Number((e.target as HTMLInputElement).value);
  volume.value = val;
  if (audioRef.value) {
    audioRef.value.volume = val;
    audioRef.value.muted = val === 0;
    isMuted.value = val === 0;
  }
}

function onTimeUpdate() {
  if (audioRef.value) {
    currentTime.value = audioRef.value.currentTime;
    duration.value =
      audioRef.value.duration || nowPlaying.value?.song.durationSec || 0;

    // Update lyrics index
    if (lyrics.value.length > 0) {
      const idx = findCurrentLineIndex(lyrics.value, currentTime.value);
      if (idx !== currentLineIndex.value) {
        currentLineIndex.value = idx;
        scrollToCurrentLine();
      }
    }
  }
}

function scrollToCurrentLine() {
  if (!lyricsContainerRef.value || currentLineIndex.value < 0) return;
  const el = lyricsContainerRef.value.children[
    currentLineIndex.value
  ] as HTMLElement;
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function onEnded() {
  isPlaying.value = false;
  // If host, auto next
  if (canAdmin.value && roomId.value) {
    nextSong();
  }
}

function onPlay() {
  isPlaying.value = true;
}

function onPause() {
  isPlaying.value = false;
}

async function nextSong() {
  if (!roomId.value) return;
  actions.setActionLoading(nextLoadingKey.value, true);
  try {
    const res = await adminNext(roomId.value);
    if (!res.ok) throw new Error((res as any).error.message);
    ElMessage.success("已切到下一首");
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    actions.setActionLoading(nextLoadingKey.value, false);
  }
}

// Keyboard shortcuts
function onKeydown(e: KeyboardEvent) {
  if (
    e.target instanceof HTMLInputElement ||
    e.target instanceof HTMLTextAreaElement
  )
    return;
  if (e.code === "Space") {
    e.preventDefault();
    if (canAdmin.value) {
      togglePlay();
    }
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <div
    class="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl transition-all duration-500"
    :class="{ 'h-[500px]': showLyrics }"
  >
    <audio
      ref="audioRef"
      :src="audioUrl"
      @timeupdate="onTimeUpdate"
      @ended="onEnded"
      @play="onPlay"
      @pause="onPause"
      preload="auto"
    ></audio>

    <!-- Background Blur -->
    <div class="absolute inset-0 z-0">
      <img
        v-if="nowPlaying?.song.coverUrl"
        :src="nowPlaying.song.coverUrl"
        class="h-full w-full object-cover opacity-30 blur-3xl scale-125"
      />
      <div
        v-else
        class="h-full w-full bg-gradient-to-br from-indigo-900/40 to-slate-900/40 opacity-50 blur-3xl"
      ></div>
    </div>

    <!-- Content -->
    <div
      class="relative z-10 flex flex-col gap-6 p-6 sm:flex-row sm:items-end h-full"
    >
      <!-- Album Art / Lyrics Toggle Area -->
      <div
        class="relative shrink-0 transition-all duration-500 ease-in-out"
        :class="
          showLyrics
            ? 'w-0 opacity-0 hidden sm:block sm:w-0 sm:opacity-0'
            : 'w-full sm:w-48 lg:w-64 aspect-square'
        "
      >
        <!-- Standard Cover View -->
        <div
          class="group relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-black/20 shadow-xl"
        >
          <img
            v-if="nowPlaying?.song.coverUrl"
            :src="nowPlaying.song.coverUrl"
            class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            :class="{ 'animate-spin-slow': isPlaying }"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center text-white/10"
          >
            <Disc3
              class="h-24 w-24"
              :class="{ 'animate-spin-slow': isPlaying }"
            />
          </div>

          <!-- Hover Play Button -->
          <div
            class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <button
              aria-label="播放/暂停"
              data-testid="nowplaying-hover-toggle-play"
              class="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-md transition-transform hover:scale-110"
              @click="togglePlay"
            >
              <Pause v-if="isPlaying" class="h-8 w-8 text-white fill-white" />
              <Play v-else class="ml-1 h-8 w-8 text-white fill-white" />
            </button>
          </div>
        </div>
      </div>

      <!-- Lyrics Panel (Takes over space when active) -->
      <div
        v-if="showLyrics"
        class="absolute inset-0 z-20 flex flex-col bg-black/40 backdrop-blur-xl p-6 transition-all duration-500"
      >
        <div class="flex items-center justify-between mb-4 shrink-0">
          <div class="text-sm font-medium text-white/60">Lyrics</div>
          <Button variant="ghost" size="icon" @click="showLyrics = false">
            <VolumeX class="h-4 w-4 rotate-45" />
            <!-- Close icon proxy -->
          </Button>
        </div>

        <div
          ref="lyricsContainerRef"
          class="flex-1 overflow-y-auto scrollbar-hide text-center space-y-6 mask-image-gradient"
        >
          <div
            v-if="lyrics.length === 0"
            class="h-full flex items-center justify-center text-white/40"
          >
            暂无歌词
          </div>
          <div
            v-for="(line, index) in lyrics"
            :key="index"
            class="transition-all duration-300 px-4"
            :class="
              index === currentLineIndex
                ? 'text-white text-xl font-bold scale-110'
                : 'text-white/40 text-base blur-[0.5px]'
            "
          >
            {{ line.text }}
          </div>
        </div>
      </div>

      <!-- Info & Controls (Standard View) -->
      <div
        class="flex flex-1 flex-col justify-end gap-4 min-w-0"
        :class="{ 'opacity-0 pointer-events-none': showLyrics }"
      >
        <div class="space-y-1">
          <div
            class="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/60"
          >
            <span v-if="nowPlaying" class="flex items-center gap-1">
              <span
                class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"
              ></span>
              Now Playing
            </span>
            <span v-else>Idle</span>
          </div>

          <h2
            data-testid="nowplaying-title"
            class="truncate text-3xl font-bold text-white sm:text-4xl"
          >
            {{ nowPlaying?.song.title || "暂无播放" }}
          </h2>
          <p class="truncate text-lg text-white/70">
            {{ nowPlaying?.song.artist || "等待点歌..." }}
          </p>
        </div>

        <div
          v-if="nowPlaying"
          class="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-white/50 w-fit backdrop-blur-md"
        >
          <img
            :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=${nowPlaying.requestedBy.id}`"
            class="h-5 w-5 rounded-full bg-white/10"
          />
          <span>Requested by {{ nowPlaying.requestedBy.displayName }}</span>
        </div>

        <!-- Progress Bar -->
        <div class="w-full space-y-2" v-if="nowPlaying">
          <div
            class="relative h-1.5 w-full cursor-pointer overflow-hidden rounded-full bg-white/10 group"
            @click="
              (e) => {
                if (!audioRef) return;
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                audioRef.currentTime = pos * (audioRef.duration || 0);
              }
            "
          >
            <div
              class="h-full rounded-full bg-white transition-all duration-100 ease-linear"
              :style="{ width: `${(currentTime / (duration || 1)) * 100}%` }"
            ></div>
          </div>
          <div class="flex justify-between text-xs text-white/40 font-mono">
            <span>{{ formatTime(currentTime) }}</span>
            <span>{{
              formatTime(duration || nowPlaying.song.durationSec || 0)
            }}</span>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex items-center justify-between pt-2">
          <!-- Volume & Lyrics Toggle -->
          <div class="flex items-center gap-2 group/volume">
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8 text-white/60 hover:text-white"
              @click="toggleMute"
            >
              <VolumeX v-if="isMuted || volume === 0" class="h-4 w-4" />
              <Volume2 v-else class="h-4 w-4" />
            </Button>
            <div
              class="w-0 overflow-hidden transition-all duration-300 group-hover/volume:w-24"
            >
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                :value="volume"
                class="h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/20 accent-white"
                @input="onVolumeChange"
              />
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- Lyrics Button -->
            <Button
              v-if="nowPlaying"
              variant="ghost"
              size="icon"
              class="h-10 w-10 rounded-full text-white/60 hover:text-white hover:bg-white/10"
              @click="showLyrics = true"
              title="歌词"
            >
              <Mic2 class="h-5 w-5" />
            </Button>

            <Button
              v-if="nowPlaying && canAdmin"
              variant="secondary"
              size="icon"
              class="h-10 w-10 rounded-full"
              data-testid="nowplaying-toggle-play"
              aria-label="播放/暂停"
              @click="togglePlay"
            >
              <Pause v-if="isPlaying" class="h-5 w-5 fill-current" />
              <Play v-else class="ml-1 h-5 w-5 fill-current" />
            </Button>

            <Button
              v-if="canAdmin && nowPlaying"
              variant="secondary"
              size="sm"
              :loading="nextLoading"
              data-testid="nowplaying-next"
              @click="nextSong"
            >
              <SkipForward class="mr-2 h-4 w-4" />
              切歌
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-spin-slow {
  animation: spin 8s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 12px;
  width: 12px;
  border-radius: 50%;
  background: white;
  margin-top: -4px;
}

input[type="range"]::-webkit-slider-runnable-track {
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.mask-image-gradient {
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 20%,
    black 80%,
    transparent 100%
  );
}
</style>
