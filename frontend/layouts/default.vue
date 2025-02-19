<template>
  <div>
    <nav class="bg-gray-800 p-4">
      <div class="container mx-auto flex justify-between items-center">
        <div class="text-white text-lg">Minitwitter</div>
        <div class="flex items-center space-x-4">
          <!-- Login-Button anzeigen, wenn der User NICHT eingeloggt ist -->
          <button v-if="!isLoggedIn" @click="goToLogin" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Login
          </button>
          <!-- Logout-Button anzeigen, wenn der User eingeloggt ist -->
          <button v-if="isLoggedIn" @click="logout" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
            Logout
          </button>
        </div>
      </div>
    </nav>
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isLoggedIn = ref(!!localStorage.getItem('token')) // Direkt den Token setzen

// Prüft Änderungen in localStorage und aktualisiert `isLoggedIn` automatisch
const updateAuthState = () => {
  console.log("Auth state updated:", !!localStorage.getItem('token')) // Debugging
  isLoggedIn.value = !!localStorage.getItem('token')
}

// Beobachtet `localStorage` Änderungen für sofortige UI-Updates
watchEffect(() => {
  isLoggedIn.value = !!localStorage.getItem('token')
})

onMounted(() => {
  updateAuthState()
  window.addEventListener('storage', updateAuthState) // Falls in anderem Tab ausgeloggt wird
})

onUnmounted(() => {
  window.removeEventListener('storage', updateAuthState)
})

// Login-Seite aufrufen
const goToLogin = () => {
  router.push('/login')
}

// Logout: Token löschen + UI sofort aktualisieren
const logout = () => {
  localStorage.removeItem('token')

  // Hier ein Event feuern, um die Änderung sofort sichtbar zu machen
  window.dispatchEvent(new Event('storage'))

  updateAuthState()  // Direkt den Status aktualisieren
}
</script>