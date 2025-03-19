# Base Image with Bun pre-installed

FROM oven/bun:latest
 
# Set the working directory

WORKDIR /app
 
# Copy the Source Code

COPY . /app/
 
# Install the dependencies

RUN bun install
 
# Copy entrypoint script

COPY entrypoint.sh /app/entrypoint.sh
 
# Debugging: Überprüfen, ob die Datei existiert

RUN ls -la /app/entrypoint.sh
 
# Setze korrekte Zeilenenden und mache die Datei ausführbar

RUN dos2unix /app/entrypoint.sh || true

RUN chmod +x /app/entrypoint.sh
 
# Debugging: Überprüfen, ob die Datei nun ausführbar ist

RUN ls -la /app/entrypoint.sh
 
# Set entrypoint script

ENTRYPOINT ["/app/entrypoint.sh"]
 