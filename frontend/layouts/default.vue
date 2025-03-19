<template>
  <div>
    <!-- Navigationsleiste -->
    <nav class="bg-gray-800 p-4">
      <div class="container mx-auto flex justify-between items-center">
        <!-- Titel der Anwendung -->
        <div class="text-white text-lg">Minitwitter</div>
        <div class="flex items-center space-x-4">
          <!-- Admin-Bereich Link, nur sichtbar wenn der Nutzer Admin ist -->
          <NuxtLink v-if="isAdmin" to="/admin" class="text-white mr-4">Admin-Bereich</NuxtLink>

          <!-- Login-Button, wird angezeigt wenn der Nutzer nicht eingeloggt ist -->
          <button v-if="!isLoggedIn" @click="goToLogin" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Login
          </button>
          <!-- Logout-Button, wird angezeigt wenn der Nutzer eingeloggt ist -->
          <button v-if="isLoggedIn" @click="logout" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
            Logout
          </button>
        </div>
      </div>
    </nav>
    <!-- Platzhalter für dynamische Seiteninhalte -->
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isLoggedIn = ref(false) // Speichert den Login-Status des Nutzers
const isAdmin = ref(false) // Speichert, ob der Nutzer Admin ist

// Funktion zur Aktualisierung des Authentifizierungsstatus
const updateAuthState = () => {
  isLoggedIn.value = !!localStorage.getItem('token') // Prüft, ob ein Token vorhanden ist
  isAdmin.value = localStorage.getItem('isAdmin') === 'true' // Prüft, ob der Nutzer Admin ist
}

// Beobachtet Änderungen in localStorage und aktualisiert den Status
watchEffect(updateAuthState)

onMounted(() => {
  updateAuthState()
  // Eventlistener für Änderungen in localStorage hinzufügen (z. B. wenn in einem anderen Tab ausgeloggt wird)
  window.addEventListener('storage', updateAuthState)
})

onUnmounted(() => {
  // Eventlistener wieder entfernen, um Speicherlecks zu vermeiden
  window.removeEventListener('storage', updateAuthState)
})

// Navigiert zur Login-Seite
const goToLogin = () => {
  router.push('/login')
}

// Logout-Funktion: Entfernt Token und Admin-Status, aktualisiert die UI und lädt die Seite neu
const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('isAdmin')

  // Löst ein Storage-Event aus, damit Änderungen sofort übernommen werden
  window.dispatchEvent(new Event('storage'))

  updateAuthState() // Status direkt aktualisieren

  // Verzögertes Neuladen der Seite, um UI-Probleme zu vermeiden
  setTimeout(() => {
    window.location.reload();
  }, 500);
}
</script>