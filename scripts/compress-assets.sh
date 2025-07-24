#!/bin/bash

TARGET_DIR=$1

if [ -z "$TARGET_DIR" ]; then
  echo "Usage: $0 <target_directory>"
  exit 1
fi


if [ ! -d "$TARGET_DIR" ]; then
  echo "Error: Directory $TARGET_DIR does not exist."
  exit 1
fi

for file in "$TARGET_DIR"/*; do
  if [ -f "$file" ]; then
    gzip -c "$file" > "$file.gz"
    brotli -c "$file" > "$file.br"
  fi
done

echo "Compression completed."
