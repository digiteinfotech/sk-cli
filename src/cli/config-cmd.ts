import { Command } from 'commander'
import { getAllConfig, getConfigPath, getConfigValue, saveConfigValue } from '../config/index.js'
import { configKeys } from '../config/schema.js'
import { outputJson, success } from '../output/formatter.js'

export function registerConfigCommand(program: Command): void {
  const config = program
    .command('config')
    .description('Manage sk-cli configuration')

  config
    .command('set')
    .description('Set a configuration value')
    .argument('<key>', `Config key (${configKeys.join(', ')})`)
    .argument('<value>', 'Config value')
    .action((key: string, value: string) => {
      saveConfigValue(key, value)
      outputJson(success({ key, value: key === 'token' || key === 'password' ? '***' : value }))
    })

  config
    .command('get')
    .description('Get a configuration value')
    .argument('<key>', 'Config key')
    .action((key: string) => {
      const value = getConfigValue(key)
      if (value === undefined) {
        outputJson(success({ key, value: null }))
      } else {
        const display = key === 'token' || key === 'password'
          ? value.slice(0, 8) + '...'
          : value
        outputJson(success({ key, value: display }))
      }
    })

  config
    .command('show')
    .description('Show all configuration (secrets redacted)')
    .action(() => {
      const all = getAllConfig()
      const redacted = { ...all } as Record<string, unknown>
      if (redacted.token && typeof redacted.token === 'string') {
        redacted.token = redacted.token.slice(0, 8) + '...'
      }
      if (redacted.password && typeof redacted.password === 'string') {
        redacted.password = '***'
      }
      outputJson(success({ path: getConfigPath(), config: redacted }))
    })
}
