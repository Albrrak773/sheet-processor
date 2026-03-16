import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"

function NotFoundPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 p-8">
      <span className="text-8xl">😖</span>
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Page Not Found</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Button asChild size="lg">
        <Link to="/">Go Home</Link>
      </Button>
    </div>
  )
}

export { NotFoundPage }
