# Minitwitter
Dies ist eine Arbeit von:

- Kim
- Nevzat
- Kilian

# Arbeitsaufteilung
Die Arbeiten dieses Projektes wurden laufend verteilt.
Es gab keine fixe zuteilungen um möglichste Flexible reagieren zu können.

Die Änderungen lassens sich anhand der Commits in Github nachverfolgen.

# Verwendungsanleitung
- ## Start
    1. Docker compose build
    2. Docker compose up
- ## Verwendung
    1. Die Webpage ist unter localhost:80 erreichbar
    2. Unter Login > Register kann ein User erstellt werden
    3. Anschliessend kann sicher der User unter Login einloggen
    4. Auf der Main Page können nun Posts erstellt werden -> erstellte Posts können bei bedarf bearbeite oder gelöscht werden
## Admin Page
    1. Ein Haupt Admin wird automatisch erstellt -> Login (admin/admin)
    2. Wer sich als Admin anmeldet erhält auf der Main Page einen neuen Reiter (oben Rechts -> Admin Bereich)
    3. In der Admin übersicht können Benutzer oder Beiträge von allen Usern entfernt werden.

# Aufbau
![softwarearchitektur](https://github.com/user-attachments/assets/6ba84eca-1e8a-4c96-bdf4-68a946b3d185)

# Minitwitter
Dies ist eine Arbeit von:

- Kim
- Nevzat
- Kilian

# Arbeitsaufteilung
Die Arbeiten dieses Projektes wurden laufend verteilt.
Es gab keine fixe zuteilungen um möglichste Flexible reagieren zu können.

Die Änderungen lassens sich anhand der Commits in Github nachverfolgen.

# Verwendungsanleitung

# Aufbau

## Code-Richtlinien

### Projektstruktur & Modularität
- **Klare Trennung der Verantwortlichkeiten**:
  - `api/` → Enthält alle API-Endpunkte (z. B. `auth.ts`, `posts.ts`, `admin.ts`).
  - `db/` → Datenbankschema und Queries.
  - `services/` → Allgemeine Services wie Logging (`logger.ts`), Caching (`cache.ts`).
  - `message-broker/` → Nachrichtenverarbeitung für asynchrone Aufgaben.
  - `frontend/` → Vue 3 + Nuxt 3 basiertes Frontend mit einer **klaren Komponentenstruktur**.

### Clean Code & Best Practices
- **Sprechende Variablen- und Funktionsnamen** (`getPosts()`, `initializeCache()`).
- **Einheitliche Benennung**:
  - **CamelCase** für Variablen und Funktionen (`userId`, `getUserPosts()`).
  - **Kebab-case** für API-Endpunkte (`/api/posts`, `/api/auth/login`).
  - **SCREAMING_SNAKE_CASE** für Umgebungsvariablen (`JWT_SECRET`, `REDIS_HOST`).

### TypeScript & Sicherheit
- **Alle Variablen und Funktionen sind typisiert**, z. B.:
  ```ts
  const getUserById = async (id: number): Promise<User | null> => { ... }
  ```
- **Fehlertoleranz & Logging**:
  - **Alle API-Endpunkte haben Try-Catch-Blöcke**.
  - **Wichtige Ereignisse werden geloggt** (Erfolgreiche Logins, Fehlerhafte Anfragen).

### Datenbank (Drizzle ORM + PostgreSQL)
- **Trennung zwischen Schema und Queries** (`db/schema.ts`, `database.ts`).
- **Alle Queries laufen über Drizzle ORM**, z. B.:
  ```ts
  const users = await db.select().from(usersTable).where(eq(usersTable.username, 'admin'))
  ```
- **Migrationsprozess wird automatisch durchgeführt**, wenn das Backend startet.

### API & Authentifizierung
- **JWT-Authentifizierung für alle geschützten Routen**.
- **Middleware für Zugriffskontrolle**, z. B. Admin-Check:
  ```ts
  app.use('/api/admin', authMiddleware, isAdminMiddleware)
  ```
- **CORS aktiviert**, um API-Calls von externen Frontends zu erlauben.

### Caching & Performance
- **Redis für Caching von häufigen API-Anfragen** (`getPosts()`).
- **Routen, die Daten ändern (`POST, PUT, DELETE`), invalidieren den Cache**.
- **Rate-Limiting aktiv**, um API-Missbrauch zu verhindern.

### Frontend (Vue 3 + Nuxt 3)
- **Komponenten werden modular aufgebaut (`components/`)**.
- **Seitenstruktur:**  
  - `pages/index.vue` → Hauptseite  
  - `pages/login.vue` → Login  
  - `pages/register.vue` → Registrierung  
- **Zustandsmanagement über lokale Variablen + `localStorage` für Auth-Daten**.

### Logging & Fehlerbehandlung
- **Alle Fehler werden im `logger.ts` geloggt**.
- **Verwenden von Debug- und Info-Logs für wichtige Abläufe**:
  ```ts
  logger.debug('Fetching posts from cache...')
  ```
- **Fehlermeldungen sind standardisiert** (`500 - Serverfehler`, `401 - Nicht autorisiert`).

---
 **Diese Richtlinien stellen sicher, dass unser Code sauber, sicher und skalierbar bleibt.** 







