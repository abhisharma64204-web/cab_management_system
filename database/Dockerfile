FROM mysql:8.0

# Copy schema and seed data into the Docker initialization directory
# They will be automatically executed in alphabetical order upon container creation
COPY schema.sql /docker-entrypoint-initdb.d/01-schema.sql
COPY seed.sql /docker-entrypoint-initdb.d/02-seed.sql

EXPOSE 3306

