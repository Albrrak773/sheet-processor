import { Link, createFileRoute } from "@tanstack/react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Settings01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/admin/")({
  component: AdminPage,
})

function AdminPage() {
  return (
    <div className="container mx-auto flex min-h-[80vh] flex-col items-center justify-center gap-6 px-4 py-8">
      <span className="text-8xl">🚧</span>
      <div className="text-center">
        <h1 className="flex items-center justify-center gap-2 text-4xl font-bold tracking-tight">
          <HugeiconsIcon icon={Settings01Icon} className="size-9" />
          Admin Panel
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          The Admin Panel is currently being built. Check back soon!
        </p>
      </div>
      <Button asChild size="lg">
        <Link to="/">Go Home</Link>
      </Button>
    </div>
  )
}
