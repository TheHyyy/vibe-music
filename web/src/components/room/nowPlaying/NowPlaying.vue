<script setup lang="ts">
import { computed, ref, watch, nextTick, inject } from "vue";
import { ElMessage } from "element-plus";
import { SkipForward, Disc3, Volume2, VolumeX, Mic2 } from "lucide-vue-next";
import { adminNext, vote, reportEnded } from "@/api/rooms";
import { getPlayUrl, getLyric } from "@/api/songs";
import { useRoomActions, useRoomSelector } from "@/stores/useRoomStore";
import type { WebSocketClient } from "@/hooks/useWebSocket";
import { parseLrc, findCurrentLineIndex, type LrcLine } from "@/lib/lrc";
import { animalAvatarUrl } from "@/lib/utils";
import Button from "@/components/ui/Button.vue";

const actions = useRoomActions();
const nowPlaying = useRoomSelector((s) => s.nowPlaying);
const playback = useRoomSelector((s) => s.playback);
const role = useRoomSelector((s) => s.currentUser?.role);
const roomId = useRoomSelector((s) => s.room?.id);
const roomSettings = useRoomSelector((s) => s.room?.settings);
const actionLoading = useRoomSelector((s) => s.actionLoading);
const socketClient = inject<WebSocketClient>("socketClient");

const audioRef = ref<HTMLAudioElement | null>(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const audioUrl = ref("");
const volume = ref(1);
const isMuted = ref(false);
const prevVolume = ref(1);

// Lyrics state
const showLyrics = ref(true);
const lyrics = ref<LrcLine[]>([]);
const currentLineIndex = ref(-1);
const lyricsContainerRef = ref<HTMLDivElement | null>(null);

watch(showLyrics, (val) => {
  if (val) {
    nextTick(() => {
      scrollToCurrentLine();
    });
  }
});

const canAdmin = computed(
  () => role.value === "HOST" || role.value === "MODERATOR",
);
const nextLoadingKey = computed(() => `admin:next:${roomId.value || ""}`);
const nextLoading = computed(() => !!actionLoading.value[nextLoadingKey.value]);
const voteSkipLoading = ref(false);

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

// Guest Sync Logic
watch(
  () => playback.value,
  (state) => {
    if (canAdmin.value || !audioRef.value) return;

    if (state.isPaused) {
      if (!audioRef.value.paused) audioRef.value.pause();
      if (state.pausedAt) {
        const targetTime = (state.pausedAt - state.startTime) / 1000;
        if (Math.abs(audioRef.value.currentTime - targetTime) > 0.5) {
          audioRef.value.currentTime = targetTime;
        }
      }
    } else {
      const targetTime = (Date.now() - state.startTime) / 1000;
      // If drift > 2s, seek
      if (Math.abs(audioRef.value.currentTime - targetTime) > 2) {
        audioRef.value.currentTime = targetTime;
      }
      if (audioRef.value.paused) {
        audioRef.value.play().catch(() => {});
      }
    }
  },
  { deep: true, immediate: true },
);

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
  const container = lyricsContainerRef.value;
  const el = container.children[currentLineIndex.value] as HTMLElement;

  if (el) {
    const containerHeight = container.clientHeight;
    const elTop = el.offsetTop;
    const elHeight = el.clientHeight;

    container.scrollTo({
      top: elTop - containerHeight / 2 + elHeight / 2,
      behavior: "smooth",
    });
  }
}

async function onEnded() {
  isPlaying.value = false;
  // Auto next for everyone (server validates)
  if (roomId.value && nowPlaying.value) {
    try {
      await reportEnded(roomId.value, nowPlaying.value.id);
    } catch (e) {
      console.error("Auto-next failed:", e);
    }
  }
}

function emitPlayerUpdate(isPaused: boolean, currentTime: number) {
  if (!canAdmin.value || !socketClient || !roomId.value) return;
  socketClient.emit("player:update", {
    roomId: roomId.value,
    isPaused,
    currentTime,
  });
}

function onPlay() {
  isPlaying.value = true;
}

function onPause() {
  isPlaying.value = false;
  // Auto-resume logic: if host pauses (e.g. unplugging headphones), try to resume immediately
  // because we removed the manual play/pause controls to avoid room-wide accidental pauses.
  if (canAdmin.value && audioRef.value) {
    const audio = audioRef.value;
    setTimeout(() => {
      audio.play().catch((e) => {
        console.warn("Auto-resume failed:", e);
        ElMessage.warning("播放已暂停，请检查音频设备");
      });
    }, 100);
  }
}

