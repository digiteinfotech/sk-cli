import { Command } from 'commander'
import { RestClient } from '../api/client.js'
import { ApiError } from '../api/types.js'
import { resolveConfig, type CliOverrides } from '../config/index.js'
import { handleError } from '../output/errors.js'
import { output, outputJson, success, type Format, type TableConfig } from '../output/formatter.js'
import { listCards, getCard, createCard, updateCard, deleteCard } from '../services/cards.js'

const cardTableConfig: TableConfig = {
  headers: ['ID', 'Card #', 'Name', 'Queue', 'Lane', 'Owner', 'State'],
  row: (card) => [
    String(card.id ?? ''),
    String(card.cardNumber ?? ''),
    String(card.name ?? ''),
    String(card.currentQueue ?? ''),
    String(card.currentSwimName ?? ''),
    String(card.currentOwner ?? ''),
    String(card.currentState ?? ''),
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
        const boardId = requireBoardId({ ...globalOpts, ...localOpts }, config)
        const data = await getCard(client, boardId, cardId)
        output(globalOpts.format ?? config.format, success(data), cardTableConfig)
      } catch (error) {
        handleError(error)
      }
    })

  cards
    .command('create')
    .description('Create a new card')
    .requiredOption('--name <name>', 'Card name')
    .option('--description <desc>', 'Card description')
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
            name: cmdOpts.name,
            ...(cmdOpts.description && { description: cmdOpts.description }),
          }
        }

        const data = await createCard(client, boardId, { ...input, name: input.name as string })
        output(globalOpts.format ?? config.format, success(data), cardTableConfig)
      } catch (error) {
        handleError(error)
      }
    })

  cards
    .command('update')
    .description('Update an existing card')
    .argument('<card-id>', 'Card ID')
    .option('--name <name>', 'New name')
    .option('--description <desc>', 'New description')
    .option('--json <payload>', 'Full JSON payload (overrides other flags)')
    .action(async (cardId: string, cmdOpts) => {
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
            ...(cmdOpts.name && { name: cmdOpts.name }),
            ...(cmdOpts.description && { description: cmdOpts.description }),
          }
        }

        const data = await updateCard(client, boardId, cardId, input)
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
        const localOpts = cards.opts() as { boardId?: string }
        const config = resolveConfig(globalOpts)
        const client = new RestClient(config)
        const boardId = requireBoardId({ ...globalOpts, ...localOpts }, config)
        await deleteCard(client, boardId, cardId)
        outputJson(success({ deleted: cardId }))
      } catch (error) {
        handleError(error)
      }
    })
}
