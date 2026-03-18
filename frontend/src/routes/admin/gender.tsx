import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, UserGroupIcon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import type { GenderLookupResult, GenderValue, NameRead } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  listNames,
  lookupGenderNames,
  updateNameGender,
} from "@/lib/api-client"
import { NamesTableSkeleton } from "@/components/skeletons/gender-page-skeleton"
import { useIsAdmin } from "@/hooks/use-role"

export const Route = createFileRoute("/admin/gender")({
  component: GenderPage,
})

const PAGE_SIZE = 200

function GenderLookupCard() {
  const [searchInput, setSearchInput] = React.useState("")
  const [results, setResults] = React.useState<Array<GenderLookupResult>>([])
  const [isSearching, setIsSearching] = React.useState(false)

  const handleSearch = async () => {
    if (!searchInput.trim()) return
    setIsSearching(true)
    try {
      const data = await lookupGenderNames(searchInput)
      setResults(data)
    } catch {
      toast.error("Failed to lookup gender")
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HugeiconsIcon icon={Search01Icon} className="size-5" />
          Lookup Gender
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter name(s) to lookup..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button
            onClick={handleSearch}
            disabled={isSearching || !searchInput.trim()}
          >
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="rounded-lg border p-4">
            <h4 className="mb-3 font-medium">Results</h4>
            <div className="space-y-2">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded bg-muted/50 px-3 py-2"
                >
                  <span className="font-medium">{result.name}</span>
                  <div className="flex items-center gap-2">
                    {result.gender ? (
                      <>
                        <Badge
                          variant={
                            result.gender === "Male" ? "default" : "secondary"
                          }
                        >
                          {result.gender}
                        </Badge>
                        {result.is_ambiguous && (
                          <Badge variant="outline" className="text-amber-600">
                            Ambiguous
                          </Badge>
                        )}
                      </>
                    ) : (
                      <Badge variant="destructive">Not Found</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function NamesTable() {
  const queryClient = useQueryClient()
  const isAdmin = useIsAdmin()
  const [filter, setFilter] = React.useState("")
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE)

  const { data: names = [], isLoading } = useQuery({
    queryKey: ["names"],
    queryFn: listNames,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, gender }: { id: number; gender: GenderValue }) =>
      updateNameGender(id, gender),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["names"] })
      toast.success("Gender updated")
    },
    onError: () => {
      toast.error("Failed to update gender")
    },
  })

  const filteredNames = React.useMemo(() => {
    if (!filter.trim()) return names
    const filterLower = filter.toLowerCase()
    return names.filter(
      (n: NameRead) =>
        n.name.toLowerCase().includes(filterLower) ||
        n.gender.toLowerCase().includes(filterLower)
    )
  }, [names, filter])

  // Reset visible count when filter changes
  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [filter])

  const visibleNames = filteredNames.slice(0, visibleCount)
  const hasMore = filteredNames.length > visibleCount

  const handleGenderChange = (id: number, gender: GenderValue) => {
    updateMutation.mutate({ id, gender })
  }

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE)
  }

  if (isLoading) {
    return <NamesTableSkeleton />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Names Database</CardTitle>
        <div className="pt-2">
          <Input
            placeholder="Filter by name or gender..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
          <p className="mt-2 text-sm text-muted-foreground">
            {filteredNames.length} of {names.length} names
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-32">Gender</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleNames.map((name: NameRead) => (
              <TableRow key={name.id}>
                <TableCell className="font-medium">{name.name}</TableCell>
                <TableCell>
                  {isAdmin ? (
                    <Select
                      value={name.gender}
                      onValueChange={(v) =>
                        handleGenderChange(name.id, v as GenderValue)
                      }
                      disabled={updateMutation.isPending}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      variant={name.gender === "Male" ? "default" : "secondary"}
                    >
                      {name.gender}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filteredNames.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="text-center text-muted-foreground"
                >
                  {filter
                    ? "No names found matching your filter"
                    : "No names in database"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      {hasMore && (
        <div className="flex justify-center border-t p-4">
          <Button variant="outline" onClick={handleLoadMore}>
            Load More ({filteredNames.length - visibleCount} remaining)
          </Button>
        </div>
      )}
    </Card>
  )
}

function GenderPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <HugeiconsIcon icon={UserGroupIcon} className="size-6" />
        Find Gender
      </h1>
      <div className="space-y-6">
        <GenderLookupCard />
        <NamesTable />
      </div>
    </div>
  )
}
