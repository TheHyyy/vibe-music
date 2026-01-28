<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Search, Plus, Loader2, Disc3 } from "lucide-vue-next";
import { searchSongs, getSystemConfig } from "@/api/songs";
import { requestSong } from "@/api/rooms";
import { useRoomActions, useRoomSelector } from "@/stores/useRoomStore";
import type { Song } from "@/types/api";
import Input from "@/components/ui/Input.vue";
import Button from "@/components/ui/Button.vue";

const actions = useRoomActions();
const roomId = useRoomSelector((s) => s.room?.id);
const actionLoading = useRoomSelector((s) => s.actionLoading);

const q = ref("");
const searching = ref(false);
const results = ref<Song[]>([]);
const hasSearched = ref(false);
const enableQQ = ref(false);
const currentPage = ref(1);
const hasMore = ref(true);

onMounted(async () => {
  try {
    const res = await getSystemConfig();
    if (res.ok) {
      enableQQ.value = res.data.enableQQ;
    }
  } catch (e) {
    console.error("Failed to load config", e);
  }
});

const addLoadingKey = (id: string) => `queue:add:${id}`;
const isAdding = (id: string) => !!actionLoading.value[addLoadingKey(id)];

async function doSearch(loadMore = false) {
  if (!q.value.trim()) return;

  if (!loadMore) {
    results.value = [];
    currentPage.value = 1;
    hasMore.value = true;
  }

  searching.value = true;
  hasSearched.value = true;
  try {
    const res = await searchSongs(q.value.trim(), currentPage.value);
    if (!res.ok) throw new Error((res as any).error.message);

    if (res.data.length < 10) {
      hasMore.value = false;
    }

    if (loadMore) {
      results.value.push(...res.data);
    } else {
      results.value = res.data;
    }
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    searching.value = false;
  }
}

function onLoadMore() {
  currentPage.value++;
  doSearch(true);
}

async function addSong(song: Song) {
  if (!roomId.value) return;
  const key = addLoadingKey(song.id);
  if (actionLoading.value[key]) return;

  actions.setActionLoading(key, true);

  // 乐观更新：立即在 UI 上显示
  const tempId = actions.addOptimisticQueueItem(song);

  try {
    const res = await requestSong(roomId.value, { song });
    if (!res.ok) throw new Error((res as any).error.message);
    ElMessage.success("已加入队列");
    // 保持搜索结果，方便连续点歌
  } catch (e) {
    ElMessage.error((e as Error).message);
    // 失败回滚
    if (tempId) actions.removeQueueItem(tempId);
  } finally {
    actions.setActionLoading(key, false);
  }
}

// Debounce search if needed, but for now enter key is fine.
// Let's add auto-search on stop typing maybe? No, manual is safer for API quotas.
</script>

<template>
  <div class="glass flex flex-col rounded-2xl">
    <div class="border-b border-white/5 px-4 py-3">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-semibold text-white">点歌台</h3>
          <p class="text-xs text-slate-400">支持网易云</p>
        </div>
        <div class="rounded bg-white/5 px-2 py-1 text-[10px] text-slate-400">
          Enter 搜索
        </div>
      </div>
    </div>

    <div class="p-3">
      <div class="relative flex items-center gap-2">
        <Input
          data-testid="song-search-input"
          v-model="q"
          :icon="Search"
          placeholder="搜索歌名、歌手..."
          class="bg-slate-900/50"
          @enter="doSearch"
        />
        <Button
          v-if="q"
          data-testid="song-search-button"
          size="sm"
          variant="primary"
          class="absolute right-1 top-1 h-8"
          :loading="searching"
          @click="doSearch"
        >
          搜索
        </Button>
      </div>

      <!-- Results List -->
      <div
        class="mt-3 max-h-[400px] min-h-[100px] overflow-y-auto scrollbar-thin"
      >
        <div
          v-if="searching && results.length === 0"
          class="flex h-32 items-center justify-center text-slate-400"
        >
          <Loader2 class="h-6 w-6 animate-spin" />
        </div>

        <div
          v-else-if="results.length > 0"
          data-testid="song-search-results"
          class="space-y-1"
        >
          <div
            v-for="s in results"
            :key="s.id"
            data-testid="song-result"
            class="group flex items-center gap-3 rounded-lg border border-transparent p-2 transition-all hover:border-white/5 hover:bg-white/5"
          >
            <!-- Cover Art -->
            <div
              class="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-slate-800"
            >
              <img
                v-if="s.coverUrl"
                :src="s.coverUrl"
                class="h-full w-full object-cover"
                loading="lazy"
              />
              <div
                v-else
                class="flex h-full w-full items-center justify-center text-slate-600"
              >
                <Disc3 class="h-5 w-5" />
              </div>
              <div
                class="absolute inset-0 hidden items-center justify-center bg-black/40 group-hover:flex"
              >
                <button
                  class="text-white hover:scale-110 transition-transform"
                  @click="addSong(s)"
                >
                  <Plus class="h-5 w-5" />
                </button>
              </div>
            </div>

            <!-- Info -->
            <div class="min-w-0 flex-1">
              <div
                class="truncate text-sm font-medium text-slate-200 group-hover:text-white"
              >
                {{ s.title }}
              </div>
              <div
                class="flex items-center gap-2 truncate text-xs text-slate-500 group-hover:text-slate-400"
              >
                <span
                  class="rounded-[2px] px-1 py-0.5 text-[9px] font-bold"
                  :class="{
                    'bg-red-500/20 text-red-400': s.source === 'NETEASE',
                    'bg-green-500/20 text-green-400': s.source === 'QQ',
                    'bg-slate-500/20 text-slate-400': s.source === 'MOCK',
                  }"
                >
                  {{ s.source }}
                </span>
                <span class="truncate">{{ s.artist }}</span>
              </div>
            </div>

            <!-- Action (Mobile/Desktop consistent) -->
            <Button
              size="icon"
              variant="ghost"
              class="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100"
              :loading="isAdding(s.id)"
              data-testid="song-result-add"
              @click="addSong(s)"
            >
              <Plus class="h-4 w-4" />
            </Button>
          </div>

          <!-- Load More -->
          <div v-if="results.length > 0 && hasMore" class="pt-2 text-center">
            <Button
              variant="ghost"
              size="sm"
              class="w-full text-xs text-slate-400 hover:bg-white/5 hover:text-white"
              :loading="searching"
              :disabled="searching"
              @click="onLoadMore"
            >
              {{ searching ? "加载中..." : "加载更多" }}
            </Button>
          </div>
        </div>

        <div
          v-else-if="hasSearched"
          class="flex h-32 flex-col items-center justify-center text-slate-500"
        >
          <Search class="mb-2 h-8 w-8 opacity-20" />
          <div class="text-xs">未找到相关歌曲</div>
        </div>

        <div
          v-else
          class="flex h-32 flex-col items-center justify-center text-slate-500"
        >
          <Disc3 class="mb-2 h-8 w-8 opacity-20" />
          <div class="text-xs">输入关键词开始搜索</div>
        </div>
      </div>
    </div>
  </div>
</template>
