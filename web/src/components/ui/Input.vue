<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { cn } from "@/utils";

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    modelValue?: string | number;
    type?: string;
    placeholder?: string;
    class?: string;
    icon?: any;
  }>(),
  {
    modelValue: "",
    type: "text",
    placeholder: "",
    class: "",
    icon: undefined,
  },
);

const emit = defineEmits(["update:modelValue", "enter"]);

const value = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});
</script>

<template>
  <div class="relative">
    <component
      :is="icon"
      v-if="icon"
      class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
    />
    <input
      v-bind="attrs"
      v-model="value"
      :type="type"
      :class="
        cn(
          'flex h-10 w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50 transition-all',
          icon ? 'pl-9' : '',
          props.class,
        )
      "
      :placeholder="placeholder"
      @keyup.enter="emit('enter')"
    />
  </div>
</template>
