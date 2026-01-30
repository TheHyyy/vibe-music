<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { LogOut, Copy, Music2, Users } from "lucide-vue-next";
import { useRoomActions, useRoomSelector } from "@/stores/useRoomStore";
import Button from "@/components/ui/Button.vue";

const router = useRouter();
const actions = useRoomActions();
const room = useRoomSelector((s) => s.room);
const currentUser = useRoomSelector((s) => s.currentUser);
const members = useRoomSelector((s) => s.members);

const roleLabel = computed(() => currentUser.value?.role || "MEMBER");

async function copyText(text: string) {
  try {
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    void 0;
  }

  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.top = "0";
    el.style.left = "0";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

async function copyRoomCode() {
  const code = room.value?.code;
  if (!code) return;
  const ok = await copyText(code);
  if (ok) ElMessage.success("已复制房间码");
  else ElMessage.error("复制失败，请手动选择复制");
}

async function copyInviteLink() {
  const code = room.value?.code;
  if (!code) return;
  const url = `${window.location.origin}/?code=${code}`;
  const text = `🎵 来六人组 Music 一起听歌吧！\n👉 点击加入：${url}\n🔑 房间码：${code}`;
  const ok = await copyText(text);
  if (ok) ElMessage.success("已复制邀请链接");
  else ElMessage.error("复制失败，请手动选择复制");
}

function backHome() {
  actions.resetRoom();
  router.replace({ path: "/" });
}
</script>

<template>
  <div
    class="sticky top-0 z-20 glass border-b-0 border-b-white/5 px-4 py-3 shadow-sm"
  >
    <div class="mx-auto flex max-w-[1600px] items-center justify-between">
      <div class="flex items-center gap-4">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white"
        >
          <Music2 class="h-5 w-5" />
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <h1 class="truncate text-lg font-semibold text-white">
              {{ room?.name || "房间" }}
            </h1>
            <span
              class="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white/80"
              >{{ roleLabel }}</span
            >
          </div>
          <div class="flex items-center gap-3 text-xs text-slate-400">
            <button
              class="group flex items-center gap-1 hover:text-white transition-colors"
              type="button"
              @click="copyRoomCode"
            >
              <span data-testid="room-code" class="font-mono"
                >#{{ room?.code || "------" }}</span
              >
              <Copy
                class="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </button>
            <div data-testid="room-online-count" class="flex items-center gap-1">
              <Users class="h-3 w-3" />
              <span>{{ members.length }} 在线</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          class="hidden sm:inline-flex"
          @click="copyInviteLink"
        >
          <Copy class="mr-2 h-4 w-4" />
          邀请
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          @click="backHome"
        >
          <LogOut class="mr-2 h-4 w-4" />
          退出
        </Button>
      </div>
    </div>
  </div>
</template>
