<script setup lang="ts">
import { UserX } from "lucide-vue-next";
import type { UserSummary } from "@/types/api";
import Button from "@/components/ui/Button.vue";

const props = defineProps<{
  member: UserSummary;
  canKick: boolean;
  kickLoading: boolean;
}>();

const emit = defineEmits<{ (e: "kick", userId: string): void }>();

function kick() {
  emit("kick", props.member.id);
}
</script>

<template>
  <div class="group flex items-center justify-between rounded-lg border border-transparent px-3 py-2 transition-all hover:border-white/5 hover:bg-white/5" v-memo="[member.id, member.role]">
    <div class="flex items-center gap-3 min-w-0">
      <img 
        :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`" 
        class="h-8 w-8 rounded-full bg-white/10"
      />
      <div class="min-w-0">
        <div class="truncate text-sm font-medium text-slate-200 group-hover:text-white">
          {{ member.displayName }}
        </div>
        <div class="flex items-center gap-1.5 text-[10px] text-slate-500 group-hover:text-slate-400">
          <span class="uppercase">{{ member.role }}</span>
          <span v-if="member.role === 'HOST'" class="h-1 w-1 rounded-full bg-indigo-500"></span>
        </div>
      </div>
    </div>

    <div v-if="canKick && member.role !== 'HOST'" class="opacity-0 transition-opacity group-hover:opacity-100">
      <Button 
        size="icon" 
        variant="danger" 
        class="h-7 w-7" 
        :loading="kickLoading" 
        title="踢出用户"
        @click="kick"
      >
        <UserX class="h-3 w-3" />
      </Button>
    </div>
  </div>
</template>
