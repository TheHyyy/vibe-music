import { onUnmounted, shallowRef, computed } from "vue";
import { createStore } from "zustand/vanilla";
import type {
  PlaybackState,
  QueueItem,
  Room,
  RoomStatePayload,
  Song,
  UserSummary,
} from "@/types/api";

export interface RoomStoreState {
  token?: string;
  room?: Room;
  currentUser?: UserSummary;
  members: UserSummary[];
  nowPlaying?: QueueItem;
  queue: QueueItem[];
  history: QueueItem[];
  playback: PlaybackState;
  actionLoading: Record<string, boolean>;
  kicked?: { reason?: string };
  actions: {
    hydrate(payload: RoomStatePayload): void;
    setToken(token: string): void;
    setActionLoading(key: string, loading: boolean): void;
    setQueue(queue: QueueItem[]): void;
    setHistory(history: QueueItem[]): void;
    setPlayback(state: PlaybackState): void;
    addOptimisticQueueItem(song: Song): string;
    removeQueueItem(id: string): void;
    updateVote(itemId: string, voteScore: number): void;
    setKicked(reason?: string): void;
    resetRoom(): void;
  };
}

export const roomStore = createStore<RoomStoreState>((set, get) => ({
  token: localStorage.getItem("echo_music_token") || undefined,
  room: undefined,
  currentUser: undefined,
  members: [],
  nowPlaying: undefined,
  queue: [],
  history: [],
  playback: { isPaused: true, startTime: 0 },
  actionLoading: {},
  kicked: undefined,
  actions: {
    hydrate(payload) {
      // 合并队列：保留本地尚未确认的 Temp Items
      const currentQueue = get().queue;
      const mergedQueue = mergeQueue(
        payload.queue,
        currentQueue,
        payload.nowPlaying,
      );

      set({
        room: payload.room,
        currentUser: payload.currentUser,
        members: payload.members,
        nowPlaying: payload.nowPlaying,
        queue: mergedQueue,
        history: payload.history || [],
        playback: payload.playback,
        kicked: undefined,
      });
    },
    setToken(token) {
      localStorage.setItem("echo_music_token", token);
      set({ token });
    },
    setActionLoading(key, loading) {
      const next = { ...get().actionLoading, [key]: loading };
      set({ actionLoading: next });
    },
    setQueue(queue) {
      // 合并队列
      const currentQueue = get().queue;
      const currentNowPlaying = get().nowPlaying;
      const mergedQueue = mergeQueue(queue, currentQueue, currentNowPlaying);
      set({ queue: mergedQueue });
    },
    setHistory(history) {
      set({ history });
    },
    setPlayback(state) {
      set({ playback: state });
    },
    addOptimisticQueueItem(song) {
      const state = get();
      if (!state.currentUser || !state.room) return "";
      const tempId = `temp-${Date.now()}`;
      const tempItem: QueueItem = {
        id: tempId,
        roomId: state.room.id,
        song,
        requestedBy: state.currentUser,
        voteScore: 0,
        skipVotes: 0,
        createdAt: new Date().toISOString(),
      };
      // 如果当前没有播放且队列为空，也许它应该显示在 nowPlaying？
      // 但为了简单，总是先加到队列，等后端修正
      set({ queue: [...state.queue, tempItem] });
      return tempId;
    },
    removeQueueItem(id) {
      const state = get();
      set({ queue: state.queue.filter((x) => x.id !== id) });
    },
    updateVote(itemId, voteScore) {
      const next = get().queue.map((it) =>
        it.id === itemId ? { ...it, voteScore } : it,
      );
      set({ queue: next });
    },
    setKicked(reason) {
      set({ kicked: { reason } });
    },
    resetRoom() {
      localStorage.removeItem("echo_music_token");
      set({
        token: undefined,
        room: undefined,
        currentUser: undefined,
        members: [],
        nowPlaying: undefined,
        queue: [],
        history: [],
        playback: { isPaused: true, startTime: 0 },
        actionLoading: {},
        kicked: undefined,
      });
    },
  },
}));

export function useRoomSelector<T>(selector: (s: RoomStoreState) => T) {
  const selected = shallowRef(selector(roomStore.getState()));
  const unsub = roomStore.subscribe((s) => {
    const next = selector(s);
    if (!Object.is(next, selected.value)) selected.value = next;
  });
  onUnmounted(unsub);
  return computed(() => selected.value);
}

export function useRoomActions() {
  return roomStore.getState().actions;
}

function mergeQueue(
  serverQueue: QueueItem[],
  currentQueue: QueueItem[],
  serverNowPlaying?: QueueItem,
): QueueItem[] {
  // 1. 收集服务器端已存在的 Song IDs (包括队列和当前播放)
  const serverSongIds = new Set(serverQueue.map((i) => i.song.id));
  if (serverNowPlaying) serverSongIds.add(serverNowPlaying.song.id);

  // 2. 找出当前队列中所有的 Temp Items
  const tempItems = currentQueue.filter((i) => i.id.startsWith("temp-"));

  // 3. 过滤掉那些“已经在服务器数据中出现”的 Temp Items
  // 注意：这里需要更严格的判断，因为不同用户点同一首歌是允许的（如果设置允许），
  // 但对于"自己刚刚点的这首"，我们希望通过 song.id 来去重。
  // 不过为了简单起见，如果服务器已经有了这首歌，我们就认为本地的 temp 可以退休了。
  const remainingTempItems = tempItems.filter(
    (i) => !serverSongIds.has(i.song.id),
  );

  // 4. 返回 Server Queue + Remaining Temp Items
  return [...serverQueue, ...remainingTempItems];
}
