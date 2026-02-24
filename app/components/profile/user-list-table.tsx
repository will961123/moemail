"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, ChevronLeft, ChevronRight, Trash2, Search, X, Gem, Sword, User2, Crown, Eye } from "lucide-react"
import { ROLES, Role } from "@/lib/permissions"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface User {
  id: string
  name: string | null
  email: string | null
  username: string | null
  emailCount: number
  receivedCount: number
  sentCount: number
  createdAt: string
  roles: Array<{
    id: string
    name: string
    description: string | null
  }>
}

type RoleWithoutEmperor = Exclude<Role, typeof ROLES.EMPEROR>

interface UserListTableProps {
  users: User[]
  loading: boolean
  total: number
  currentPage: number
  pageSize: number
  searchUsername: string
  searchRole: string
  onSearchUsernameChange: (value: string) => void
  onSearchRoleChange: (value: string) => void
  onSearch: () => void
  onReset: () => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onRoleChange: (user: User, role: RoleWithoutEmperor) => void
  onViewDetails: (user: User) => void
  onDelete: (user: User) => void
  deleteDialogOpen: boolean
  userToDelete: User | null
  onDeleteConfirm: () => void
  onDeleteCancel: () => void
}

export function UserListTable({
  users,
  loading,
  total,
  currentPage,
  pageSize,
  searchUsername,
  searchRole,
  onSearchUsernameChange,
  onSearchRoleChange,
  onSearch,
  onReset,
  onPageChange,
  onPageSizeChange,
  onRoleChange,
  onViewDetails,
  onDelete,
  deleteDialogOpen,
  userToDelete,
  onDeleteConfirm,
  onDeleteCancel,
}: UserListTableProps) {
  const t = useTranslations("profile.userManagement")
  const tCard = useTranslations("profile.card")
  const tMessages = useTranslations("emails.messages")

  if (loading && users.length === 0) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{tMessages("loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 搜索表单 */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-sm text-muted-foreground mb-1 block">
            {t("searchUsername")}
          </label>
          <Input
            placeholder={t("searchUsernamePlaceholder")}
            value={searchUsername}
            onChange={(e) => onSearchUsernameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSearch()
              }
            }}
            disabled={loading}
          />
        </div>
        <div className="w-40">
          <label className="text-sm text-muted-foreground mb-1 block">
            {t("searchRole")}
          </label>
          <Select value={searchRole} onValueChange={onSearchRoleChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allRoles")}</SelectItem>
              <SelectItem value="emperor">{tCard("roles.EMPEROR")}</SelectItem>
              <SelectItem value="duke">{tCard("roles.DUKE")}</SelectItem>
              <SelectItem value="knight">{tCard("roles.KNIGHT")}</SelectItem>
              <SelectItem value="civilian">{tCard("roles.CIVILIAN")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={onSearch} disabled={loading}>
          <Search className="w-4 h-4 mr-2" />
          {t("search")}
        </Button>
        <Button variant="outline" onClick={onReset} disabled={loading}>
          <X className="w-4 h-4 mr-2" />
          {t("reset")}
        </Button>
      </div>

      <div className="relative rounded-md border">
        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-md">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">{tMessages("loading")}</p>
            </div>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("username")}</TableHead>
              <TableHead className="text-right whitespace-nowrap">{t("emailCount")}</TableHead>
              <TableHead className="text-right whitespace-nowrap">{t("receivedCount")}</TableHead>
              <TableHead className="text-right whitespace-nowrap">{t("sentCount")}</TableHead>
              <TableHead>{t("role")}</TableHead>
              <TableHead>{t("registrationTime")}</TableHead>
              <TableHead className="text-right sticky right-0 bg-background shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)]">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {t("noUsers")}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.username || user.name || user.email || "N/A"}
                  </TableCell>
                  <TableCell className="text-right">{user.emailCount}</TableCell>
                  <TableCell className="text-right">{user.receivedCount}</TableCell>
                  <TableCell className="text-right">{user.sentCount}</TableCell>
                  <TableCell>
                    {(() => {
                      const isEmperor = user.roles.some(r => r.name === ROLES.EMPEROR)
                      const currentRole = user.roles[0]?.name

                      return (
                        <Select
                          value={currentRole || ROLES.CIVILIAN}
                          onValueChange={isEmperor ? undefined : (value) => onRoleChange(user, value as RoleWithoutEmperor)}
                          disabled={loading || isEmperor}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {isEmperor ? (
                              <SelectItem value={ROLES.EMPEROR}>
                                <div className="flex items-center gap-2">
                                  <Crown className="w-3 h-3" />
                                  {tCard("roles.EMPEROR")}
                                </div>
                              </SelectItem>
                            ) : (
                              <>
                                <SelectItem value={ROLES.DUKE}>
                                  <div className="flex items-center gap-2">
                                    <Gem className="w-3 h-3" />
                                    {tCard("roles.DUKE")}
                                  </div>
                                </SelectItem>
                                <SelectItem value={ROLES.KNIGHT}>
                                  <div className="flex items-center gap-2">
                                    <Sword className="w-3 h-3" />
                                    {tCard("roles.KNIGHT")}
                                  </div>
                                </SelectItem>
                                <SelectItem value={ROLES.CIVILIAN}>
                                  <div className="flex items-center gap-2">
                                    <User2 className="w-3 h-3" />
                                    {tCard("roles.CIVILIAN")}
                                  </div>
                                </SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      )
                    })()}
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right sticky right-0 bg-background shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(user)}
                        disabled={loading}
                        title={t("viewEmails")}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(user)}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {t("totalUsers", { count: total })}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t("pageSize")}</span>
            <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(parseInt(value, 10))} disabled={loading}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            <ChevronLeft className="w-4 h-4" />
            {t("previousPage")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage * pageSize >= total || loading}
          >
            {t("nextPage")}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={onDeleteCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteWarning", {
                username: userToDelete?.username || userToDelete?.name || userToDelete?.email || "N/A"
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

