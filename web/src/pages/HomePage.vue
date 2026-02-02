<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Music2,
  Radio,
  User,
  Hash,
  Sparkles,
  Lock,
  Users,
  RefreshCw,
  KeyRound,
} from "lucide-vue-next";
import { createRoom, joinRoom, getRoomList, joinRoomById } from "@/api/rooms";
import type { RoomListItem } from "@/types/api";
import { useRoomActions } from "@/stores/useRoomStore";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";

const router = useRouter();
const actions = useRoomActions();

const mode = ref<"create" | "join" | null>(null);
const loading = ref(false);
const roomList = ref<RoomListItem[]>([]);
const loadingList = ref(false);

localStorage.removeItem("echo_music_last_room_id");

const route = useRoute();
const queryCode = route.query.code as string;
if (queryCode) {
  mode.value = "join";
}

const createForm = reactive({
  name: "六人组 Music",
  displayName: localStorage.getItem("echo_username") || "Host",
  password: "",
});

const joinForm = reactive({
  code: queryCode || "",
  displayName: localStorage.getItem("echo_username") || "",
});

function saveDisplayName(name: string) {
  if (name.trim()) {
    localStorage.setItem("echo_username", name.trim());
  }
}

async function fetchRooms() {
  loadingList.value = true;
  try {
    const res = await getRoomList();
    if (res.ok) {
      roomList.value = res.data;
    }
  } catch (e) {
    console.error(e);
  } finally {
    loadingList.value = false;
  }
}

onMounted(() => {
  fetchRooms();
});

