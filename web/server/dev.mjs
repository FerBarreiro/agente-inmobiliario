import { spawn } from 'node:child_process'

const commands = [
  ['node', ['--watch', 'server/index.mjs']],
  ['npm', ['run', 'dev:web']],
]

const children = commands.map(([command, args]) => spawn(command, args, { stdio: 'inherit' }))
const stop = () => children.forEach((child) => child.kill('SIGTERM'))
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
