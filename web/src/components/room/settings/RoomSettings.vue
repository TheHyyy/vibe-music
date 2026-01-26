<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import { ElMessage } from "element-plus";
import { updateSettings } from "@/api/rooms";
import { useRoomActions, useRoomSelector } from "@/stores/useRoomStore";

const actions = useRoomActions();
const room = useRoomSelector((s) => s.room);
const roomId = useRoomSelector((s) => s.room?.id);
const actionLoading = useRoomSelector((s) => s.actionLoading);

const form = reactive({
  allowAnonymous: true,
  allowDuplicateSongs: false,
  maxQueuedPerUser: 3,
  skipVoteThreshold: 3,
});

watch(
  () => room.value?.settings,
  (s) => {
    if (!s) return;
    form.allowAnonymous = s.allowAnonymous;
    form.allowDuplicateSongs = s.allowDuplicateSongs;
    form.maxQueuedPerUser = s.maxQueuedPerUser;
    form.skipVoteThreshold = s.skipVoteThreshold;
  },
  { immediate: true },
);

const saveKey = computed(() => `settings:save:${roomId.value || ""}`);
const saving = computed(() => !!actionLoading.value[saveKey.value]);

async function save() {
  if (!roomId.value) return;
  actions.setActionLoading(saveKey.value, true);
  try {
    const res = await updateSettings(roomId.value, { ...form });
    if (!res.ok) throw new Error((res as any).error.message);
    ElMessage.success("已保存并同步");
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    actions.setActionLoading(saveKey.value, false);
  }
}
</script>

<template>
  <div class="rounded-xl border border-slate-800 bg-slate-900/40">
    <div class="border-b border-slate-800 px-4 py-3">
      <div class="text-sm font-semibold">房间设置</div>
      <div class="mt-0.5 text-xs text-slate-400">仅 Host 可见</div>
    </div>
    <div class="space-y-3 p-3">
      <div class="flex items-center justify-between gap-3">
        <div class="text-sm">允许匿名加入</div>
        <el-switch v-model="form.allowAnonymous" />
      </div>
      <div class="flex items-center justify-between gap-3">
        <div class="text-sm">允许重复歌曲</div>
        <el-switch v-model="form.allowDuplicateSongs" />
      </div>
      <div class="space-y-1">
        <div class="text-sm">每人队列上限</div>
        <el-input-number v-model="form.maxQueuedPerUser" :min="1" :max="20" size="small" class="w-full" />
      </div>
      <div class="space-y-1">
        <div class="text-sm">跳过投票阈值</div>
        <el-input-number v-model="form.skipVoteThreshold" :min="1" :max="50" size="small" class="w-full" />
      </div>
      <el-button type="primary" class="w-full" :loading="saving" @click="save">保存</el-button>
    </div>
  </div>
</template>
