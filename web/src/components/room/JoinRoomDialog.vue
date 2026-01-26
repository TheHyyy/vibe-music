<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { User, Sparkles } from "lucide-vue-next";
import { ElMessage } from "element-plus";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import { getPublicRoomInfo, joinRoom } from "@/api/rooms";
import { useRoomActions } from "@/stores/useRoomStore";

const props = defineProps<{
  roomId: string;
}>();

const emit = defineEmits<{
  (e: "success"): void;
}>();

const actions = useRoomActions();
const loading = ref(true);
const joining = ref(false);
const roomInfo = ref<{ name: string; code: string; hostName?: string } | null>(
  null,
);

const form = reactive({
  displayName: localStorage.getItem("echo_username") || `Guest ${Math.floor(Math.random() * 9000) + 1000}`,
});

function saveDisplayName(name: string) {
  if (name.trim()) {
    localStorage.setItem("echo_username", name.trim());
  }
}

async function fetchInfo() {
  loading.value = true;
  try {
    const res = await getPublicRoomInfo(props.roomId);
    if (res.ok) {
      roomInfo.value = res.data;
    } else {
      throw new Error((res as any).error?.message || "无法获取房间信息");
    }
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

async function onJoin() {
  if (!roomInfo.value) return;
  if (!form.displayName.trim()) {
    ElMessage.warning("请输入昵称");
    return;
  }
  
  saveDisplayName(form.displayName);
  joining.value = true;
  
  try {
    const res = await joinRoom({
      code: roomInfo.value.code,
      displayName: form.displayName,
    });
    
    if (!res.ok) throw new Error((res as any).error.message);
    
    actions.setToken(res.data.token);
    actions.hydrate(res.data.state);
    emit("success");
    ElMessage.success("欢迎加入！");
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    joining.value = false;
  }
}

onMounted(() => {
  fetchInfo();
});
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div class="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
      <!-- Loading State -->
      <div v-if="loading" class="flex h-64 flex-col items-center justify-center gap-4 text-slate-400">
        <div class="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
        <p class="text-sm">正在连接房间...</p>
      </div>

      <!-- Content -->
      <div v-else-if="roomInfo" class="p-6">
        <div class="mb-8 text-center">
          <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
            <Sparkles class="h-6 w-6" />
          </div>
          <h2 class="text-xl font-bold text-white">{{ roomInfo.name }}</h2>
          <p class="mt-1 text-sm text-slate-400">
            Hosted by <span class="text-indigo-400">@{{ roomInfo.hostName || "Unknown" }}</span>
          </p>
        </div>

        <div class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-slate-400 ml-1">你的昵称</label>
            <Input
              v-model="form.displayName"
              :icon="User"
              placeholder="大家怎么称呼你"
              @enter="onJoin"
              autofocus
            />
          </div>

          <Button
            class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
            size="lg"
            :loading="joining"
            @click="onJoin"
          >
            立即加入
          </Button>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="flex h-64 flex-col items-center justify-center gap-4 p-6 text-center">
        <p class="text-slate-400">无法找到该房间，可能已解散或链接无效。</p>
        <Button variant="outline" @click="$router.push('/')">回到首页</Button>
      </div>
    </div>
  </div>
</template>
