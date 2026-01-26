<script setup lang="ts">
import MemberList from "@/components/room/members/MemberList.vue";
import BlacklistPanel from "@/components/room/blacklist/BlacklistPanel.vue";
</script>

<template>
  <div class="flex flex-col gap-4 h-full">
    <MemberList class="flex-1 min-h-0" />
    <BlacklistPanel class="shrink-0" />
  </div>
</template>
