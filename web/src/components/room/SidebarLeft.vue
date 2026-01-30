<script setup lang="ts">
import MemberList from "@/components/room/members/MemberList.vue";
import ChatPanel from "@/components/room/chat/ChatPanel.vue";
</script>

<template>
  <div class="flex flex-col gap-4 h-full overflow-hidden">
    <ChatPanel class="min-h-[300px] max-h-[50%]" />
    <MemberList class="flex-1 min-h-0" />
  </div>
</template>
