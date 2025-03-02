<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Your Feed</h1>

    <!-- Eingabe für neue Posts, nur wenn eingeloggt -->
    <div v-if="isLoggedIn" class="mb-6 p-4 border rounded bg-white shadow-md">
      <h2 class="text-lg font-semibold mb-2">Neuen Post erstellen</h2>
      <input v-model="newPostText" 
             class="border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
             type="text" placeholder="Was möchtest du teilen?">
      <button @click="createPost" 
              class="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
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
      <div v-for="post in sortedPosts" :key="post.id" 
           class="mb-4 p-4 border-4 border-gray-300 rounded-lg bg-white shadow-md relative">
        
        <!-- Username & Zeitstempel -->
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-bold text-blue-600">
            {{ post.username || 'Unbekannter Nutzer' }}
          </h2>
          <p class="text-gray-500 text-sm">
            {{ formatDate(post.createdAt) }}
          </p>
        </div>

        <!-- Falls eine Korrektur vorhanden ist, wird sie in Rot dargestellt -->
        <p v-if="post.correction" class="text-red-500 font-semibold border border-red-500 p-2 rounded">
          {{ post.correction }}
        </p>
        <p v-else class="border border-gray-200 p-2 rounded">{{ post.text }}</p>

        <!-- Bearbeiten-Feld -->
        <div v-if="editingPostId === post.id">
          <input v-model="editedText" 
                 class="border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
          <button @click="updatePost(post.id)" 
                  class="mt-2 bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded">
            Speichern
          </button>
          <button @click="cancelEdit" 
                  class="mt-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded ml-2">
            Abbrechen
          </button>
        </div>

        <!-- Buttons nur für eigene Posts -->
        <div v-if="isLoggedIn && post.userId === loggedInUserId" 
             class="absolute top-2 right-2 flex space-x-2">
          <button @click="startEdit(post)" 
                  class="text-blue-500 hover:text-blue-700">
            ✏️
          </button>
          <button @click="deletePost(post.id)" 
                  class="text-red-500 hover:text-red-700">
            🗑️
          </button>
        </div>
      </div>
    </div>
    <div v-else>
      <p>Keine Posts vorhanden...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRuntimeConfig } from '#imports'

const config = useRuntimeConfig()

interface Post {
  id: number;
  userId: number;
  username: string;
  text: string;
  createdAt: string;
  correction?: string;
}

const posts = ref<Post[]>([])
const newPostText = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isLoggedIn = ref(false)
const loggedInUserId = ref<number | null>(null) // ID des eingeloggten Nutzers

const editingPostId = ref<number | null>(null)
const editedText = ref('')

const fetchPosts = async () => {
  try {
    const response = await fetch(`${config.public.apiBase}/api/posts`);
    if (response.ok) {
      posts.value = await response.json();
    } else {
      console.error("Fehler beim Laden der Posts");
    }
  } catch (error) {
    console.error("Serverfehler:", error);
  }
};

onMounted(async () => {
  const token = localStorage.getItem('token');
  if (token) {
    isLoggedIn.value = true;
    const userData = JSON.parse(atob(token.split('.')[1])); // Token-Decode für User-ID
    loggedInUserId.value = userData.id;
  }

  await fetchPosts(); // 🔄 Holt die aktuellen Posts direkt nach dem Laden der Seite
});

// **Sortierte Posts nach `createdAt`**
const sortedPosts = computed(() => {
  return [...posts.value].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

// **Formatierte Zeitangabe**
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// **Post machen **
const createPost = async () => {
  if (!newPostText.value.trim()) {
    errorMessage.value = 'Der Post darf nicht leer sein!';
    return;
  }

  console.log("Sende Post-Request an:", `${config.public.apiBase}/api/posts`);

  try {
    const response = await fetch(`${config.public.apiBase}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ text: newPostText.value })
    });

    console.log("API Antwort:", response);

    if (response.ok) {
      successMessage.value = 'Post erfolgreich erstellt!';
      errorMessage.value = '';
      newPostText.value = '';

      await fetchPosts(); // 🔄 Holt die aktualisierten Posts

    } else {
      errorMessage.value = 'Post konnte nicht erstellt werden!';
      successMessage.value = '';
    }
  } catch (error) {
    console.error('Serverfehler:', error);
    errorMessage.value = 'Fehler beim Erstellen des Posts!';
  }
};

// **Post löschen**
const deletePost = async (postId: number) => {
  if (!confirm('Willst du diesen Post wirklich löschen?')) return;

  try {
    const response = await fetch(`${config.public.apiBase}/api/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.ok) {
      successMessage.value = 'Post erfolgreich gelöscht!';
      errorMessage.value = '';

      await fetchPosts(); // 🔄 Holt die aktualisierten Posts

    } else {
      errorMessage.value = 'Fehler beim Löschen des Posts!';
    }
  } catch (error) {
    console.error('Serverfehler:', error);
    errorMessage.value = 'Serverfehler beim Löschen des Posts!';
  }
};

// **Bearbeiten eines Posts starten**
const startEdit = (post: Post) => {
  editingPostId.value = post.id;
  editedText.value = post.text;
}

// **Bearbeiten abbrechen**
const cancelEdit = () => {
  editingPostId.value = null;
  editedText.value = '';
}

// **Post aktualisieren**
const updatePost = async (postId: number) => {
  if (!editedText.value.trim()) {
    errorMessage.value = 'Der Post darf nicht leer sein!';
    return;
  }

  try {
    const response = await fetch(`${config.public.apiBase}/api/posts/${postId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ text: editedText.value })
    });

    if (response.ok) {
      const updatedPost = await response.json();
      const index = posts.value.findIndex(post => post.id === postId);
      if (index !== -1) {
        posts.value[index].text = updatedPost.text;
      }

      await fetchPosts(); // 🔄 Holt die aktualisierten Posts
      
      successMessage.value = 'Post erfolgreich aktualisiert!';
      errorMessage.value = '';
      editingPostId.value = null;
      editedText.value = '';
    } else {
      errorMessage.value = 'Fehler beim Aktualisieren des Posts!';
    }
  } catch (error) {
    console.error('Serverfehler:', error);
    errorMessage.value = 'Serverfehler beim Aktualisieren des Posts!';
  }
}
</script>