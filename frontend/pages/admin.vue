<template>
  <div class="admin-container">
    <!-- Zurück-Button zur Hauptseite -->
    <button @click="$router.push('/')" class="back-button">⬅ Zurück</button>
    <h1 class="title">Admin Bereich</h1>

    <!-- Benutzerverwaltung -->
    <h2 class="section-title">Alle Nutzer</h2>
    <p v-if="userError" class="error-message">{{ userError }}</p>
    <ul v-if="users.length">
      <li v-for="user in users" :key="user.id" class="admin-item">
        <span>{{ user.username }}</span>
        <!-- Button zum Löschen eines Nutzers -->
        <button @click="deleteUser(user.id)" class="delete-button">Löschen</button>
      </li>
    </ul>

    <!-- Postverwaltung -->
    <h2 class="section-title">Alle Beiträge</h2>
    <p v-if="postError" class="error-message">{{ postError }}</p>
    <ul v-if="posts.length">
      <li v-for="post in posts" :key="post.id" class="admin-item">
        <span>{{ post.text }}</span>
        <!-- Button zum Löschen eines Beitrags -->
        <button @click="deletePost(post.id)" class="delete-button">Löschen</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

// Reaktive Variablen für Benutzer und Beiträge
const users = ref([])
const posts = ref([])
const userError = ref(null) // Speichert Fehlermeldungen für Benutzer
const postError = ref(null) // Speichert Fehlermeldungen für Beiträge

// Funktion zum Abrufen der Benutzer
const fetchUsers = async () => {
  try {
    const response = await axios.get('/api/admin/users', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    users.value = response.data
  } catch (error) {
    userError.value = 'Fehler beim Laden der Benutzer'
  }
}

// Funktion zum Abrufen der Beiträge
const fetchPosts = async () => {
  try {
    const response = await axios.get('/api/posts', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    // Extrahiert alle "posts"-Objekte aus der API-Antwort
    posts.value = response.data.map(entry => entry.posts);

    console.log("Geladene Posts:", posts.value); // Debugging-Log
  } catch (error) {
    postError.value = 'Fehler beim Laden der Beiträge';
    console.error("Fehler beim Laden der Posts:", error);
  }
};

console.log("Geladene Posts:", posts.value);

// Funktion zum Löschen eines Benutzers
const deleteUser = async (userId) => {
  try {
    await axios.delete(`/api/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    // Entfernt den gelöschten Benutzer aus der Liste
    users.value = users.value.filter(user => user.id !== userId)
  } catch (error) {
    userError.value = 'Fehler beim Löschen des Benutzers'
  }
}

// Funktion zum Löschen eines Beitrags
const deletePost = async (postId) => {
  try {
    await axios.delete(`/api/posts/${postId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    // Entfernt den gelöschten Beitrag aus der Liste
    posts.value = posts.value.filter(post => post.id !== postId)
  } catch (error) {
    postError.value = 'Fehler beim Löschen des Beitrags'
  }
}

// Daten abrufen, wenn die Seite geladen wird
onMounted(() => {
  fetchUsers()
  fetchPosts()
})
</script>

<style scoped>
.admin-container {
  max-width: 600px;
  margin: auto;
  padding: 20px;
}
.title {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
}
.section-title {
  margin-top: 20px;
  font-size: 18px;
  font-weight: bold;
}
.admin-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid #ddd;
}
.delete-button {
  background-color: red;
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
}
.error-message {
  color: red;
}
.back-button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 10px 15px;
  cursor: pointer;
  font-size: 16px;
  border-radius: 5px;
  margin-bottom: 15px;
}
.back-button:hover {
  background-color: #b97d29;
}
</style>