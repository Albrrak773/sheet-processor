import * as React from "react"
import { useNavigate, useParams } from "@tanstack/react-router"
import {
  Show,
  SignInButton,
  UserButton,
  useAuth,
  useUser,
} from "@clerk/tanstack-react-start"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Delete01Icon,
  Edit02Icon,
  Settings01Icon,
  TextIcon,
  UserGroupIcon,
  UserSearch01Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import type { SessionRead } from "@/lib/types"
import {
  Sidebar,
  SidebarContent,
  SidebarFloatingTrigger,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  deleteSession,
  listSessions,
  setAuthGetter,
  updateSession,
} from "@/lib/api-client"
import { ModeToggle } from "@/components/mode-toggle"

interface AppSidebarProps {
  children: React.ReactNode
}

function SessionList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const params = useParams({ from: "/sessions/$id", shouldThrow: false })
  const currentSessionId = params?.id
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false)
  const [sessionToDelete, setSessionToDelete] =
    React.useState<SessionRead | null>(null)
  const [sessionToRename, setSessionToRename] =
    React.useState<SessionRead | null>(null)
  const [newTitle, setNewTitle] = React.useState("")
  const [isRenaming, setIsRenaming] = React.useState(false)

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: listSessions,
  })

  const handleDelete = async () => {
    if (!sessionToDelete) return
    try {
      await deleteSession(sessionToDelete.id)
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
      setDeleteDialogOpen(false)
      setSessionToDelete(null)
      toast.success("Session deleted")
    } catch {
      toast.error("Failed to delete session")
    }
  }

  const handleRename = async () => {
    if (!sessionToRename || !newTitle.trim()) return
    setIsRenaming(true)
    try {
      await updateSession(sessionToRename.id, { title: newTitle.trim() })
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
      setRenameDialogOpen(false)
      setSessionToRename(null)
      setNewTitle("")
      toast.success("Session renamed")
    } catch {
      toast.error("Failed to rename session")
    } finally {
      setIsRenaming(false)
    }
  }

  const openDeleteDialog = (e: React.MouseEvent, session: SessionRead) => {
    e.stopPropagation()
    setSessionToDelete(session)
    setDeleteDialogOpen(true)
  }

  const openRenameDialog = (e: React.MouseEvent, session: SessionRead) => {
    e.stopPropagation()
    setSessionToRename(session)
    setNewTitle(session.title)
    setRenameDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        <div className="h-8 animate-pulse rounded bg-sidebar-accent" />
        <div className="h-8 animate-pulse rounded bg-sidebar-accent" />
        <div className="h-8 animate-pulse rounded bg-sidebar-accent" />
      </div>
    )
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Sessions</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {sessions.map((session) => (
              <SidebarMenuItem key={session.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      isActive={session.id === currentSessionId}
                      onClick={() =>
                        navigate({
                          to: "/sessions/$id",
                          params: { id: session.id },
                        })
                      }
                      className="w-full pe-14"
                    >
                      <span className="truncate">{session.title}</span>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right">{session.title}</TooltipContent>
                </Tooltip>
                <div className="absolute inset-e-1 top-1/2 flex -translate-y-1/2 gap-0.5 opacity-0 group-hover/menu-item:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => openRenameDialog(e, session)}
                  >
                    <HugeiconsIcon icon={Edit02Icon} className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => openDeleteDialog(e, session)}
                  >
                    <HugeiconsIcon icon={Delete01Icon} className="size-3.5" />
                  </Button>
                </div>
              </SidebarMenuItem>
            ))}
            {sessions.length === 0 && (
              <div className="p-2 text-xs text-sidebar-foreground/50">
                No sessions yet
              </div>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{sessionToDelete?.title}"? This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Session</DialogTitle>
            <DialogDescription>
              Enter a new name for this session.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Session name"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleRename()
              }
            }}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={!newTitle.trim() || isRenaming}
            >
              {isRenaming ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function SidebarFooterContent() {
  const { user } = useUser()
  const { state } = useSidebar()

  if (state === "collapsed") {
    return (
      <div className="flex flex-col items-center gap-2 p-2">
        <UserButton />
        <ModeToggle />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-2">
      <UserButton />
      {user && (
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">
            {user.fullName || user.username || "User"}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {user.primaryEmailAddress?.emailAddress}
          </span>
        </div>
      )}
      <ModeToggle />
    </div>
  )
}

export function AppSidebar({ children }: AppSidebarProps) {
  const navigate = useNavigate()
  const { getToken } = useAuth()

  React.useEffect(() => {
    setAuthGetter(async () => {
      const token = await getToken()
      return token ?? null
    })
  }, [getToken])

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="flex flex-row items-center justify-between">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <img src="/favicon-32x32.png" alt="" className="size-5" />
            <span className="font-semibold">Sheet Processor</span>
          </div>
          <div className="w-8" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate({ to: "/" })}>
                    <HugeiconsIcon icon={Add01Icon} className="size-4" />
                    <span>New Session</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <Show when="signed-in">
            <SidebarGroup>
              <SidebarGroupLabel>Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => navigate({ to: "/admin" })}
                    >
                      <HugeiconsIcon icon={Settings01Icon} className="size-4" />
                      <span>Admin Panel</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => navigate({ to: "/admin/aliases" })}
                    >
                      <HugeiconsIcon icon={TextIcon} className="size-4" />
                      <span>Manage Aliases</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => navigate({ to: "/admin/members" })}
                    >
                      <HugeiconsIcon
                        icon={UserSearch01Icon}
                        className="size-4"
                      />
                      <span>Search Members</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => navigate({ to: "/admin/gender" })}
                    >
                      <HugeiconsIcon icon={UserGroupIcon} className="size-4" />
                      <span>Find Gender</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SessionList />
          </Show>
        </SidebarContent>
        <SidebarFooter>
          <Show when="signed-in">
            <SidebarFooterContent />
          </Show>
          <Show when="signed-out" fallback={null}>
            <div className="p-2">
              <SignInButton mode="modal">
                <Button variant="outline" size="sm" className="w-full">
                  Sign In
                </Button>
              </SignInButton>
            </div>
          </Show>
        </SidebarFooter>
      </Sidebar>
      <SidebarFloatingTrigger />
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger />
          <img src="/favicon-32x32.png" alt="" className="size-5" />
          <span className="font-semibold">Sheet Processor</span>
        </header>
        <main className="flex-1">
          <Show when="signed-in">{children}</Show>
          <Show when="signed-out" fallback={null}>
            <div className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center gap-4">
              <div className="text-center">
                <h1 className="text-2xl font-bold">Sheet Processor</h1>
                <p className="mt-2 text-muted-foreground">
                  Sign in to validate and process your spreadsheet data
                </p>
              </div>
              <SignInButton mode="modal">
                <Button size="lg">Sign In</Button>
              </SignInButton>
            </div>
          </Show>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
