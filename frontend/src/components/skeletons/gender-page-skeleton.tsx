import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function GenderLookupCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="size-5" />
          <Skeleton className="h-6 w-28" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

function NamesTableRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-9 w-28" />
      </TableCell>
    </TableRow>
  )
}

function NamesTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-36" />
        <div className="pt-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="mt-2 h-4 w-32" />
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
            <NamesTableRowSkeleton />
            <NamesTableRowSkeleton />
            <NamesTableRowSkeleton />
            <NamesTableRowSkeleton />
            <NamesTableRowSkeleton />
            <NamesTableRowSkeleton />
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function GenderPageSkeleton() {
  return (
    <div className="space-y-6">
      <GenderLookupCardSkeleton />
      <NamesTableSkeleton />
    </div>
  )
}

export { GenderPageSkeleton, NamesTableSkeleton }
