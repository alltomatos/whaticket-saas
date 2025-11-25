#!/bin/sh

echo "Waiting for database..."
# Simple wait loop (could be improved with wait-for-it)
sleep 10

echo "Running migrations..."
npx sequelize db:migrate

echo "Running seeds..."
npx sequelize db:seed:all

echo "Starting application..."
exec node dist/server.js
