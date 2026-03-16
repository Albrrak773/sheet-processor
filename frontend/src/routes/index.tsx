import { createFileRoute } from "@tanstack/react-router"
import { DataInput } from "@/components/data-input/data-input"

export const Route = createFileRoute("/")({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">New Session</h1>
        <p className="text-sm text-muted-foreground">
          Validate and clean your spreadsheet data
        </p>
      </div>

      <DataInput />
    </div>
  )
}
