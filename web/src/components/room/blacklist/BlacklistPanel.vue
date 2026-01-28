<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage } from "element-plus";
import { ShieldBan, Trash2 } from "lucide-vue-next";
import { useRoomSelector } from "@/stores/useRoomStore";
import Input from "@/components/ui/Input.vue";
import Button from "@/components/ui/Button.vue";

const role = useRoomSelector((s) => s.currentUser?.role);
const canEdit = computed(
  () => role.value === "HOST" || role.value === "MODERATOR",
);

const input = ref("");
const mock = ref<string[]>([]);

function add() {
  if (!input.value.trim()) return;
  mock.value = [...mock.value, input.value.trim()];
  input.value = "";
  ElMessage.success("已加入黑名单（演示）");
}

function remove(v: string) {
  mock.value = mock.value.filter((x) => x !== v);
  ElMessage.success("已移除（演示）");
}
</script>

<template>
  <div class="glass flex flex-col rounded-2xl">
    <div class="border-b border-white/5 px-4 py-3">
      <div class="flex items-center gap-2">
        <ShieldBan class="h-4 w-4 text-slate-400" />
        <h3 class="font-semibold text-white">黑名单</h3>
      </div>
    </div>

    <div class="space-y-3 p-3">
      <div v-if="canEdit" class="flex items-center gap-2">
        <Input
          v-model="input"
          placeholder="输入用户 ID"
          class="bg-slate-900/50"
        />
        <Button size="sm" variant="danger" @click="add">拉黑</Button>
      </div>

      <div
        v-if="mock.length === 0"
        class="py-4 text-center text-xs text-slate-500"
      >
        暂无黑名单记录
      </div>

      <div v-else class="space-y-1">
        <div
          v-for="v in mock"
          :key="v"
          class="flex items-center justify-between rounded-lg border border-transparent bg-white/5 px-3 py-2 text-xs"
        >
          <span class="truncate text-slate-300 font-mono">{{ v }}</span>
          <Button
            v-if="canEdit"
            size="icon"
            variant="ghost"
            class="h-6 w-6 text-slate-400 hover:text-red-400"
            @click="remove(v)"
          >
            <Trash2 class="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
