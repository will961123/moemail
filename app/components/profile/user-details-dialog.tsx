"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { UserEmailListColumn } from "./user-email-list-column"
import { UserMessageListColumn } from "./user-message-list-column"
import { UserMessageDetailColumn } from "./user-message-detail-column"

interface User {
  id: string
  name: string | null
  email: string | null
  username: string | null
  emailCount: number
  messageCount: number
  roles: Array<{
    id: string
    name: string
    description: string | null
  }>
}

interface UserEmail {
  id: string
  address: string
  createdAt: string
  expiresAt: string
  messageCount: number
}

interface Message {
  id: string
  from: string
  to: string
  subject: string
  receivedAt: string
  type: string
}

interface MessageDetail {
  id: string
  from_address?: string
  to_address?: string
  subject: string
  content: string
  html?: string
  received_at?: number
  type: string
}

type ViewMode = "html" | "text"

interface UserDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null

  // 邮箱列表相关
  emails: UserEmail[]
  loadingEmails: boolean
  refreshingEmails: boolean
  emailsPage: number
  emailsPageSize: number
  emailsTotal: number
  selectedEmail: UserEmail | null
  onEmailSelect: (email: UserEmail | null) => void
  onRefreshEmails: () => void
  onEmailsPageChange: (page: number) => void
  onEmailsPageSizeChange: (pageSize: number) => void
  onDeleteEmail: (email: UserEmail) => void

  // 邮件列表相关
  messages: Message[]
  loadingMessages: boolean
  refreshingMessages: boolean
  messagesPage: number
  messagesPageSize: number
  messagesTotal: number
  messageType: 'received' | 'sent'
  selectedMessageId: string | null
  onMessageSelect: (messageId: string | null) => void
  onRefreshMessages: () => void
  onMessagesPageChange: (page: number) => void
  onMessagesPageSizeChange: (pageSize: number) => void
  onMessageTypeChange: (type: 'received' | 'sent') => void

  // 邮件详情相关
  messageDetail: MessageDetail | null
  loadingMessageDetail: boolean
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void

  // 删除邮箱确认对话框
  deleteEmailDialogOpen: boolean
  emailToDelete: UserEmail | null
  onDeleteEmailConfirm: () => void
  onDeleteEmailCancel: () => void
}

