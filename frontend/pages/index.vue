<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Your Feed</h1>

    <!-- Eingabefeld für neue Posts, wird nur angezeigt, wenn der Nutzer eingeloggt ist -->
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

    <!-- Fehlermeldungen bei Problemen -->
    <div v-if="errorMessage" class="bg-red-500 text-white p-2 rounded mb-4">
      {{ errorMessage }}
    </div>

    <!-- Erfolgsnachricht, wenn ein Post erfolgreich erstellt oder gelöscht wurde -->
    <div v-if="successMessage" class="bg-green-500 text-white p-2 rounded mb-4">
      {{ successMessage }}
    </div>

    <!-- Anzeige der Posts, wenn vorhanden -->
    <div v-if="sortedPosts.length">
      <div v-for="post in sortedPosts" :key="post.id" class="mb-4 p-4 border-4 border-gray-300 rounded-lg bg-white shadow-md relative">
        
        <!-- Falls ein Post als Hassrede markiert wurde und dem aktuellen Nutzer gehört -->
        <div v-if="post.sentiment === 'negative' && post.userId === loggedInUserId">
          <p class="bg-yellow-300 text-black p-2 rounded mb-2">
            ⚠️ Dein Beitrag wurde als Hassrede markiert und ist nur für dich sichtbar.
          </p>
        </div>

        <!-- Benutzername und Zeitstempel des Posts -->
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-bold text-blue-600">
            {{ post.username || 'Unbekannter Nutzer' }}
          </h2>
          <p class="text-gray-500 text-sm">
            {{ formatDate(post.createdAt) }}
          </p>
        </div>

        <!-- Falls eine Korrektur für den Post vorliegt, wird sie angezeigt -->
        <p v-if="post.correction && post.sentiment !== 'neutral'" class="text-red-500 font-semibold border border-red-500 p-2 rounded">
          {{ post.correction }}
        </p>
        <p v-else class="border border-gray-200 p-2 rounded">{{ post.text }}</p>

        <!-- Eingabefeld zur Bearbeitung des Posts -->
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

        <!-- Buttons zum Bearbeiten und Löschen eines eigenen Posts -->
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

    <!-- Falls keine Posts vorhanden sind -->
    <div v-else>
      <p>Keine Posts vorhanden...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRuntimeConfig } from '#imports'

const config = useRuntimeConfig()

// Definition der Post-Schnittstelle
interface Post {
  id: number;
  userId: number;
  username: string;
  text: string;
  createdAt: string;
  correction?: string;
}

// Reaktive Variablen
const posts = ref<Post[]>([])
const newPostText = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isLoggedIn = ref(false) // Gibt an, ob ein Nutzer eingeloggt ist
const loggedInUserId = ref<number | null>(null) // Speichert die ID des eingeloggten Nutzers

const editingPostId = ref<number | null>(null)
const editedText = ref('')

// **Abrufen der Posts**
const fetchPosts = async () => {
  try {
    const response = await fetch(`${config.public.apiBase}/api/posts`);
    if (response.ok) {
      const responseData = await response.json();

      // Verknüpft die Posts mit den Nutzernamen
      posts.value = responseData.map((item: { posts: Post; users: { id: number; username: string } }) => ({
        ...item.posts,
        username: item.users?.username || "Unbekannter Nutzer"
      }));
    } else {
      console.error("Fehler beim Laden der Posts");
    }
  } catch (error) {
    console.error("Serverfehler:", error);
  }
};

// **Initialisierung beim Laden der Seite**
onMounted(async () => {
  const token = localStorage.getItem('token');
  if (token) {
    isLoggedIn.value = true;
    const userData = JSON.parse(atob(token.split('.')[1])); // Dekodiert das Token für die User-ID
    loggedInUserId.value = userData.id;
  }

  await fetchPosts(); // Ruft die aktuellen Posts ab
});

// **Filtert Posts, damit nur eigene Hassrede sichtbar ist**
const filteredPosts = computed(() => {
  return posts.value.filter(post => 
    post.sentiment !== 'negative' || post.userId === loggedInUserId.value
  );
});

// **Sortiert die Posts nach Erstellungsdatum**
const sortedPosts = computed(() => {
  return [...filteredPosts.value].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
});

// **Formatiert das Datum für die Anzeige**
const formatDate = (dateString: string) => {
  if (!dateString) return "Ungültiges Datum"; 
  const date = new Date(dateString);
  return isNaN(date.getTime()) 
    ? "Ungültiges Datum" 
    : date.toLocaleString('de-DE', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      });
}

// **Erstellt einen neuen Post**
const createPost = async () => {
  if (!newPostText.value.trim()) {
    errorMessage.value = 'Der Post darf nicht leer sein!';
    return;
  }

  try {
    const response = await fetch(`${config.public.apiBase}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ text: newPostText.value })
    });

    if (response.ok) {
      successMessage.value = 'Post erfolgreich erstellt!';
      errorMessage.value = '';
      newPostText.value = '';
      await fetchPosts();
    } else {
      errorMessage.value = 'Post konnte nicht erstellt werden!';
    }
  } catch (error) {
    console.error('Serverfehler:', error);
    errorMessage.value = 'Fehler beim Erstellen des Posts!';
  }
};

// **Löscht einen Post nach Bestätigung**
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
      await fetchPosts();
    } else {
      errorMessage.value = 'Fehler beim Löschen des Posts!';
    }
  } catch (error) {
    console.error('Serverfehler:', error);
    errorMessage.value = 'Serverfehler beim Löschen des Posts!';
  }
};

// **Startet den Bearbeitungsmodus für einen Post**
const startEdit = (post: Post) => {
  editingPostId.value = post.id;
  editedText.value = post.text;
};

// **Speichert Änderungen am Post**
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
      successMessage.value = 'Post erfolgreich aktualisiert!';
      errorMessage.value = '';
      editingPostId.value = null;
      editedText.value = '';

      await fetchPosts(); // 🔄 Aktualisierte Posts holen
    } else {
      errorMessage.value = 'Fehler beim Aktualisieren des Posts!';
    }
  } catch (error) {
    console.error('❌ Serverfehler:', error);
    errorMessage.value = 'Serverfehler beim Aktualisieren des Posts!';
  }
};

const cancelEdit = () => {
  editingPostId.value = null;
  editedText.value = '';
};

</script>