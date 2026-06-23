#!/bin/bash

echo "🐳 Сборка Windows версии через Docker..."
echo ""

docker run --rm -ti \
  --env ELECTRON_CACHE="/root/.cache/electron" \
  --env ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder" \
  -v ${PWD}:/project \
  -v ~/.cache/electron:/root/.cache/electron \
  -v ~/.cache/electron-builder:/root/.cache/electron-builder \
  electronuserland/builder:wine \
  /bin/bash -c "
    cd /project
    echo '📦 Установка зависимостей...'
    npm install
    echo '🔨 Сборка...'
    npm run electron:build:win
  "

echo ""
echo "✅ Готово! Проверьте папку release/"
ls -la release/*.exe 2>/dev/null || echo "Файлы не найдены"