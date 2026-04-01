import { Command } from 'commander'
import { RestClient } from '../api/client.js'
import { ApiError } from '../api/types.js'
import { resolveConfig, type CliOverrides } from '../config/index.js'
import { handleError } from '../output/errors.js'
import { output, outputJson, success, type Format, type TableConfig } from '../output/formatter.js'
import { listCards, getCard, createCard, updateCard, deleteCard } from '../services/cards.js'

const cardTableConfig: TableConfig = {
  headers: ['ID', 'Title', 'Column', 'Lane', 'Assigned To'],
  row: (card) => [
    String(card.id ?? ''),
    String(card.title ?? ''),
    String(card.columnId ?? ''),
    String(card.swimlaneId ?? ''),
    String(card.assignedTo ?? ''),
  ],
}

function requireBoardId(opts: CliOverrides & { boardId?: string }, config: { defaultBoardId?: string }): string {
  const boardId = opts.boardId ?? config.defaultBoardId
  if (!boardId) {
    throw new ApiError('VALIDATION_ERROR', 'Board ID is required. Use --board-id or set SK_BOARD_ID / config defaultBoardId')
  }
  return boardId
}

export function registerCardsCommand(program: Command): void {
  const cards = program
    .command('cards')
    .description('Manage SwiftKanban cards')
    .option('--board-id <id>', 'Board ID')

  cards
    .command('list')
    .description('List cards on a board')
    .option('--filter <query>', 'Filter expression')
    .option('--limit <n>', 'Limit results')
    .option('--offset <n>', 'Offset results')
    .action(async (cmdOpts) => {
      try {
        const globalOpts = program.opts() as CliOverrides & { format?: Format }
        const localOpts = cards.opts() as { boardId?: string }
        const config = resolveConfig(globalOpts)
        const client = new RestClient(config)
        const boardId = requireBoardId({ ...globalOpts, ...localOpts }, config)
        const data = await listCards(client, {
          boardId,
          filter: cmdOpts.filter,
          limit: cmdOpts.limit,
          offset: cmdOpts.offset,
        })
        output(globalOpts.format ?? config.format, success(data, { total: data.length }), cardTableConfig)
      } catch (error) {
        handleError(error)
      }
    })

  cards
    .command('get')
    .description('Get card details')
    .argument('<card-id>', 'Card ID')
    .action(async (cardId: string) => {
      try {
        const globalOpts = program.opts() as CliOverrides & { format?: Format }
        const localOpts = cards.opts() as { boardId?: string }
        const config = resolveConfig(globalOpts)
        const client = new RestClient(config)
        const data = await getCard(client, cardId, localOpts.boardId ?? config.defaultBoardId)
        output(globalOpts.format ?? config.format, success(data), cardTableConfig)
      } catch (error) {
        handleError(error)
      }
    })

  cards
    .command('create')
    .description('Create a new card')
    .requiredOption('--title <title>', 'Card title')
    .option('--description <desc>', 'Card description')
    .option('--lane <lane>', 'Swimlane ID')
    .option('--column <column>', 'Column ID')
    .option('--json <payload>', 'Full JSON payload (overrides other flags)')
    .action(async (cmdOpts) => {
      try {
        const globalOpts = program.opts() as CliOverrides & { format?: Format }
        const localOpts = cards.opts() as { boardId?: string }
        const config = resolveConfig(globalOpts)
        const client = new RestClient(config)
        const boardId = requireBoardId({ ...globalOpts, ...localOpts }, config)

        let input: Record<string, unknown>
        if (cmdOpts.json) {
          input = JSON.parse(cmdOpts.json)
        } else {
          input = {
            title: cmdOpts.title,
            ...(cmdOpts.description && { description: cmdOpts.description }),
            ...(cmdOpts.lane && { swimlaneId: cmdOpts.lane }),
            ...(cmdOpts.column && { columnId: cmdOpts.column }),
          }
        }

        const data = await createCard(client, { ...input, boardId, title: input.title as string })
        output(globalOpts.format ?? config.format, success(data), cardTableConfig)
      } catch (error) {
        handleError(error)
      }
    })

  cards
    .command('update')
    .description('Update an existing card')
    .argument('<card-id>', 'Card ID')
    .option('--title <title>', 'New title')
    .option('--description <desc>', 'New description')
    .option('--json <payload>', 'Full JSON payload (overrides other flags)')
    .action(async (cardId: string, cmdOpts) => {
      try {
        const globalOpts = program.opts() as CliOverrides & { format?: Format }
        const config = resolveConfig(globalOpts)
        const client = new RestClient(config)

        let input: Record<string, unknown>
        if (cmdOpts.json) {
          input = JSON.parse(cmdOpts.json)
        } else {
          input = {
            ...(cmdOpts.title && { title: cmdOpts.title }),
            ...(cmdOpts.description && { description: cmdOpts.description }),
          }
        }

        const data = await updateCard(client, cardId, input)
        output(globalOpts.format ?? config.format, success(data), cardTableConfig)
      } catch (error) {
        handleError(error)
      }
    })

  cards
    .command('delete')
    .description('Delete a card')
    .argument('<card-id>', 'Card ID')
    .action(async (cardId: string) => {
      try {
        const globalOpts = program.opts() as CliOverrides & { format?: Format }
        const config = resolveConfig(globalOpts)
        const client = new RestClient(config)
        await deleteCard(client, cardId)
        outputJson(success({ deleted: cardId }))
      } catch (error) {
        handleError(error)
      }
    })
}
