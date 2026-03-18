import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function MembersTableRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24 font-mono" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-40" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-28" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-14 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-8" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-28" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-12 rounded-full" />
      </TableCell>
    </TableRow>
  )
}

function MembersTableSkeleton() {
  return (
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
        <MembersTableRowSkeleton />
        <MembersTableRowSkeleton />
        <MembersTableRowSkeleton />
        <MembersTableRowSkeleton />
        <MembersTableRowSkeleton />
        <MembersTableRowSkeleton />
        <MembersTableRowSkeleton />
        <MembersTableRowSkeleton />
      </TableBody>
    </Table>
  )
}

export { MembersTableSkeleton }
