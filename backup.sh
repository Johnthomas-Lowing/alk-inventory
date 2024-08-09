#!/bin/bash

# Set the timestamp for the backup folder
TIMESTAMP=$(date +"%F")

# Set the directory where backups will be stored
BACKUP_DIR="backups/$TIMESTAMP"

# MongoDB Atlas connection string
MONGO_URI="mongodb+srv://JohnthomasLowing:admin@inventory-cluster.f9rawfp.mongodb.net/?retryWrites=true&w=majority&appName=inventory-cluster"

echo "Starting backup at $(date)"

# Create the backup directory
mkdir -p "$BACKUP_DIR"

# Perform the backup
echo "Running mongodump..."
mongodump --uri "$MONGO_URI" --out "$BACKUP_DIR"

echo "Backup completed successfully at $(date)"

# Optional: compress the backup directory
tar -czvf "$BACKUP_DIR.tar.gz" -C "$BACKUP_DIR" .

# Optional: remove the uncompressed backup directory after compression
rm -rf "$BACKUP_DIR"

echo "Backup and compression completed successfully at $(date)"

# Pause to keep the terminal open
echo "Press [Enter] to close."
read
