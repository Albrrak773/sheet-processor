import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Delete01Icon,
  PencilEdit01Icon,
  TextIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import type {
  GenderAliasRead,
  GenderValue,
  Header,
  HeaderAliasRead,
} from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  createAlias,
  createGenderAlias,
  deleteGenderAlias,
  deleteHeaderAlias,
  fetchHeaders,
  listGenderAliases,
  listHeaderAliases,
  updateGenderAlias,
  updateHeaderAlias,
} from "@/lib/api-client"
import {
  GenderAliasesTabSkeleton,
  HeaderAliasesTabSkeleton,
} from "@/components/skeletons/aliases-page-skeleton"

export const Route = createFileRoute("/admin/aliases")({
  component: AliasesPage,
})

function HeaderAliasesTab() {
  const queryClient = useQueryClient()
  const [newAlias, setNewAlias] = React.useState("")
  const [selectedHeader, setSelectedHeader] = React.useState("")
  const [deleteTarget, setDeleteTarget] =
    React.useState<HeaderAliasRead | null>(null)
  const [editTarget, setEditTarget] = React.useState<HeaderAliasRead | null>(
    null
  )
  const [editValue, setEditValue] = React.useState("")

  const { data: aliases = [], isLoading: aliasesLoading } = useQuery({
    queryKey: ["header-aliases"],
    queryFn: listHeaderAliases,
  })

  const { data: headers = [] } = useQuery({
    queryKey: ["headers"],
    queryFn: fetchHeaders,
  })

  const createMutation = useMutation({
    mutationFn: ({ header, alias }: { header: string; alias: string }) =>
      createAlias(header, alias),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["header-aliases"] })
      setNewAlias("")
      setSelectedHeader("")
      toast.success("Alias created")
    },
    onError: () => {
      toast.error("Failed to create alias")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteHeaderAlias,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["header-aliases"] })
      setDeleteTarget(null)
      toast.success("Alias deleted")
    },
    onError: () => {
      toast.error("Failed to delete alias")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, aliasName }: { id: number; aliasName: string }) =>
      updateHeaderAlias(id, aliasName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["header-aliases"] })
      setEditTarget(null)
      setEditValue("")
      toast.success("Alias updated")
    },
    onError: () => {
      toast.error("Failed to update alias")
    },
  })

  const handleCreate = () => {
    if (!selectedHeader || !newAlias.trim()) return
    createMutation.mutate({ header: selectedHeader, alias: newAlias.trim() })
  }

  const handleEdit = (alias: HeaderAliasRead) => {
    setEditTarget(alias)
    setEditValue(alias.alias_name)
  }

  const handleEditSave = () => {
    if (!editTarget || !editValue.trim()) return
    if (editValue.trim() === editTarget.alias_name) {
      setEditTarget(null)
      return
    }
    updateMutation.mutate({ id: editTarget.id, aliasName: editValue.trim() })
  }

  // Group aliases by header
  const aliasesByHeader = React.useMemo(() => {
    const grouped: Record<string, Array<HeaderAliasRead>> = {}
    for (const alias of aliases) {
      const headerName = alias.header_name
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (grouped[headerName] === undefined) {
        grouped[headerName] = []
      }
      grouped[headerName].push(alias)
    }
    return grouped
  }, [aliases])

  if (aliasesLoading) {
    return <HeaderAliasesTabSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Add New Alias Card */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Alias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select value={selectedHeader} onValueChange={setSelectedHeader}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select header" />
              </SelectTrigger>
              <SelectContent>
                {headers.map((h: Header) => (
                  <SelectItem key={h.id} value={h.name}>
                    {h.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="New alias name"
              value={newAlias}
              onChange={(e) => setNewAlias(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="flex-1"
            />
            <Button
              onClick={handleCreate}
              disabled={
                !selectedHeader || !newAlias.trim() || createMutation.isPending
              }
            >
              <HugeiconsIcon icon={Add01Icon} className="size-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Header Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(aliasesByHeader).map(([headerName, headerAliases]) => (
          <Card key={headerName}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                {headerName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {headerAliases.map((alias) => (
                  <Badge
                    key={alias.id}
                    variant="secondary"
                    className="group cursor-pointer gap-1 px-2 py-1"
                  >
                    <span>{alias.alias_name}</span>
                    <button
                      type="button"
                      onClick={() => handleEdit(alias)}
                      className="ml-1 opacity-60 hover:opacity-100"
                    >
                      <HugeiconsIcon
                        icon={PencilEdit01Icon}
                        className="size-3"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(alias)}
                      className="opacity-60 hover:opacity-100"
                    >
                      <HugeiconsIcon icon={Delete01Icon} className="size-3" />
                    </button>
                  </Badge>
                ))}
                {headerAliases.length === 0 && (
                  <span className="text-sm text-muted-foreground">
                    No aliases
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {Object.keys(aliasesByHeader).length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No aliases found. Add one above to get started.
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Alias</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the alias{" "}
              <strong>{deleteTarget?.alias_name}</strong>? This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editTarget !== null}
        onOpenChange={() => setEditTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Alias</DialogTitle>
            <DialogDescription>
              Update the alias name for header{" "}
              <strong>{editTarget?.header_name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="edit-alias">Alias Name</Label>
            <Input
              id="edit-alias"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEditSave()}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={!editValue.trim() || updateMutation.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function GenderAliasesTab() {
  const queryClient = useQueryClient()
  const [newAlias, setNewAlias] = React.useState("")
  const [selectedGender, setSelectedGender] = React.useState<GenderValue | "">(
    ""
  )
  const [deleteTarget, setDeleteTarget] =
    React.useState<GenderAliasRead | null>(null)
  const [editTarget, setEditTarget] = React.useState<GenderAliasRead | null>(
    null
  )
  const [editValue, setEditValue] = React.useState("")

  const { data: aliases = [], isLoading } = useQuery({
    queryKey: ["gender-aliases"],
    queryFn: listGenderAliases,
  })

  const createMutation = useMutation({
    mutationFn: ({ gender, alias }: { gender: GenderValue; alias: string }) =>
      createGenderAlias(gender, alias),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gender-aliases"] })
      setNewAlias("")
      setSelectedGender("")
      toast.success("Alias created")
    },
    onError: () => {
      toast.error("Failed to create alias")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteGenderAlias,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gender-aliases"] })
      setDeleteTarget(null)
      toast.success("Alias deleted")
    },
    onError: () => {
      toast.error("Failed to delete alias")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, alias }: { id: number; alias: string }) =>
      updateGenderAlias(id, alias),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gender-aliases"] })
      setEditTarget(null)
      setEditValue("")
      toast.success("Alias updated")
    },
    onError: () => {
      toast.error("Failed to update alias")
    },
  })

  const handleCreate = () => {
    if (!selectedGender || !newAlias.trim()) return
    createMutation.mutate({ gender: selectedGender, alias: newAlias.trim() })
  }

  const handleEdit = (alias: GenderAliasRead) => {
    setEditTarget(alias)
    setEditValue(alias.alias)
  }

  const handleEditSave = () => {
    if (!editTarget || !editValue.trim()) return
    if (editValue.trim() === editTarget.alias) {
      setEditTarget(null)
      return
    }
    updateMutation.mutate({ id: editTarget.id, alias: editValue.trim() })
  }

  // Group aliases by gender type
  const maleAliases = aliases.filter(
    (a: GenderAliasRead) => a.aliase_type === "Male"
  )
  const femaleAliases = aliases.filter(
    (a: GenderAliasRead) => a.aliase_type === "Female"
  )

  if (isLoading) {
    return <GenderAliasesTabSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Add New Alias Card */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Gender Alias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select
              value={selectedGender}
              onValueChange={(v) => setSelectedGender(v as GenderValue)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="New alias (e.g., 'M', 'ذكر')"
              value={newAlias}
              onChange={(e) => setNewAlias(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="flex-1"
            />
            <Button
              onClick={handleCreate}
              disabled={
                !selectedGender || !newAlias.trim() || createMutation.isPending
              }
            >
              <HugeiconsIcon icon={Add01Icon} className="size-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gender Cards - Two Column Layout */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Male Aliases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {maleAliases.map((alias: GenderAliasRead) => (
                <Badge
                  key={alias.id}
                  variant="secondary"
                  className="group cursor-pointer gap-1 px-2 py-1"
                >
                  <span>{alias.alias}</span>
                  <button
                    type="button"
                    onClick={() => handleEdit(alias)}
                    className="ml-1 opacity-60 hover:opacity-100"
                  >
                    <HugeiconsIcon icon={PencilEdit01Icon} className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(alias)}
                    className="opacity-60 hover:opacity-100"
                  >
                    <HugeiconsIcon icon={Delete01Icon} className="size-3" />
                  </button>
                </Badge>
              ))}
              {maleAliases.length === 0 && (
                <span className="text-sm text-muted-foreground">
                  No male aliases
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Female Aliases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {femaleAliases.map((alias: GenderAliasRead) => (
                <Badge
                  key={alias.id}
                  variant="secondary"
                  className="group cursor-pointer gap-1 px-2 py-1"
                >
                  <span>{alias.alias}</span>
                  <button
                    type="button"
                    onClick={() => handleEdit(alias)}
                    className="ml-1 opacity-60 hover:opacity-100"
                  >
                    <HugeiconsIcon icon={PencilEdit01Icon} className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(alias)}
                    className="opacity-60 hover:opacity-100"
                  >
                    <HugeiconsIcon icon={Delete01Icon} className="size-3" />
                  </button>
                </Badge>
              ))}
              {femaleAliases.length === 0 && (
                <span className="text-sm text-muted-foreground">
                  No female aliases
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Alias</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the alias{" "}
              <strong>{deleteTarget?.alias}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editTarget !== null}
        onOpenChange={() => setEditTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Alias</DialogTitle>
            <DialogDescription>
              Update the alias for <strong>{editTarget?.aliase_type}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="edit-gender-alias">Alias</Label>
            <Input
              id="edit-gender-alias"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEditSave()}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={!editValue.trim() || updateMutation.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AliasesPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <HugeiconsIcon icon={TextIcon} className="size-6" />
        Manage Aliases
      </h1>
      <Tabs defaultValue="headers">
        <TabsList>
          <TabsTrigger value="headers">Header Aliases</TabsTrigger>
          <TabsTrigger value="genders">Gender Aliases</TabsTrigger>
        </TabsList>
        <TabsContent value="headers" className="mt-6">
          <HeaderAliasesTab />
        </TabsContent>
        <TabsContent value="genders" className="mt-6">
          <GenderAliasesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
