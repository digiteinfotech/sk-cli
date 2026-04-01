import { Command } from 'commander'
import { RestClient } from '../api/client.js'
import { resolveConfig, type CliOverrides } from '../config/index.js'
import { handleError } from '../output/errors.js'
import { output, success, type Format, type TableConfig } from '../output/formatter.js'
import { listBoards, getBoard } from '../services/boards.js'

const boardTableConfig: TableConfig = {
  headers: ['ID', 'Name', 'Description'],
  row: (board) => [String(board.id ?? ''), String(board.name ?? ''), String(board.description ?? '')],
}

export function registerBoardsCommand(program: Command): void {
  const boards = program
    .command('boards')
    .description('Manage SwiftKanban boards')

  boards
    .command('list')
    .description('List all boards')
    .action(async () => {
      try {
        const opts = program.opts() as CliOverrides & { format?: Format }
        const config = resolveConfig(opts)
        const client = new RestClient(config)
        const data = await listBoards(client)
        output(opts.format ?? config.format, success(data, { total: data.length }), boardTableConfig)
      } catch (error) {
        handleError(error)
      }
    })

  boards
    .command('get')
    .description('Get a specific board')
    .argument('<board-id>', 'Board ID')
    .action(async (boardId: string) => {
      try {
        const opts = program.opts() as CliOverrides & { format?: Format }
        const config = resolveConfig(opts)
        const client = new RestClient(config)
        const data = await getBoard(client, boardId)
        output(opts.format ?? config.format, success(data), boardTableConfig)
      } catch (error) {
        handleError(error)
      }
    })
}
