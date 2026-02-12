"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Mail, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Message {
  id: string
  from: string
  to: string
  subject: string
  receivedAt: string
  type: string
}

interface UserMessageListColumnProps {
  messages: Message[]
  loading: boolean
  refreshing: boolean
  page: number
  pageSize: number
  total: number
  selectedMessageId: string | null
  selectedEmailAddress: string | null
  onMessageSelect: (messageId: string) => void
  onRefresh: () => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  showBackButton?: boolean
  onBack?: () => void
}

export function UserMessageListColumn({
  messages,
  loading,
  refreshing,
  page,
  pageSize,
  total,
  selectedMessageId,
  selectedEmailAddress,
  onMessageSelect,
  onRefresh,
  onPageChange,
  onPageSizeChange,
  showBackButton = false,
  onBack,
}: UserMessageListColumnProps) {
  const t = useTranslations("profile.userManagement")
  const tMessages = useTranslations("emails.messages")
  const tMessageView = useTranslations("emails.messageView")
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
        <h2 className="text-sm font-bold px-2 truncate flex-1">
          {selectedEmailAddress || t("selectEmail")}
        </h2>
        {selectedEmailAddress && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onRefresh}
            disabled={loading || refreshing}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
          </Button>
        )}
      </div>

      {selectedEmailAddress && (
        <>
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500">{tMessages("loading")}</div>
            ) : messages.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                {t("noMessages")}
              </div>
            ) : (
              <div className="divide-y divide-primary/10">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "p-3 hover:bg-primary/5 cursor-pointer group",
                      selectedMessageId === message.id && "bg-primary/10"
                    )}
                    onClick={() => onMessageSelect(message.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Mail className="w-4 h-4 text-primary/60 mt-1" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {message.subject || t("noSubject")}
                        </p>
                        <div className="mt-1 text-xs text-gray-500 space-y-1">
                          <p className="truncate">{tMessageView("from")}: {message.from}</p>
                          <p>{tMessageView("time")}: {new Date(message.receivedAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!(loading && messages.length === 0) && !refreshing && (
            <div className="p-2 border-t-2 border-primary/20 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">
                    {t("totalMessages", { count: total })}
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
      )}
    </>
  )
}
