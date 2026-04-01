import { Command } from 'commander'
import { resolveConfig, saveConfigValue, type CliOverrides } from '../config/index.js'
import { handleError } from '../output/errors.js'
import { outputJson, success } from '../output/formatter.js'
import { login } from '../services/auth.js'

export function registerLoginCommand(program: Command): void {
  program
    .command('login')
    .description('Authenticate with SwiftKanban and store the token')
    .option('-u, --user <email>', 'Login email')
    .option('-p, --password <password>', 'Login password')
    .action(async (cmdOpts: { user?: string; password?: string }) => {
      try {
        const opts = program.opts() as CliOverrides
        const config = resolveConfig(opts)

        const user = cmdOpts.user ?? config.user
        const password = cmdOpts.password ?? config.password
        const server = config.server

        if (!user || !password) {
          throw new Error(
            'CONFIG: Missing credentials. Provide --user and --password flags, ' +
            'or set SK_USER/SK_PASSWORD env vars, ' +
            'or run: sk config set user <email> && sk config set password <password>',
          )
        }

        process.stderr.write(`Authenticating as ${user} against ${server}...\n`)

        const result = await login(server, user, password)

        saveConfigValue('token', result.token)
        process.stderr.write(`Logged in as ${result.user.firstName} ${result.user.lastName} (${result.user.email})\n`)
        process.stderr.write('Token saved to config.\n')

        outputJson(success({
          user: result.user,
          tokenStored: true,
        }))
      } catch (error) {
        handleError(error)
      }
    })
}
