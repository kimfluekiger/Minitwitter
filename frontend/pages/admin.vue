<template>
    <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-4">Admin Bereich</h1>
  
      <h2 class="text-xl font-semibold mt-4">Alle Nutzer</h2>
      <div v-for="user in users" :key="user.id" class="p-2 border rounded mb-2">
        {{ user.username }}
        <button @click="deleteUser(user.id)" class="ml-2 bg-red-500 text-white px-2 py-1 rounded">Löschen</button>
      </div>
  
      <h2 class="text-xl font-semibold mt-4">Alle Beiträge</h2>
      <div v-for="post in posts" :key="post.id" class="p-2 border rounded mb-2">
        {{ post.text }}
        <button @click="deletePost(post.id)" class="ml-2 bg-red-500 text-white px-2 py-1 rounded">Löschen</button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  
  const users = ref([])
  const posts = ref([])
  
  const fetchData = async () => {
    users.value = await (await fetch('/api/users')).json()
    posts.value = await (await fetch('/api/posts')).json()
  }
  
  const deleteUser = async (id) => {
    await fetch(`/api/users/${id}`, { method: 'DELETE' })
    fetchData()
  }
  
  const deletePost = async (id) => {
    await fetch(`/api/posts/${id}`, { method: 'DELETE' })
    fetchData()
  }
  
  onMounted(fetchData)
  </script>