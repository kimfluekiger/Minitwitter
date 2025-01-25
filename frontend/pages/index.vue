<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Your Feed</h1>
    <div>
      {{ posts.data }}
    </div>
  </div>
</template>

<script setup lang="ts">
  const { baseUrl } = useApi()
  const posts = await useFetch(`${baseUrl}/api/posts`)
</script>
