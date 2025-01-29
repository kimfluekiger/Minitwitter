<template>
  <div class="flex flex-col min-h-screen">
    <Header />
    <main class="flex-grow">
      <div class="max-w-6xl mx-auto p-4 w-full">
        <slot />
      </div>
    </main>
    <Footer />
  </div>
</template>
