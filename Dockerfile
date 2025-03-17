# Base Image with Bun pre-installed
FROM oven/bun:latest

# Set the working directory
WORKDIR /app

# Copy the Source Code
COPY . /app/

# Install the dependencies
RUN bun install

<<<<<<< HEAD
# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh  # Mach die Datei ausführbar

# Set entrypoint script
ENTRYPOINT ["/app/entrypoint.sh"]
=======
# Start the Application
CMD ["bun", "src/app.ts"]
>>>>>>> ee5119c090bfebbfd8b9a55eaa42d75fda5e646e
