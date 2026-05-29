<script setup>
defineProps({ videos: { type: Array, default: () => [] } })
const ytSearch = (q) => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q || '')
const watchUrl = (id) => `https://www.youtube.com/watch?v=${id}`
const thumbUrl = (id) => `https://img.youtube.com/vi/${id}/mqdefault.jpg`
</script>

<template>
  <div v-if="videos?.length" class="border-t border-gray-100 pt-4">
    <div class="flex items-center gap-2 mb-2.5">
      <span class="w-1 h-4 rounded bg-red-500"></span>
      <h3 class="text-xs font-bold text-navy">🎬 관련 영상</h3>
    </div>
    <div class="flex flex-col gap-2">
      <a
        v-for="v in videos"
        :key="v.videoId || v.q"
        :href="v.videoId ? watchUrl(v.videoId) : ytSearch(v.q)"
        target="_blank"
        rel="noopener"
        class="flex gap-3 hover:bg-gray-50 rounded-lg p-2 transition-colors group"
      >
        <img
          v-if="v.videoId"
          :src="thumbUrl(v.videoId)"
          class="w-24 h-14 rounded object-cover shrink-0 ring-1 ring-gray-200 group-hover:ring-red-300 transition"
          loading="lazy" alt=""
        />
        <span v-else class="w-24 h-14 rounded shrink-0 bg-red-50 flex items-center justify-center text-red-500 text-xl">🔍</span>
        <span class="flex-1 min-w-0 flex flex-col justify-center">
          <span class="text-xs font-semibold text-onyx group-hover:text-red-600 transition-colors line-clamp-2 leading-snug">
            {{ v.label }}
          </span>
          <span class="text-[10px] text-gray-400 mt-1">
            {{ v.videoId ? '▶ YouTube' : '🔍 검색 결과' }}
          </span>
        </span>
      </a>
    </div>
  </div>
</template>
