import { createFileRoute } from "@tanstack/react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowUpRight01Icon, Settings01Icon } from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ExternalService {
  id: string
  name: string
  logo: string
  description: string
  mainLink: string
  officialLink: string
  selfHosted?: boolean
}

const EXTERNAL_SERVICES: Array<ExternalService> = [
  {
    id: "github",
    name: "GitHub",
    logo: "/logos/github-logo.png",
    description: "Source code repository and version control.",
    mainLink: "https://github.com/Albrrak773/sheet-processor",
    officialLink: "https://github.com/",
  },
  {
    id: "netlify",
    name: "Netlify",
    logo: "/logos/netlify-logo.png",
    description: "Frontend deployment and hosting platform.",
    mainLink: "https://app.netlify.com/projects/sheet-processor/overview",
    officialLink: "https://www.netlify.com/",
  },
  {
    id: "oracle",
    name: "Oracle Cloud",
    logo: "/logos/oracle-logo.png",
    description: "VPS hosting for the backend API server.",
    mainLink: "https://cloud.oracle.com/compute/instances?region=me-riyadh-1",
    officialLink: "https://www.oracle.com/sa/cloud/",
  },
  {
    id: "infisical",
    name: "Infisical",
    logo: "/logos/infisical-logo.png",
    description:
      "Centralized secret management for GitHub, Netlify, VPS, and local dev.",
    mainLink:
      "https://infisical.albrrak773.com/organizations/de21a8c1-87e7-4f92-9e3b-253791905f8e/projects/secret-management/c27e61cc-58b8-486f-bef3-20ce7e8b5ea8/overview",
    officialLink: "https://infisical.com/",
    selfHosted: true,
  },
  {
    id: "clerk",
    name: "Clerk",
    logo: "/logos/clerk-logo.svg",
    description: "User authentication and session management.",
    mainLink:
      "https://dashboard.clerk.com/apps/app_3AzrhoWPK0wWbZKZPImkR5NhxkK/instances/ins_3B1iKFFwyLitbZ6Jw5nXbX6nnWb",
    officialLink: "https://clerk.com/",
  },
  {
    id: "api-docs",
    name: "API Docs",
    logo: "/logos/fastapi-logo.png",
    description: "Interactive documentation for the backend API endpoints.",
    mainLink: "https://sheet-processor.albrrak773.com/api/docs/",
    officialLink: "https://fastapi.tiangolo.com/",
    selfHosted: true,
  },
  {
    id: "google-cloud",
    name: "Google Cloud",
    logo: "/logos/goog-cloud-log.svg",
    description: "Google OAuth configuration for user sign-in.",
    mainLink:
      "https://console.cloud.google.com/welcome?project=sheet-processor-490412",
    officialLink: "https://cloud.google.com/",
  },
  {
    id: "r2",
    name: "Cloudflare R2",
    logo: "/logos/cloud-flare-logo.jpg",
    description: "Object storage for uploaded files and database backups.",
    mainLink:
      "https://dash.cloudflare.com/805b372c29665f87028c372741b7e04a/r2/default/buckets/sheet-processor",
    officialLink: "https://www.cloudflare.com/developer-platform/products/r2/",
  },
  {
    id: "databasus",
    name: "Databasus",
    logo: "/logos/databasus-logo.svg",
    description: "Automatic database backup service.",
    mainLink: "https://databasus.albrrak773.com/",
    officialLink: "https://databasus.com/",
    selfHosted: true,
  },
]

export const Route = createFileRoute("/admin/")({
  component: AdminPage,
})

function ExternalServiceCard({ service }: { service: ExternalService }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="mb-3 flex h-12 w-full items-center">
          <img
            src={service.logo}
            alt={`${service.name} logo`}
            className="max-h-full max-w-[140px] object-contain"
          />
        </div>
        <CardTitle className="flex items-center gap-2">
          {service.name}
          {service.selfHosted && (
            <Badge variant="default" className="text-[10px]">
              Self Hosted
            </Badge>
          )}
        </CardTitle>
        <CardDescription>{service.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
        <div className="flex items-center gap-3">
          <a
            href={service.mainLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Open Dashboard
            <HugeiconsIcon
              icon={ArrowUpRight01Icon}
              className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </a>
        </div>
      </CardContent>
      <CardFooter>
        <a
          href={service.officialLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground/70 hover:text-muted-foreground hover:underline"
        >
          {new URL(service.officialLink).hostname.replace("www.", "")}
        </a>
      </CardFooter>
    </Card>
  )
}

function AdminPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <HugeiconsIcon icon={Settings01Icon} className="size-6" />
          Admin Panel
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          External services and tools used in this project
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {EXTERNAL_SERVICES.map((service) => (
          <ExternalServiceCard key={service.id} service={service} />
        ))}
      </div>
    </div>
  )
}
