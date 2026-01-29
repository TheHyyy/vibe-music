<script setup lang="ts">
import MemberList from "@/components/room/members/MemberList.vue";
import ChatPanel from "@/components/room/chat/ChatPanel.vue";
</script>

<template>
  <div class="flex flex-col gap-4 h-full overflow-hidden">
    <MemberList class="h-[35%] min-h-[200px]" />
    <ChatPanel class="flex-1 min-h-0" />
  </div>
</template>
