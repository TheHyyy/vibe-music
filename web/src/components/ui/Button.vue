<script setup lang="ts">
import { computed } from "vue";
import { Loader2 } from "lucide-vue-next";
import { cn } from "@/utils";

const props = withDefaults(
  defineProps<{
    variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
    size?: "sm" | "md" | "lg" | "icon";
    loading?: boolean;
    disabled?: boolean;
    class?: string;
  }>(),
  {
    variant: "primary",
    size: "md",
    loading: false,
    disabled: false,
    class: "",
  },
);

const variants = {
  primary: "bg-white text-black hover:bg-slate-200 active:scale-95",
  secondary: "bg-slate-800 text-white hover:bg-slate-700 active:scale-95",
  ghost: "bg-transparent hover:bg-white/10 text-slate-200 hover:text-white active:scale-95",
  danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 active:scale-95",
  outline: "border border-white/10 bg-transparent hover:bg-white/5 text-slate-200 active:scale-95",
};

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 py-2",
  lg: "h-12 px-8 text-lg",
  icon: "h-10 w-10 p-0",
};

const className = computed(() => {
  return cn(
    "inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50",
    variants[props.variant],
    sizes[props.size],
    props.class,
  );
});
</script>

<template>
  <button :class="className" :disabled="disabled || loading">
    <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
    <slot />
  </button>
</template>