function onSeeked() {
  if (audioRef.value) {
    // Force isPaused to false to prevent accidental pauses from syncing
    emitPlayerUpdate(false, audioRef.value.currentTime);
  }
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

async function voteSkip() {
  if (!roomId.value || !nowPlaying.value) return;
  voteSkipLoading.value = true;
  try {
    const res = await vote(roomId.value, nowPlaying.value.id, { type: "SKIP" });
    if (!res.ok) throw new Error((res as any).error.message);
    ElMessage.success("已投票跳过");
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    voteSkipLoading.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <audio
      ref="audioRef"
      :src="audioUrl"
      @timeupdate="onTimeUpdate"
      @ended="onEnded"
      @play="onPlay"
      @pause="onPause"
      @seeked="onSeeked"
      preload="auto"
    ></audio>

    <!-- Player Card -->
    <div
      class="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl transition-all duration-500"
    >
      <div class="text-xs text-red-500 fixed top-0 left-0 z-50 bg-black"></div>

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
        <!-- Album Art -->
        <div
          class="relative shrink-0 transition-all duration-500 ease-in-out w-full sm:w-48 lg:w-64 aspect-square"
        >
          <!-- Standard Cover View -->
          <div
            class="group relative h-full w-full overflow-hidden rounded-full border border-white/10 bg-black/20 shadow-xl"
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
          </div>
        </div>

        <!-- Info & Controls (Standard View) -->
        <div class="flex flex-1 flex-col justify-end gap-4 min-w-0">
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
              :src="animalAvatarUrl(nowPlaying.requestedBy.id)"
              class="h-5 w-5 rounded-full bg-white/10"
            />
            <span>Requested by {{ nowPlaying.requestedBy.displayName }}</span>
          </div>

          <!-- Progress Bar -->
          <div class="w-full space-y-2" v-if="nowPlaying">
            <div
              class="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10 group"
              :class="canAdmin ? 'cursor-pointer' : 'cursor-default'"
              @click="
                (e) => {
                  if (!audioRef || !canAdmin) return;
                  const rect = (
                    e.target as HTMLElement
                  ).getBoundingClientRect();
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
                class="h-10 w-10 rounded-full transition-all duration-300"
                :class="
                  showLyrics
                    ? 'text-white bg-white/20'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                "
                @click="showLyrics = !showLyrics"
                title="歌词"
              >
                <Mic2 class="h-5 w-5" />
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

              <Button
                v-if="!canAdmin && nowPlaying"
                variant="secondary"
                size="sm"
                :loading="voteSkipLoading"
                data-testid="nowplaying-vote-skip"
                @click="voteSkip"
              >
                <SkipForward class="mr-2 h-4 w-4" />
                跳过 ({{ nowPlaying.skipVotes || 0 }}/{{
                  roomSettings?.skipVoteThreshold || 2
                }})
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Independent Lyrics Module -->
    <transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-4"
    >
      <div
        v-if="showLyrics && nowPlaying"
        class="relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/90 shadow-2xl h-96"
      >
        <!-- Background Blur for Lyrics -->
        <div class="absolute inset-0 z-0">
          <img
            v-if="nowPlaying?.song.coverUrl"
            :src="nowPlaying.song.coverUrl"
            class="h-full w-full object-cover opacity-10 blur-3xl scale-150"
          />
        </div>

        <!-- Lyrics Content -->
        <div class="relative z-10 flex flex-col h-full p-6">
          <div class="flex items-center justify-between mb-4 shrink-0">
            <div
              class="text-sm font-medium text-white/60 flex items-center gap-2"
            >
              <Mic2 class="h-4 w-4" />
              Lyrics
            </div>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8 text-white/40 hover:text-white"
              @click="showLyrics = false"
            >
              <VolumeX class="h-4 w-4 rotate-45" />
            </Button>
          </div>

          <div
            ref="lyricsContainerRef"
            class="relative flex-1 overflow-y-auto scrollbar-hide text-center space-y-6 mask-image-gradient py-8"
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
              class="transition-all duration-300 px-4 cursor-pointer hover:opacity-80"
              :class="
                index === currentLineIndex
                  ? 'text-white text-xl font-bold scale-110'
                  : 'text-white/40 text-base blur-[0.5px]'
              "
              @click="
                () => {
                  if (audioRef && canAdmin) {
                    audioRef.currentTime = line.time;
                  }
                }
              "
            >
              {{ line.text }}
            </div>
          </div>
        </div>
      </div>
    </transition>
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