export function UserDetailsDialog({
  open,
  onOpenChange,
  user,
  emails,
  loadingEmails,
  refreshingEmails,
  emailsPage,
  emailsPageSize,
  emailsTotal,
  selectedEmail,
  onEmailSelect,
  onRefreshEmails,
  onEmailsPageChange,
  onEmailsPageSizeChange,
  onDeleteEmail,
  messages,
  loadingMessages,
  refreshingMessages,
  messagesPage,
  messagesPageSize,
  messagesTotal,
  messageType,
  selectedMessageId,
  onMessageSelect,
  onRefreshMessages,
  onMessagesPageChange,
  onMessagesPageSizeChange,
  onMessageTypeChange,
  messageDetail,
  loadingMessageDetail,
  viewMode,
  onViewModeChange,
  deleteEmailDialogOpen,
  emailToDelete,
  onDeleteEmailConfirm,
  onDeleteEmailCancel,
}: UserDetailsDialogProps) {
  const t = useTranslations("profile.userManagement")

  // 移动端视图逻辑
  const getMobileView = () => {
    if (selectedMessageId) return "message"
    if (selectedEmail) return "messages"
    return "emails"
  }

  const mobileView = getMobileView()

  const columnClass = "border-2 border-primary/20 bg-background rounded-lg overflow-hidden flex flex-col"

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>
              {t("emailsDialogTitle", {
                username: user?.username || user?.name || user?.email || "N/A"
              })}
            </DialogTitle>
          </DialogHeader>

          {/* 桌面端三栏布局 */}
          <div className="hidden lg:grid flex-1 grid-cols-12 gap-4 px-6 pt-2 pb-6 min-h-0">
            {/* 左栏：邮箱列表 */}
            <div className={cn("col-span-3", columnClass)}>
              <UserEmailListColumn
                emails={emails}
                loading={loadingEmails}
                refreshing={refreshingEmails}
                page={emailsPage}
                pageSize={emailsPageSize}
                total={emailsTotal}
                selectedEmailId={selectedEmail?.id || null}
                onEmailSelect={onEmailSelect}
                onRefresh={onRefreshEmails}
                onPageChange={onEmailsPageChange}
                onPageSizeChange={onEmailsPageSizeChange}
                onDelete={onDeleteEmail}
              />
            </div>

            {/* 中栏：邮件列表 */}
            <div className={cn("col-span-4", columnClass)}>
              <UserMessageListColumn
                messages={messages}
                loading={loadingMessages}
                refreshing={refreshingMessages}
                page={messagesPage}
                pageSize={messagesPageSize}
                total={messagesTotal}
                messageType={messageType}
                selectedMessageId={selectedMessageId}
                selectedEmailAddress={selectedEmail?.address || null}
                onMessageSelect={onMessageSelect}
                onRefresh={onRefreshMessages}
                onPageChange={onMessagesPageChange}
                onPageSizeChange={onMessagesPageSizeChange}
                onMessageTypeChange={onMessageTypeChange}
              />
            </div>

            {/* 右栏：邮件详情 */}
            <div className={cn("col-span-5", columnClass)}>
              <UserMessageDetailColumn
                messageDetail={messageDetail}
                loading={loadingMessageDetail}
                viewMode={viewMode}
                onViewModeChange={onViewModeChange}
              />
            </div>
          </div>

          {/* 移动端单栏布局 */}
          <div className="lg:hidden flex-1 px-6 pt-2 pb-6 min-h-0">
            <div className={cn("h-full", columnClass)}>
              {/* 邮箱列表视图 */}
              {mobileView === "emails" && (
                <UserEmailListColumn
                  emails={emails}
                  loading={loadingEmails}
                  refreshing={refreshingEmails}
                  page={emailsPage}
                  pageSize={emailsPageSize}
                  total={emailsTotal}
                  selectedEmailId={selectedEmail?.id || null}
                  onEmailSelect={onEmailSelect}
                  onRefresh={onRefreshEmails}
                  onPageChange={onEmailsPageChange}
                  onPageSizeChange={onEmailsPageSizeChange}
                  onDelete={onDeleteEmail}
                />
              )}

              {/* 邮件列表视图 */}
              {mobileView === "messages" && selectedEmail && (
                <UserMessageListColumn
                  messages={messages}
                  loading={loadingMessages}
                  refreshing={refreshingMessages}
                  page={messagesPage}
                  pageSize={messagesPageSize}
                  total={messagesTotal}
                  messageType={messageType}
                  selectedMessageId={selectedMessageId}
                  selectedEmailAddress={selectedEmail.address}
                  onMessageSelect={onMessageSelect}
                  onRefresh={onRefreshMessages}
                  onPageChange={onMessagesPageChange}
                  onPageSizeChange={onMessagesPageSizeChange}
                  onMessageTypeChange={onMessageTypeChange}
                  showBackButton={true}
                  onBack={() => {
                    onEmailSelect(null)
                  }}
                />
              )}

              {/* 邮件详情视图 */}
              {mobileView === "message" && selectedEmail && selectedMessageId && (
                <UserMessageDetailColumn
                  messageDetail={messageDetail}
                  loading={loadingMessageDetail}
                  viewMode={viewMode}
                  onViewModeChange={onViewModeChange}
                  showBackButton={true}
                  onBack={() => onMessageSelect(null)}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除邮箱确认对话框 */}
      <AlertDialog open={deleteEmailDialogOpen} onOpenChange={onDeleteEmailCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("emailDeleteWarning", {
                address: emailToDelete?.address || ""
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteEmailConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

