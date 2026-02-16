import { ref, watch } from "vue";
import type { Song } from "@/types/api";
import { ElMessage } from "element-plus";

const STORAGE_KEY = "echo:favorites";

const favorites = ref<Song[]>([]);

// Initialize
try {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    favorites.value = JSON.parse(raw);
  }
} catch (e) {
  console.error("Failed to load favorites", e);
}

// Persist
watch(
  favorites,
  (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
  },
  { deep: true }
);

export function useFavorites() {
  function isFavorite(songId: string) {
    return favorites.value.some((s) => s.id === songId);
  }

  function toggleFavorite(song: Song) {
    if (isFavorite(song.id)) {
      favorites.value = favorites.value.filter((s) => s.id !== song.id);
      ElMessage.success("已取消收藏");
    } else {
      favorites.value.unshift(song);
      ElMessage.success("已收藏");
    }
  }

  function removeFavorite(songId: string) {
    favorites.value = favorites.value.filter((s) => s.id !== songId);
  }

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    removeFavorite,
  };
}
