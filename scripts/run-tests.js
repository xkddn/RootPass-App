import { spawnSync } from 'child_process'

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: true })
  if (result.error) throw result.error
  return result.status ?? 1
}

const vitestArgs = process.argv.slice(2)

run('npm', ['rebuild', 'better-sqlite3'])

let exitCode = 1
try {
  exitCode = run('npx', ['vitest', ...vitestArgs])
} finally {
  run('npx', ['electron-rebuild', '-f', '-w', 'better-sqlite3'])
}

process.exit(exitCode)

