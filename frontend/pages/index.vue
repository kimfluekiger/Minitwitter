<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Your Feed</h1>

    <!-- Eingabe für neue Posts, nur wenn eingeloggt -->
    <div v-if="isLoggedIn" class="mb-6 p-4 border rounded bg-white shadow-md">
      <h2 class="text-lg font-semibold mb-2">Neuen Post erstellen</h2>
      <input v-model="newPostText" class="border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="text" placeholder="Was möchtest du teilen?">
      <button @click="createPost" class="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Posten
      </button>
    </div>

    <!-- Fehlermeldung -->
    <div v-if="errorMessage" class="bg-red-500 text-white p-2 rounded mb-4">
      {{ errorMessage }}
    </div>

    <!-- Erfolgreiche Erstellung -->
    <div v-if="successMessage" class="bg-green-500 text-white p-2 rounded mb-4">
      {{ successMessage }}
    </div>

    <!-- Posts anzeigen -->
    <div v-if="posts.length">
      <div v-for="post in posts" :key="post.id" class="mb-4 p-4 border rounded bg-white shadow-md">
        <h2 class="text-xl font-semibold">{{ post.username }}</h2>
        <p>{{ post.text }}</p>
      </div>
    </div>
    <div v-else>
      <p>Keine Posts vorhanden...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRuntimeConfig } from '#imports'

const config = useRuntimeConfig()

const posts = ref([])
const newPostText = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isLoggedIn = ref(false)

onMounted(async () => {
  // Prüfen, ob der Nutzer eingeloggt ist
  isLoggedIn.value = !!localStorage.getItem('token')

  try {
    const response = await fetch(`${config.public.apiBase}/api/posts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    if (response.ok) {
      posts.value = await response.json()
    } else {
      console.error('Fehler beim Laden der Posts')
    }
  } catch (error) {
    console.error('Serverfehler:', error)
  }
})

const createPost = async () => {
  if (!newPostText.value.trim()) {
    errorMessage.value = 'Der Post darf nicht leer sein!'
    return
  }

  try {
    const response = await fetch(`${config.public.apiBase}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ text: newPostText.value })
    })

    if (response.ok) {
      const newPost = await response.json()
      posts.value.unshift(newPost) // Post direkt in die Liste hinzufügen
      successMessage.value = 'Post erfolgreich erstellt!'
      errorMessage.value = ''
      newPostText.value = ''
    } else {
      errorMessage.value = 'Post konnte nicht erstellt werden!'
      successMessage.value = ''
    }
  } catch (error) {
    console.error('Serverfehler:', error)
    errorMessage.value = 'Fehler beim Erstellen des Posts!'
  }
}
</script>