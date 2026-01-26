<script setup lang="ts">
import { computed } from "vue";
import { ElMessage } from "element-plus";
import { Users } from "lucide-vue-next";
import MemberItem from "@/components/room/members/MemberItem.vue";
import { adminKick } from "@/api/rooms";
import { useRoomActions, useRoomSelector } from "@/stores/useRoomStore";

const actions = useRoomActions();
const members = useRoomSelector((s) => s.members);
const role = useRoomSelector((s) => s.currentUser?.role);
const roomId = useRoomSelector((s) => s.room?.id);
const actionLoading = useRoomSelector((s) => s.actionLoading);

const canKick = computed(() => role.value === "HOST");

function kickKey(userId: string) {
  return `admin:kick:${userId}`;
}

async function kick(userId: string) {
  if (!roomId.value) return;
  const k = kickKey(userId);
  actions.setActionLoading(k, true);
  try {
    const res = await adminKick(roomId.value, userId);
    if (!res.ok) throw new Error((res as any).error.message);
    ElMessage.success("已踢出");
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    actions.setActionLoading(k, false);
  }
}
</script>

<template>
  <div class="glass flex flex-1 flex-col overflow-hidden rounded-2xl">
    <div class="border-b border-white/5 px-4 py-3">
      <div class="flex items-center gap-2">
        <Users class="h-4 w-4 text-slate-400" />
        <h3 class="font-semibold text-white">在线成员</h3>
        <span class="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">{{ members.length }}</span>
      </div>
    </div>
    
    <div class="flex-1 overflow-y-auto p-2 scrollbar-thin">
      <div v-if="members.length === 0" class="px-2 py-6 text-center text-sm text-slate-400">暂无成员</div>
      <div v-else class="space-y-1">
        <MemberItem
          v-for="m in members"
          :key="m.id"
          :member="m"
          :can-kick="canKick"
          :kick-loading="!!actionLoading[kickKey(m.id)]"
          @kick="kick"
        />
      </div>
    </div>
  </div>
</template>
