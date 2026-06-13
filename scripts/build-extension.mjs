import * as fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = path.join(root, 'extension')
const outDir = path.join(root, 'dist', 'extension')

const SHARED = [
  'background.js',
  'i18n.js',
  'content.js',
  'popup.js',
  'popup.css',
  'popup.html',
  'icons',
  '_locales'
]

function copyRecursive(from, to) {
  const stat = fs.statSync(from)
  if (stat.isDirectory()) {
    fs.mkdirSync(to, { recursive: true })
    for (const entry of fs.readdirSync(from)) {
      copyRecursive(path.join(from, entry), path.join(to, entry))
    }
  } else {
    fs.copyFileSync(from, to)
  }
}

function buildTarget(name, manifestFile) {
  const target = path.join(outDir, name)
  fs.rmSync(target, { recursive: true, force: true })
  fs.mkdirSync(target, { recursive: true })
  for (const item of SHARED) {
    const from = path.join(srcDir, item)
    if (fs.existsSync(from)) copyRecursive(from, path.join(target, item))
  }
  fs.copyFileSync(path.join(srcDir, manifestFile), path.join(target, 'manifest.json'))
  console.log('Build', name, '->', path.relative(root, target))
}

buildTarget('chrome', 'manifest.json')
buildTarget('firefox', 'manifest.firefox.json')
console.log(
  'OK. Charge dist/extension/chrome (Chrome/Edge/Brave) ou dist/extension/firefox (Firefox).'
)
