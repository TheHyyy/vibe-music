<script setup lang="ts">
import { computed, onMounted, provide, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import useSWRV from "swrv";
import { ElMessage } from "element-plus";
import { Users, Disc3, ListMusic } from "lucide-vue-next";
import RoomHeader from "@/components/room/RoomHeader.vue";
import SidebarLeft from "@/components/room/SidebarLeft.vue";
import SidebarRight from "@/components/room/SidebarRight.vue";
import MainStage from "@/components/room/MainStage.vue";
import JoinRoomDialog from "@/components/room/JoinRoomDialog.vue";
import BarrageContainer from "@/components/room/barrage/BarrageContainer.vue";
import { getRoomState } from "@/api/rooms";
import { useRoomActions, useRoomSelector } from "@/stores/useRoomStore";
import { useWebSocket } from "@/hooks/useWebSocket";

const route = useRoute();
const router = useRouter();
const actions = useRoomActions();

const roomId = computed(() => String(route.params.roomId || ""));
const kicked = useRoomSelector((s) => s.kicked);
const queue = useRoomSelector((s) => s.queue);
const showJoinDialog = ref(false);

// Mobile Tabs: 'player' | 'queue' | 'members'
const activeTab = ref<"player" | "queue" | "members">("player");

const wsClient = useWebSocket(roomId.value);
provide("socketClient", wsClient);
const { connect } = wsClient;

const {
  data: stateRes,
  error: stateError,
  mutate: reloadState,
} = useSWRV(
  () =>
    roomId.value && !showJoinDialog.value ? ["roomState", roomId.value] : null,
  async () => {
    try {
      return await getRoomState(roomId.value);
    } catch (e: any) {
      console.error("[RoomPage] Fetch state error:", e);
      // Manually handle 401/400/403 if swrv doesn't update error ref immediately
      if (
        e.response?.status === 401 ||
        e.response?.status === 400 ||
        e.response?.status === 403
      ) {
        showJoinDialog.value = true;
      } else if (e.response?.status === 404) {
        ElMessage.error("房间不存在");
        actions.resetRoom();
        router.replace({ path: "/" });
      }
      throw e;
    }
  },
  {
    refreshInterval: 0, // Disable polling, rely on WebSocket
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  },
);

watch(
  () => stateError.value,
  (err) => {
    if (err) {
      // Check for 401/400/403
      if (
        err.response?.status === 401 ||
        err.response?.status === 400 ||
        err.response?.status === 403
      ) {
        showJoinDialog.value = true;
        return;
      }
      // Check for 404 (Not Found)
      if (err.response?.status === 404) {
        ElMessage.error("房间不存在");
        actions.resetRoom();
        router.replace({ path: "/" });
        return;
      }
    }
  },
  { immediate: true },
);

function onJoinSuccess() {
  showJoinDialog.value = false;
  reloadState();
  wsClient.disconnect();
  connect();
}

watch(
  () => stateRes.value,
  (res) => {
    if (res?.ok) actions.hydrate(res.data);
  },
  { immediate: true },
);

watch(
  () => kicked.value,
  (v) => {
    if (!v) return;
    ElMessage.error(v.reason || "你已被房主移出房间");
    actions.resetRoom();
    router.replace({ path: "/" });
  },
);

onMounted(() => {
  connect();
});
</script>

<template>
  <div
    class="min-h-screen bg-background text-foreground overflow-hidden flex flex-col"
  >
    <!-- Mesh Gradient Background -->
    <div class="mesh-bg">
      <div class="mesh-blob blob-1"></div>
      <div class="mesh-blob blob-2"></div>
      <div class="mesh-blob blob-3"></div>
    </div>

    <RoomHeader />

    <BarrageContainer />

    <JoinRoomDialog
      v-if="showJoinDialog"
      :room-id="roomId"
      @success="onJoinSuccess"
    />

    <div class="flex-1 overflow-hidden relative">
      <div class="mx-auto h-full max-w-[1600px] p-4 lg:p-6">
        <div class="grid h-full grid-cols-12 gap-6">
          <!-- Left Sidebar (Desktop) -->
          <div
            class="hidden lg:col-span-3 lg:flex lg:flex-col lg:gap-4 lg:overflow-hidden"
          >
            <SidebarLeft />
          </div>

          <!-- Main Stage (Desktop & Mobile) -->
          <div
            class="col-span-12 flex flex-col gap-4 lg:col-span-6 h-full lg:h-auto overflow-y-auto lg:overflow-hidden"
            :class="{ 'hidden lg:flex': activeTab !== 'player' }"
          >
            <MainStage />
          </div>

          <!-- Right Sidebar (Desktop) -->
          <div
            class="hidden lg:col-span-3 lg:flex lg:flex-col lg:gap-4 lg:overflow-hidden"
          >
            <SidebarRight />
          </div>

          <!-- Mobile Views -->
          <div
            v-if="activeTab === 'members'"
            class="col-span-12 h-full overflow-hidden lg:hidden"
          >
            <SidebarLeft />
          </div>

          <div
            v-if="activeTab === 'queue'"
            class="col-span-12 h-full overflow-hidden lg:hidden"
          >
            <SidebarRight />
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Bottom Navigation -->
    <div
      class="lg:hidden border-t border-white/10 bg-slate-950/80 backdrop-blur-md pb-safe"
    >
      <div class="flex items-center justify-around p-2">
        <button
          class="flex flex-col items-center gap-1 rounded-lg p-2 text-xs transition-colors"
          :class="
            activeTab === 'members'
              ? 'text-white bg-white/10'
              : 'text-slate-400 hover:text-slate-300'
          "
          @click="activeTab = 'members'"
        >
          <Users class="h-5 w-5" />
          <span>成员</span>
        </button>

        <button
          class="flex flex-col items-center gap-1 rounded-lg p-2 text-xs transition-colors"
          :class="
            activeTab === 'player'
              ? 'text-white bg-white/10'
              : 'text-slate-400 hover:text-slate-300'
          "
          @click="activeTab = 'player'"
        >
          <Disc3 class="h-5 w-5" />
          <span>播放</span>
        </button>

        <button
          class="flex flex-col items-center gap-1 rounded-lg p-2 text-xs transition-colors relative"
          :class="
            activeTab === 'queue'
              ? 'text-white bg-white/10'
              : 'text-slate-400 hover:text-slate-300'
          "
          @click="activeTab = 'queue'"
        >
          <ListMusic class="h-5 w-5" />
          <span>点歌</span>
          <span
            v-if="queue.length > 0"
            class="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-500"
          ></span>
        </button>
      </div>
    </div>
  </div>
</template>

<style>
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
