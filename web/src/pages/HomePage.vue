<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  Music2,
  Radio,
  User,
  Hash,
  Sparkles,
  ArrowRight,
} from "lucide-vue-next";
import { createRoom, joinRoom } from "@/api/rooms";
import { useRoomActions } from "@/stores/useRoomStore";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";

const router = useRouter();
const actions = useRoomActions();

const mode = ref<"create" | "join" | null>(null);
const loading = ref(false);
const lastRoomId = ref(localStorage.getItem("echo_music_last_room_id") || "");

const createForm = reactive({
  name: "非七人组 Music",
  displayName: localStorage.getItem("echo_username") || "Host",
});

const joinForm = reactive({
  code: "",
  displayName: localStorage.getItem("echo_username") || "",
});

function saveDisplayName(name: string) {
  if (name.trim()) {
    localStorage.setItem("echo_username", name.trim());
  }
}

async function onCreate() {
  if (!createForm.name.trim() || !createForm.displayName.trim()) return;
  saveDisplayName(createForm.displayName);
  loading.value = true;
  try {
    const res = await createRoom({
      name: createForm.name,
      displayName: createForm.displayName,
    });
    if (!res.ok) throw new Error((res as any).error.message);
    actions.setToken(res.data.token);
    actions.hydrate(res.data.state);
    localStorage.setItem("echo_music_last_room_id", res.data.roomId);
    lastRoomId.value = res.data.roomId;
    await router.push({ name: "room", params: { roomId: res.data.roomId } });
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

async function onJoin() {
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
    localStorage.setItem("echo_music_last_room_id", res.data.roomId);
    lastRoomId.value = res.data.roomId;
    await router.push({ name: "room", params: { roomId: res.data.roomId } });
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

async function onResume() {
  const token = localStorage.getItem("echo_music_token");
  if (!token || !lastRoomId.value) {
    localStorage.removeItem("echo_music_last_room_id");
    lastRoomId.value = "";
    return;
  }
  await router.push({ name: "room", params: { roomId: lastRoomId.value } });
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
    <div class="relative z-10 w-full max-w-md px-4">
      <!-- Logo/Header -->
      <div class="mb-12 text-center">
        <div class="mb-4 flex items-center justify-center">
          <div
            class="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 shadow-2xl backdrop-blur-xl"
          >
            <Music2 class="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 class="text-4xl font-bold tracking-tight text-white drop-shadow-sm">
          非七人组 Music
        </h1>
        <p class="mt-2 text-slate-300">与挚友实时同步的音乐空间</p>
      </div>

      <!-- Action Cards (Transition) -->
      <Transition
        mode="out-in"
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="transform translate-y-4 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform translate-y-4 opacity-0"
      >
        <!-- Initial Selection -->
        <div v-if="!mode" class="grid gap-4">
          <button
            v-if="lastRoomId"
            class="group relative flex w-full items-center gap-4 rounded-xl border border-white/10 bg-indigo-600/20 p-6 text-left shadow-lg backdrop-blur-md transition-all hover:bg-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]"
            @click="onResume"
          >
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
            >
              <ArrowRight class="h-6 w-6" />
            </div>
            <div>
              <div class="text-lg font-semibold text-white">回到上次房间</div>
              <div class="text-sm text-indigo-200">继续刚才的派对</div>
            </div>
          </button>

          <button
            data-testid="home-create-card"
            class="group relative flex w-full items-center gap-4 rounded-xl border border-white/10 bg-slate-900/50 p-6 text-left shadow-lg backdrop-blur-md transition-all hover:bg-slate-900/70 hover:scale-[1.02] active:scale-[0.98]"
            @click="mode = 'create'"
          >
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 transition-colors group-hover:bg-indigo-500 group-hover:text-white"
            >
              <Sparkles class="h-6 w-6" />
            </div>
            <div>
              <div class="text-lg font-semibold text-white">创建新房间</div>
              <div class="text-sm text-slate-400">
                成为 Host，邀请好友一起听
              </div>
            </div>
          </button>

          <button
            data-testid="home-join-card"
            class="group relative flex w-full items-center gap-4 rounded-xl border border-white/10 bg-slate-900/50 p-6 text-left shadow-lg backdrop-blur-md transition-all hover:bg-slate-900/70 hover:scale-[1.02] active:scale-[0.98]"
            @click="mode = 'join'"
          >
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 transition-colors group-hover:bg-emerald-500 group-hover:text-white"
            >
              <Radio class="h-6 w-6" />
            </div>
            <div>
              <div class="text-lg font-semibold text-white">加入房间</div>
              <div class="text-sm text-slate-400">输入房间码，加入现有派对</div>
            </div>
          </button>
        </div>

        <!-- Create Form -->
        <div v-else-if="mode === 'create'" class="glass rounded-2xl p-6">
          <div class="mb-6 flex items-center justify-between">
            <h2 class="text-xl font-semibold">创建房间</h2>
            <button
              class="text-sm text-slate-400 hover:text-white"
              @click="mode = null"
            >
              返回
            </button>
          </div>
          <div class="space-y-4">
            <div class="space-y-1">
              <label class="text-xs font-medium text-slate-400">房间名称</label>
              <Input
                data-testid="home-create-room-name"
                v-model="createForm.name"
                :icon="Music2"
                placeholder="给房间起个名字"
                @enter="onCreate"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium text-slate-400">你的昵称</label>
              <Input
                data-testid="home-create-display-name"
                v-model="createForm.displayName"
                :icon="User"
                placeholder="大家怎么称呼你"
                @enter="onCreate"
              />
            </div>
            <Button
              data-testid="home-create-submit"
              class="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
              size="lg"
              :loading="loading"
              @click="onCreate"
            >
              立即创建
            </Button>
          </div>
        </div>

        <!-- Join Form -->
        <div v-else-if="mode === 'join'" class="glass rounded-2xl p-6">
          <div class="mb-6 flex items-center justify-between">
            <h2 class="text-xl font-semibold">加入房间</h2>
            <button
              class="text-sm text-slate-400 hover:text-white"
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
                data-testid="home-join-code"
                v-model="joinForm.code"
                :icon="Hash"
                placeholder="例如：X8K9M2"
                class="uppercase"
                @enter="onJoin"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium text-slate-400"
                >你的昵称 (可选)</label
              >
              <Input
                data-testid="home-join-display-name"
                v-model="joinForm.displayName"
                :icon="User"
                placeholder="默认为“游客”"
                @enter="onJoin"
              />
            </div>
            <Button
              data-testid="home-join-submit"
              class="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
              size="lg"
              :loading="loading"
              @click="onJoin"
            >
              加入派对
            </Button>
          </div>
        </div>
      </Transition>
    </div>

    <div class="absolute bottom-6 text-xs text-white/20">
      非七人组 Music · v0.1.0
    </div>
  </div>
</template>
