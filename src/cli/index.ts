import { Command } from 'commander'
import { registerBoardsCommand } from './boards.js'
import { registerCardsCommand } from './cards.js'
import { registerConfigCommand } from './config-cmd.js'

export function createProgram(): Command {
  const program = new Command()

  program
    .name('sk')
    .description('SwiftKanban CLI — interact with SwiftKanban from the command line')
    .version('0.1.0')
    .option('--format <format>', 'Output format: json or table', 'json')
    .option('--server <url>', 'SwiftKanban server URL')
    .option('--token <token>', 'Auth token (JWT)')
    .option('--verbose', 'Enable debug logging to stderr')

  registerConfigCommand(program)
  registerBoardsCommand(program)
  registerCardsCommand(program)

  return program
}
