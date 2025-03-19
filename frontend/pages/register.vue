<template>
    <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 class="text-3xl font-bold mb-6">Registrieren</h1>
  
      <!-- Anzeige einer Fehlermeldung, falls die Registrierung fehlschlägt -->
      <div v-if="errorMessage" class="bg-red-500 text-white p-2 rounded mb-4">
        {{ errorMessage }}
      </div>
  
      <!-- Anzeige einer Erfolgsmeldung, wenn die Registrierung erfolgreich war -->
      <div v-if="successMessage" class="bg-green-500 text-white p-2 rounded mb-4">
        {{ successMessage }}
      </div>
  
      <!-- Formular zur Registrierung eines neuen Nutzers -->
      <form @submit.prevent="register" class="w-full max-w-sm">
        <div class="mb-4">
          <!-- Eingabefeld für den Benutzernamen -->
          <label class="block text-gray-700 text-sm font-bold mb-2" for="username">
            Username
          </label>
          <input v-model="username" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                 id="username" type="text" placeholder="Username">
        </div>
        <div class="mb-6">
          <!-- Eingabefeld für das Passwort -->
          <label class="block text-gray-700 text-sm font-bold mb-2" for="password">
            Passwort
          </label>
          <input v-model="password" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                 id="password" type="password" placeholder="Passwort">
        </div>
        <div class="flex items-center justify-between">
          <!-- Button zur Registrierung -->
          <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
            Registrieren
          </button>
        </div>
      </form>
  
      <!-- Link zur Login-Seite für bestehende Nutzer -->
      <div class="mt-4">
        <p class="text-gray-600">Bereits ein Konto?</p>
        <button @click="goToLogin" class="mt-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
          Login
        </button>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useRuntimeConfig } from '#imports'
  
  // Reaktive Variablen für Benutzereingaben und Statusmeldungen
  const username = ref('')
  const password = ref('')
  const router = useRouter()
  const config = useRuntimeConfig()
  
  const errorMessage = ref('') // Speichert Fehlermeldungen
  const successMessage = ref('') // Speichert Erfolgsmeldungen
  
  // Funktion zur Registrierung eines neuen Nutzers
  const register = async () => {
    try {
      console.log('Sende Registrierungs-Request an:', `${config.public.apiBase}/api/auth/register`)
  
      const response = await fetch(`${config.public.apiBase}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.value, password: password.value }),
      })
  
      console.log('Server Response:', response)
  
      if (response.ok) {
        successMessage.value = 'Registrierung erfolgreich! Weiterleitung zum Login...'
        errorMessage.value = ''
  
        // Weiterleitung zur Login-Seite nach erfolgreicher Registrierung
        setTimeout(() => {
          router.push('/login')
        }, 1000)
      } else {
        const errorText = await response.text()
        console.error('Registrierung fehlgeschlagen:', errorText)
  
        errorMessage.value = 'Registrierung fehlgeschlagen! Username könnte bereits vergeben sein.'
        successMessage.value = ''
      }
    } catch (error) {
      console.error('Ein Fehler ist aufgetreten:', error)
      errorMessage.value = 'Serverfehler! Bitte später erneut versuchen.'
    }
  }
  
  // Funktion zur Navigation zur Login-Seite
  const goToLogin = () => {
    router.push('/login')
  }
  </script>