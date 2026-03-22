import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Shield01Icon,
} from "@hugeicons/core-free-icons"

import type { TokenVerificationResult } from "@/lib/export-token"
import type { TableRowData } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { DataTable } from "@/components/validation/editable-data-table/data-table"
import { verifyExportToken } from "@/lib/export-token"

export const Route = createFileRoute("/admin/token-validator")({
  component: TokenValidatorPage,
})

const PREFERRED_COLUMN_ORDER = [
  "name",
  "university id",
  "phone number",
  "email",
  "gender",
] as const

function reorderColumns(columns: Array<string>): Array<string> {
  const remaining = new Set(columns)
  const ordered: Array<string> = []

  function getCanonicalName(col: string): string {
    const match = col.match(/\(([^)]+)\)$/)
    return match ? match[1].trim().toLowerCase() : col.toLowerCase()
  }

  for (const preferred of PREFERRED_COLUMN_ORDER) {
    const found = columns.find((c) => {
      const canonical = getCanonicalName(c)
      return canonical === preferred
    })
    if (found) {
      ordered.push(found)
      remaining.delete(found)
    }
  }

  return [...ordered, ...columns.filter((c) => remaining.has(c))]
}

function TokenValidatorPage() {
  const [token, setToken] = React.useState("")
  const [result, setResult] = React.useState<TokenVerificationResult | null>(
    null
  )
  const [isVerifying, setIsVerifying] = React.useState(false)

  async function handleVerify() {
    if (!token.trim()) return

    setIsVerifying(true)
    try {
      const verificationResult = await verifyExportToken(token.trim())
      setResult(verificationResult)
    } catch (err) {
      setResult({
        valid: false,
        payload: null,
        error: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  function handleClear() {
    setToken("")
    setResult(null)
  }

  const data: Array<TableRowData> = React.useMemo(() => {
    if (!result?.payload?.data) return []
    return result.payload.data.map((row, index) => ({
      ...row,
      _rowNum: index + 2,
    }))
  }, [result])

  const columnNames = React.useMemo(() => {
    if (!result?.payload?.metadata) return []
    return reorderColumns(result.payload.metadata.columns)
  }, [result])

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <HugeiconsIcon icon={Shield01Icon} className="size-6" />
          Token Validator
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verify export tokens and view their contents
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Token Input</CardTitle>
          <CardDescription>
            Paste the export token to verify its authenticity and view the data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Textarea
              placeholder="Paste export token here..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              rows={2}
              className="overflow-x-auto font-mono text-xs whitespace-nowrap"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleVerify}
                disabled={!token.trim() || isVerifying}
              >
                {isVerifying ? "Verifying..." : "Verify Token"}
              </Button>
              <Button variant="outline" onClick={handleClear}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.valid ? (
                  <>
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      className="size-5 text-green-600"
                      strokeWidth={2}
                    />
                    <span>Token Valid</span>
                  </>
                ) : (
                  <>
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      className="size-5 text-red-600"
                      strokeWidth={2}
                    />
                    <span>Token Invalid</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.valid && result.payload ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Source
                    </p>
                    <p className="text-lg font-semibold">
                      {result.payload.metadata.source}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Status
                    </p>
                    <p className="text-lg font-semibold">
                      {result.payload.metadata.valid ? (
                        <span className="text-green-600">Validated</span>
                      ) : (
                        <span className="text-amber-600">Had Issues</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Row Count
                    </p>
                    <p className="text-lg font-semibold">
                      {result.payload.metadata.row_count}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Validated At
                    </p>
                    <p className="text-lg font-semibold">
                      {new Date(
                        result.payload.metadata.validated_at
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-red-600">
                  {result.error ?? "Verification failed"}
                </p>
              )}
            </CardContent>
          </Card>

          {result.valid && result.payload && (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Columns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.payload.metadata.columns.map((col) => (
                      <span
                        key={col}
                        className="rounded-md bg-muted px-2 py-1 text-sm font-medium"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    Data ({result.payload.data.length} rows)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable
                    data={data}
                    columnNames={columnNames}
                    invalidRows={[]}
                    duplicateRows={[]}
                    onCellEdit={() => {}}
                    onRowDelete={undefined}
                    showUniIdLookup={false}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}
