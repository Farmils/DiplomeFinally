import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sourceDir = path.join(__dirname, '..', 'electron', 'extensions', 'metamask')
const distDir = path.join(__dirname, '..', 'release', 'extensions', 'metamask')

console.log('📦 Копирование MetaMask расширения...')
console.log('Откуда:', sourceDir)
console.log('Куда:', distDir)

if (!fs.existsSync(sourceDir)) {
    console.error('❌ Исходная папка не найдена!')
    console.log('Скачайте MetaMask и распакуйте в electron/extensions/metamask/')
    process.exit(1)
}

// Создаем папку назначения
fs.mkdirSync(distDir, { recursive: true })

// Копируем файлы
function copyFolder(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true })
    }

    const entries = fs.readdirSync(src, { withFileTypes: true })

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name)
        const destPath = path.join(dest, entry.name)

        if (entry.isDirectory()) {
            copyFolder(srcPath, destPath)
        } else {
            fs.copyFileSync(srcPath, destPath)
        }
    }
}

copyFolder(sourceDir, distDir)
console.log('✅ MetaMask скопирован!')