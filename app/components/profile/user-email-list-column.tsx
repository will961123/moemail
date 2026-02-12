"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Mail, Trash2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface UserEmail {
  id: string
  address: string
  createdAt: string
  expiresAt: string
  messageCount: number
}

interface UserEmailListColumnProps {
  emails: UserEmail[]
  loading: boolean
  refreshing: boolean
  page: number
  pageSize: number
  total: number
  selectedEmailId: string | null
  onEmailSelect: (email: UserEmail) => void
  onRefresh: () => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onDelete: (email: UserEmail) => void
  showBackButton?: boolean
  onBack?: () => void
}

export function UserEmailListColumn({
  emails,
  loading,
  refreshing,
  page,
  pageSize,
  total,
  selectedEmailId,
  onEmailSelect,
  onRefresh,
  onPageChange,
  onPageSizeChange,
  onDelete,
  showBackButton = false,
  onBack,
}: UserEmailListColumnProps) {
  const t = useTranslations("profile.userManagement")
  const tMessages = useTranslations("emails.messages")
  const tList = useTranslations("emails.list")
  const tLayout = useTranslations("emails.layout")

  return (
    <>
      <div className="p-2 border-b-2 border-primary/20 flex items-center justify-between shrink-0 gap-2">
        {showBackButton && onBack && (
          <button
            onClick={onBack}
            className="text-sm text-primary shrink-0"
          >
            {tLayout("backToEmailList")}
          </button>
        )}
        <h2 className="text-sm font-bold px-2">{t("emailAddress")}</h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={onRefresh}
          disabled={loading || refreshing}
        >
          <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {loading ? (
          <div className="text-center text-sm text-gray-500">{tMessages("loading")}</div>
        ) : emails.length === 0 ? (
          <div className="text-center text-sm text-gray-500">
            {t("noEmails")}
          </div>
        ) : (
          <div className="space-y-1">
            {emails.map((email) => (
              <div
                key={email.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded cursor-pointer text-sm group",
                  "hover:bg-primary/5",
                  selectedEmailId === email.id && "bg-primary/10"
                )}
                onClick={() => onEmailSelect(email)}
              >
                <Mail className="h-4 w-4 text-primary/60" />
                <div className="truncate flex-1">
                  <div className="font-medium truncate">{email.address}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(email.expiresAt).getFullYear() === 9999 ? (
                      tList("permanent")
                    ) : (
                      `${tList("expiresAt")}: ${new Date(email.expiresAt).toLocaleString()}`
                    )}
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(email)
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!(loading && emails.length === 0) && !refreshing && (
        <div className="p-2 border-t-2 border-primary/20 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground">
                {t("totalEmails", { count: total })}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">{t("pageSize")}</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => onPageSizeChange(parseInt(value, 10))}
                  disabled={loading}
                >
                  <SelectTrigger className="w-16 h-6 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className={cn("h-6 w-6 p-0", (page === 1 || loading) && "cursor-not-allowed opacity-50")}
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn("h-6 w-6 p-0", (page * pageSize >= total || loading) && "cursor-not-allowed opacity-50")}
                onClick={() => onPageChange(page + 1)}
                disabled={page * pageSize >= total || loading}
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
