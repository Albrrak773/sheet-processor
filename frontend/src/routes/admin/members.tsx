import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { SignInButton } from "@clerk/tanstack-react-start"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AlertCircleIcon,
  Search01Icon,
  UserSearch01Icon,
} from "@hugeicons/core-free-icons"

import type { MemberRead } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listMembers } from "@/lib/api-client"
import { MembersTableSkeleton } from "@/components/skeletons/members-page-skeleton"
import { useIsAdmin } from "@/hooks/use-role"

export const Route = createFileRoute("/admin/members")({
  component: MembersPage,
})

const PAGE_SIZE = 100

function AccessDenied() {
  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-8">
      <Card className="max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
            <HugeiconsIcon
              icon={AlertCircleIcon}
              className="size-8 text-destructive"
            />
          </div>
          <CardTitle>Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This page requires administrator privileges. Please sign in with an
            admin account to view member data.
          </p>
          <SignInButton mode="modal">
            <Button>Sign In</Button>
          </SignInButton>
        </CardContent>
      </Card>
    </div>
  )
}

function MembersContent() {
  const [search, setSearch] = React.useState("")
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE)

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: listMembers,
  })

  const filteredMembers = React.useMemo(() => {
    if (!search.trim()) return members

    const searchLower = search.toLowerCase()
    return members.filter((m: MemberRead) => {
      return (
        m.name.toLowerCase().includes(searchLower) ||
        m.uni_id.toLowerCase().includes(searchLower) ||
        m.email?.toLowerCase().includes(searchLower) ||
        m.phone_number?.toLowerCase().includes(searchLower) ||
        m.uni_college.toLowerCase().includes(searchLower) ||
        m.gender.toLowerCase().includes(searchLower) ||
        String(m.uni_level).includes(searchLower)
      )
    })
  }, [members, search])

  // Reset visible count when search changes
  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [search])

  const visibleMembers = filteredMembers.slice(0, visibleCount)
  const hasMore = filteredMembers.length > visibleCount

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <HugeiconsIcon icon={UserSearch01Icon} className="size-6" />
        Search Members
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={Search01Icon} className="size-5" />
            Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by name, ID, email, phone, college, gender, or level..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
          <p className="mt-2 text-sm text-muted-foreground">
            {filteredMembers.length} of {members.length} members
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <MembersTableSkeleton />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>University ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>College</TableHead>
                  <TableHead>Authenticated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleMembers.map((member: MemberRead) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {member.uni_id}
                    </TableCell>
                    <TableCell className="text-xs">
                      {member.email || "-"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {member.phone_number || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          member.gender === "Male" ? "default" : "secondary"
                        }
                      >
                        {member.gender}
                      </Badge>
                    </TableCell>
                    <TableCell>{member.uni_level}</TableCell>
                    <TableCell className="max-w-32 truncate text-xs">
                      {member.uni_college}
                    </TableCell>
                    <TableCell>
                      {member.is_authenticated ? (
                        <Badge variant="default">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredMembers.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground"
                    >
                      {search
                        ? "No members found matching your search"
                        : "No members found"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={handleLoadMore}>
            Load More ({filteredMembers.length - visibleCount} remaining)
          </Button>
        </div>
      )}
    </div>
  )
}

function MembersPage() {
  const isAdmin = useIsAdmin()

  if (!isAdmin) {
    return <AccessDenied />
  }

  return <MembersContent />
}
