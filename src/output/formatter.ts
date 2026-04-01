import Table from 'cli-table3'

export interface SuccessResult<T> {
  ok: true
  data: T
  meta?: Record<string, unknown>
}

export interface ErrorResult {
  ok: false
  error: {
    code: string
    message: string
    status?: number
  }
}

export type Result<T> = SuccessResult<T> | ErrorResult

export function success<T>(data: T, meta?: Record<string, unknown>): SuccessResult<T> {
  return { ok: true, data, ...(meta && { meta }) }
}

export function failure(code: string, message: string, status?: number): ErrorResult {
  return { ok: false, error: { code, message, ...(status && { status }) } }
}

export function outputJson<T>(result: Result<T>): void {
  const stream = result.ok ? process.stdout : process.stderr
  stream.write(JSON.stringify(result, null, 2) + '\n')
}

export function outputTable(headers: string[], rows: string[][]): void {
  const table = new Table({ head: headers })
  for (const row of rows) {
    table.push(row)
  }
  process.stdout.write(table.toString() + '\n')
}

export type Format = 'json' | 'table'

export interface TableConfig {
  headers: string[]
  row: (item: Record<string, unknown>) => string[]
}

export function output<T>(
  format: Format,
  result: Result<T>,
  tableConfig?: TableConfig,
): void {
  if (format === 'table' && result.ok && tableConfig) {
    const items = Array.isArray(result.data) ? result.data : [result.data]
    const rows = (items as Record<string, unknown>[]).map(tableConfig.row)
    outputTable(tableConfig.headers, rows)
    return
  }
  outputJson(result)
}
