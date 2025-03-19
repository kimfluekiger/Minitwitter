# Dockerfile für den Minitwitter-Container

# Basis-Image mit vorinstalliertem Bun verwenden
FROM oven/bun:latest
 
# Arbeitsverzeichnis für den Container setzen
WORKDIR /app
 
# Den gesamten Quellcode in das Arbeitsverzeichnis im Container kopieren
COPY . /app/
 
# Hier werden alle Abhängigkeiten mit Bun installiert
RUN bun install
 
# Das Entrypoint-Skript in das Arbeitsverzeichnis kopieren
COPY entrypoint.sh /app/entrypoint.sh
 
# Hier wird überprüft, ob die Datei korrekt kopiert wurde
RUN ls -la /app/entrypoint.sh
 
# Zeilenenden umwandeln, um mögliche Probleme mit Windows-Formatierung zu vermeiden
RUN dos2unix /app/entrypoint.sh || true

# Das Skript ausführbar machen
RUN chmod +x /app/entrypoint.sh
 
# Hier wird überprüft, ob die Datei nun tatsächlich ausführbar ist
RUN ls -la /app/entrypoint.sh
 
# Das Entrypoint-Skript wird beim Start des Containers ausgeführt
ENTRYPOINT ["/app/entrypoint.sh"]