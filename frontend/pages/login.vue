<template>
    <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 class="text-3xl font-bold mb-6">Login</h1>
  
      <!-- Anzeige einer Fehlermeldung bei fehlerhafter Anmeldung -->
      <div v-if="errorMessage" class="bg-red-500 text-white p-2 rounded mb-4">
        {{ errorMessage }}
      </div>
  
      <!-- Anzeige einer Erfolgsmeldung nach erfolgreicher Anmeldung -->
      <div v-if="successMessage" class="bg-green-500 text-white p-2 rounded mb-4">
        {{ successMessage }}
      </div>
  
      <!-- Login-Formular -->
      <form @submit.prevent="login" class="w-full max-w-sm">
        <div class="mb-4">
          <!-- Eingabefeld für den Benutzernamen -->
          <label class="block text-gray-700 text-sm font-bold mb-2" for="username">
            Username
          </label>
          <input v-model="username" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="username" type="text" placeholder="Username">
        </div>
        <div class="mb-6">
          <!-- Eingabefeld für das Passwort -->
          <label class="block text-gray-700 text-sm font-bold mb-2" for="password">
            Password
          </label>
          <input v-model="password" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" id="password" type="password" placeholder="Password">
        </div>
        <div class="flex items-center justify-between">
          <!-- Button zum Absenden des Login-Formulars -->
          <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
            Login
          </button>
        </div>
      </form>
  
      <!-- Navigationsoption zur Registrierungsseite -->
      <div class="mt-4">
        <p class="text-gray-600">Noch kein Konto?</p>
        <button @click="goToRegister" class="mt-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Registrieren
        </button>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useRuntimeConfig } from '#imports'
  
  // Reaktive Variablen für Benutzereingaben und Nachrichten
  const username = ref('')
  const password = ref('')
  const router = useRouter()
  const config = useRuntimeConfig()
  
  const errorMessage = ref('') // Speichert Fehlermeldungen
  const successMessage = ref('') // Speichert Erfolgsmeldungen
  
  // Funktion zur Authentifizierung des Nutzers
  const login = async () => {
    try {
      console.log('Sende Login-Request an:', `${config.public.apiBase}/api/auth/login`);

      const response = await fetch(`${config.public.apiBase}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.value, password: password.value }),
      });

      console.log('Server Response:', response);

      if (response.ok) {
        const data = await response.json();
        console.log('Empfangener Token:', data.token);

        // Speichert den Token und den Admin-Status in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('isAdmin', data.isAdmin ? 'true' : 'false'); 

        successMessage.value = 'Login erfolgreich!';
        errorMessage.value = '';

        // **Erst zur Startseite navigieren**
        router.push('/');

        // **Dann nach 500ms ein Reload erzwingen, um die Session zu aktualisieren**
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        const errorText = await response.text();
        console.error('Login fehlgeschlagen:', errorText);

        errorMessage.value = 'Login fehlgeschlagen! Bitte überprüfe deine Anmeldedaten.';
        successMessage.value = '';
      }
    } catch (error) {
      console.error('Ein Fehler ist aufgetreten:', error);
      errorMessage.value = 'Serverfehler! Bitte später erneut versuchen.';
    }
  };
  
  // Funktion, um zur Registrierungsseite zu navigieren
  const goToRegister = () => {
    router.push('/register')
  }
  </script>