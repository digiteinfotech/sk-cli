import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { configSchema, type Config } from './schema.js'

const CONFIG_DIR = join(homedir(), '.config', 'sk-cli')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')

export function getConfigPath(): string {
  return CONFIG_FILE
}

function loadFileConfig(): Partial<Config> {
  if (!existsSync(CONFIG_FILE)) return {}
  try {
    const raw = readFileSync(CONFIG_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function loadEnvConfig(): Partial<Config> {
  const env: Partial<Config> = {}
  if (process.env.SK_SERVER) env.server = process.env.SK_SERVER
  if (process.env.SK_TOKEN) env.token = process.env.SK_TOKEN
  if (process.env.SK_BOARD_ID) env.defaultBoardId = process.env.SK_BOARD_ID
  if (process.env.SK_USER) env.user = process.env.SK_USER
  if (process.env.SK_PASSWORD) env.password = process.env.SK_PASSWORD
  return env
}

export interface CliOverrides {
  server?: string
  token?: string
  boardId?: string
  format?: 'json' | 'table'
}

export function resolveConfig(overrides: CliOverrides = {}): Config {
  const fileConfig = loadFileConfig()
  const envConfig = loadEnvConfig()

  const merged = {
    ...fileConfig,
    ...envConfig,
    ...(overrides.server && { server: overrides.server }),
    ...(overrides.token && { token: overrides.token }),
    ...(overrides.boardId && { defaultBoardId: overrides.boardId }),
    ...(overrides.format && { format: overrides.format }),
  }

  return configSchema.parse(merged)
}

export function saveConfigValue(key: string, value: string): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true })
  }
  const current = loadFileConfig()
  const updated = { ...current, [key]: value }
  writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2) + '\n')
}

export function getConfigValue(key: string): string | undefined {
  const config = loadFileConfig()
  return (config as Record<string, unknown>)[key] as string | undefined
}

export function getAllConfig(): Partial<Config> {
  return loadFileConfig()
}