async function onCreate() {
  if (!createForm.name.trim() || !createForm.displayName.trim()) return;
  saveDisplayName(createForm.displayName);
  loading.value = true;
  try {
    const res = await createRoom({
      name: createForm.name,
      displayName: createForm.displayName,
      password: createForm.password || undefined,
    });
    if (!res.ok) throw new Error((res as any).error.message);
    actions.setToken(res.data.token);
    actions.hydrate(res.data.state);
    await router.push({ name: "room", params: { roomId: res.data.roomId } });
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

async function onJoinByCode() {
  if (!joinForm.code.trim()) return;
  if (joinForm.displayName.trim()) {
    saveDisplayName(joinForm.displayName);
  }
  loading.value = true;
  try {
    const res = await joinRoom({
      code: joinForm.code.trim(),
      displayName: joinForm.displayName || "游客",
    });
    if (!res.ok) throw new Error((res as any).error.message);
    actions.setToken(res.data.token);
    actions.hydrate(res.data.state);
    await router.push({ name: "room", params: { roomId: res.data.roomId } });
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

async function onJoinRoom(room: RoomListItem) {
  let password = "";
  if (room.hasPassword) {
    try {
      const { value } = await ElMessageBox.prompt(
        "请输入房间密码",
        "加密房间",
        {
          confirmButtonText: "加入",
          cancelButtonText: "取消",
          inputType: "password",
          inputPattern: /\S+/,
          inputErrorMessage: "密码不能为空",
        },
      );
      password = value;
    } catch {
      return; // Cancelled
    }
  }

  // Prompt for display name if not set
  let displayName = localStorage.getItem("echo_username") || "";
  if (!displayName) {
    try {
      const { value } = await ElMessageBox.prompt(
        "请输入你的昵称",
        "欢迎加入",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          inputPattern: /\S+/,
          inputErrorMessage: "昵称不能为空",
        },
      );
      displayName = value;
      saveDisplayName(displayName);
    } catch {
      return; // Cancelled
    }
  }

  loading.value = true;
  try {
    const res = await joinRoomById(room.id, {
      displayName,
      password: password || undefined,
    });
    if (!res.ok) throw new Error((res as any).error.message);
    actions.setToken(res.data.token);
    actions.hydrate(res.data.state);
    await router.push({ name: "room", params: { roomId: res.data.roomId } });
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div
    class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background text-foreground"
  >
    <!-- Mesh Gradient Background -->
    <div class="mesh-bg">
      <div class="mesh-blob blob-1"></div>
      <div class="mesh-blob blob-2"></div>
      <div class="mesh-blob blob-3"></div>
    </div>

    <!-- Main Content -->
    <div
      class="relative z-10 w-full max-w-4xl px-4 py-8 flex flex-col md:flex-row gap-8"
    >
      <!-- Left Column: Actions -->
      <div class="w-full md:w-1/3 flex flex-col gap-6">
        <!-- Logo/Header -->
        <div class="text-center md:text-left">
          <div class="mb-4 flex items-center justify-center md:justify-start">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 shadow-xl backdrop-blur-xl"
            >
              <Music2 class="h-6 w-6 text-white" />
            </div>
            <h1
              class="ml-3 text-2xl font-bold tracking-tight text-white drop-shadow-sm"
            >
              六人组 Music
            </h1>
          </div>
          <p class="text-sm text-slate-300">与挚友实时同步的音乐空间</p>
        </div>

        <!-- Action Cards -->
        <div v-if="!mode" class="grid gap-4">
          <button
            class="group relative flex w-full items-center gap-4 rounded-xl border border-white/10 bg-slate-900/50 p-4 text-left shadow-lg backdrop-blur-md transition-all hover:bg-slate-900/70 hover:scale-[1.02] active:scale-[0.98]"
            @click="mode = 'create'"
          >
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 transition-colors group-hover:bg-indigo-500 group-hover:text-white"
            >
              <Sparkles class="h-5 w-5" />
            </div>
            <div>
              <div class="font-semibold text-white">创建新房间</div>
              <div class="text-xs text-slate-400">成为 Host，邀请好友</div>
            </div>
          </button>

          <button
            class="group relative flex w-full items-center gap-4 rounded-xl border border-white/10 bg-slate-900/50 p-4 text-left shadow-lg backdrop-blur-md transition-all hover:bg-slate-900/70 hover:scale-[1.02] active:scale-[0.98]"
            @click="mode = 'join'"
          >
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 transition-colors group-hover:bg-emerald-500 group-hover:text-white"
            >
              <Radio class="h-5 w-5" />
            </div>
            <div>
              <div class="font-semibold text-white">通过房间码加入</div>
              <div class="text-xs text-slate-400">输入6位代码</div>
            </div>
          </button>
        </div>

        <!-- Create Form -->
        <div
          v-else-if="mode === 'create'"
          class="glass rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4"
        >
          <div class="mb-6 flex items-center justify-between">
            <h2 class="text-lg font-semibold">创建房间</h2>
            <button
              class="text-xs text-slate-400 hover:text-white"
              @click="mode = null"
            >
              返回
            </button>
          </div>
          <div class="space-y-4">
            <div class="space-y-1">
              <label class="text-xs font-medium text-slate-400">房间名称</label>
              <Input
                v-model="createForm.name"
                :icon="Music2"
                placeholder="给房间起个名字"
                @enter="onCreate"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium text-slate-400">你的昵称</label>
              <Input
                v-model="createForm.displayName"
                :icon="User"
                placeholder="大家怎么称呼你"
                @enter="onCreate"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium text-slate-400"
                >房间密码 (可选)</label
              >
              <Input
                v-model="createForm.password"
                :icon="KeyRound"
                type="password"
                placeholder="留空则公开"
                @enter="onCreate"
              />
            </div>
            <Button
              class="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
              size="lg"
              :loading="loading"
              @click="onCreate"
            >
              立即创建
            </Button>
          </div>
        </div>

        <!-- Join Form (By Code) -->
        <div
          v-else-if="mode === 'join'"
          class="glass rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4"
        >
          <div class="mb-6 flex items-center justify-between">
            <h2 class="text-lg font-semibold">加入房间</h2>
            <button
              class="text-xs text-slate-400 hover:text-white"
              @click="mode = null"
            >
              返回
            </button>
          </div>
          <div class="space-y-4">
            <div class="space-y-1">
              <label class="text-xs font-medium text-slate-400"
                >6位房间码</label
              >
              <Input
                v-model="joinForm.code"
                :icon="Hash"
                placeholder="例如：X8K9M2"
                class="uppercase"
                @enter="onJoinByCode"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium text-slate-400"
                >你的昵称 (可选)</label
              >
              <Input
                v-model="joinForm.displayName"
                :icon="User"
                placeholder="默认为“游客”"
                @enter="onJoinByCode"
              />
            </div>
            <Button
              class="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
              size="lg"
              :loading="loading"
              @click="onJoinByCode"
            >
              加入派对
            </Button>
          </div>
        </div>
      </div>

      <!-- Right Column: Room List -->
      <div
        class="w-full md:w-2/3 flex flex-col h-[500px] glass rounded-2xl overflow-hidden"
      >
        <div
          class="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/30"
        >
          <h2 class="font-semibold flex items-center gap-2">
            <Radio class="w-4 h-4 text-emerald-400" />
            正在进行的派对
          </h2>
          <button
            @click="fetchRooms"
            class="p-2 hover:bg-white/10 rounded-full transition-colors"
            :class="{ 'animate-spin': loadingList }"
          >
            <RefreshCw class="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          <div
            v-if="loadingList && roomList.length === 0"
            class="text-center py-10 text-slate-400"
          >
            加载中...
          </div>
          <div
            v-else-if="roomList.length === 0"
            class="text-center py-10 text-slate-400 flex flex-col items-center gap-2"
          >
            <Music2 class="w-8 h-8 opacity-20" />
            <p>暂无活跃房间，快去创建一个吧！</p>
          </div>

          <div
            v-for="room in roomList"
            :key="room.id"
            class="group flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer"
            @click="onJoinRoom(room)"
          >
            <div class="flex items-center gap-4">
              <div
                class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-300"
              >
                <Lock v-if="room.hasPassword" class="w-5 h-5" />
                <Music2 v-else class="w-5 h-5" />
              </div>
              <div>
                <div class="font-medium text-white flex items-center gap-2">
                  {{ room.name }}
                  <span
                    v-if="room.nowPlaying"
                    class="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                  >
                    Playing
                  </span>
                </div>
                <div
                  class="text-xs text-slate-400 flex items-center gap-2 mt-1"
                >
                  <User class="w-3 h-3" /> {{ room.hostName }}
                  <span class="w-1 h-1 rounded-full bg-slate-600"></span>
                  <span v-if="room.nowPlaying" class="truncate max-w-[150px]">
                    正在播放: {{ room.nowPlaying.title }}
                  </span>
                  <span v-else>暂无播放</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-4">
              <div
                class="flex items-center gap-1 text-xs text-slate-400 bg-black/20 px-2 py-1 rounded-full"
              >
                <Users class="w-3 h-3" />
                {{ room.memberCount }}
              </div>
              <Button
                size="sm"
                variant="ghost"
                class="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                加入
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="absolute bottom-6 text-xs text-white/20">
      六人组 Music · v0.7.0
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
