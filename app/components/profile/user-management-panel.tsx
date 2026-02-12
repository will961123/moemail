"use client"

import { useTranslations } from "next-intl"
import { useEffect, useState, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"
import { ROLES, Role } from "@/lib/permissions"
import { UserDetailsDialog } from "./user-details-dialog"
import { UserListTable } from "./user-list-table"

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

interface UsersResponse {
  users: User[]
  total: number
  page: number
  pageSize: number
}

interface UserEmail {
  id: string
  address: string
  createdAt: string
  expiresAt: string
  messageCount: number
}

interface UserEmailsResponse {
  emails: UserEmail[]
  total: number
  page: number
  pageSize: number
}

interface Message {
  id: string
  from: string
  to: string
  subject: string
  receivedAt: string
  type: string
}

interface MessagesResponse {
  messages: Message[]
  total: number
  page: number
  pageSize: number
  nextCursor?: string
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

type RoleWithoutEmperor = Exclude<Role, typeof ROLES.EMPEROR>

export function UserManagementPanel() {
  const t = useTranslations("profile.userManagement")
  const tCard = useTranslations("profile.card")
  const { toast } = useToast()
  const initialized = useRef(false)

  // 用户列表相关状态
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [searchUsername, setSearchUsername] = useState("")
  const [searchRole, setSearchRole] = useState<string>("all")

  // 三栏弹窗相关状态
  const [userDetailsDialogOpen, setUserDetailsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // 邮箱列表相关状态
  const [userEmails, setUserEmails] = useState<UserEmail[]>([])
  const [loadingEmails, setLoadingEmails] = useState(false)
  const [refreshingEmails, setRefreshingEmails] = useState(false)
  const [emailsPage, setEmailsPage] = useState(1)
  const [emailsPageSize, setEmailsPageSize] = useState(10)
  const [emailsTotal, setEmailsTotal] = useState(0)
  const [selectedEmail, setSelectedEmail] = useState<UserEmail | null>(null)
  const [deleteEmailDialogOpen, setDeleteEmailDialogOpen] = useState(false)
  const [emailToDelete, setEmailToDelete] = useState<UserEmail | null>(null)

  // 邮件列表相关状态
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [refreshingMessages, setRefreshingMessages] = useState(false)
  const [messagesPage, setMessagesPage] = useState(1)
  const [messagesPageSize, setMessagesPageSize] = useState(10)
  const [messagesTotal, setMessagesTotal] = useState(0)

  // 邮件详情相关状态
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [messageDetail, setMessageDetail] = useState<MessageDetail | null>(null)
  const [loadingMessageDetail, setLoadingMessageDetail] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("html")

  const fetchUsers = async (
    page: number = currentPage,
    size: number = pageSize,
    username?: string,
    roleName?: string
  ) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: size.toString(),
      })

      const usernameValue = username !== undefined ? username : searchUsername
      const roleNameValue = roleName !== undefined ? roleName : searchRole

      if (usernameValue.trim()) {
        params.append('username', usernameValue.trim())
      }

      if (roleNameValue && roleNameValue !== 'all') {
        params.append('roleName', roleNameValue)
      }

      const url = `/api/users?${params.toString()}`

      const res = await fetch(url)
      const data = await res.json() as UsersResponse

      if (!res.ok) throw new Error(data.error || "获取用户列表失败")

      setUsers(data.users)
      setTotal(data.total)
    } catch (error) {
      toast({
        title: t("fetchFailed"),
        description: error instanceof Error ? error.message : t("fetchFailed"),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      fetchUsers()
    }
  }, [])

  const handleSearch = () => {
    setCurrentPage(1)
    fetchUsers(1)
  }

  const handleReset = () => {
    setSearchUsername("")
    setSearchRole("all")
    setCurrentPage(1)
    fetchUsers(1, pageSize, "", "all")
  }

  const fetchUserEmails = async (
    userId: string,
    page: number = emailsPage,
    size: number = emailsPageSize
  ) => {
    setLoadingEmails(true)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: size.toString(),
      })

      const res = await fetch(`/api/users/${userId}/emails?${params.toString()}`)
      const data = await res.json() as UserEmailsResponse

      if (!res.ok) {
        throw new Error(data.error || t("fetchEmailsFailed"))
      }

      setUserEmails(data.emails)
      setEmailsTotal(data.total)
      setEmailsPage(data.page)
      setEmailsPageSize(data.pageSize)
    } catch (error) {
      toast({
        title: t("fetchEmailsFailed"),
        description: error instanceof Error ? error.message : t("fetchEmailsFailed"),
        variant: "destructive"
      })
      setUserEmails([])
      setEmailsTotal(0)
    } finally {
      setLoadingEmails(false)
    }
  }

  const handleViewUserDetails = async (user: User) => {
    setSelectedUser(user)
    setUserDetailsDialogOpen(true)
    setEmailsPage(1)
    setSelectedEmail(null)
    setSelectedMessageId(null)
    setMessageDetail(null)
    await fetchUserEmails(user.id, 1, emailsPageSize)
  }

  const handleEmailSelect = async (email: UserEmail) => {
    setSelectedEmail(email)
    setMessagesPage(1)
    setSelectedMessageId(null)
    setMessageDetail(null)
    if (selectedUser) {
      await fetchMessages(selectedUser.id, email.id, 1, messagesPageSize)
    }
  }

  const handleRefreshEmails = async () => {
    if (!selectedUser) return
    setRefreshingEmails(true)
    setEmailsPage(1)
    await fetchUserEmails(selectedUser.id, 1, emailsPageSize)
    setRefreshingEmails(false)
  }

  const handleDeleteEmailClick = (email: UserEmail) => {
    // 检查是否是皇帝用户的邮箱
    const isEmperor = selectedUser?.roles.some(r => r.name === ROLES.EMPEROR)
    if (isEmperor) {
      toast({
        title: t("deleteFailed"),
        description: t("cannotDeleteEmperor"),
        variant: "destructive"
      })
      return
    }

    setEmailToDelete(email)
    setDeleteEmailDialogOpen(true)
  }

  const handleDeleteEmailConfirm = async () => {
    if (!emailToDelete || !selectedUser) return

    setLoadingEmails(true)
    setDeleteEmailDialogOpen(false)
    try {
      const res = await fetch(`/api/users/${selectedUser.id}/emails/${emailToDelete.id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || t("deleteFailed"))
      }

      toast({
        title: t("deleteSuccess"),
        description: t("emailDeleteDescription", { address: emailToDelete.address })
      })

      // 刷新邮箱列表
      await fetchUserEmails(selectedUser.id, emailsPage, emailsPageSize)

      // 同时刷新用户列表以更新邮箱数量
      fetchUsers(currentPage)
    } catch (error) {
      toast({
        title: t("deleteFailed"),
        description: error instanceof Error ? error.message : t("deleteFailed"),
        variant: "destructive"
      })
    } finally {
      setEmailToDelete(null)
      setLoadingEmails(false)
    }
  }

  const fetchMessages = async (
    userId: string,
    emailId: string,
    page: number = messagesPage,
    size: number = messagesPageSize
  ) => {
    setLoadingMessages(true)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: size.toString(),
      })

      const res = await fetch(`/api/users/${userId}/emails/${emailId}/messages?${params.toString()}`)
      const data = await res.json() as MessagesResponse

      if (!res.ok) {
        throw new Error(data.error || t("fetchMessagesFailed"))
      }

      setMessages(data.messages)
      setMessagesTotal(data.total)
      setMessagesPage(data.page)
      setMessagesPageSize(data.pageSize)
    } catch (error) {
      toast({
        title: t("fetchMessagesFailed"),
        description: error instanceof Error ? error.message : t("fetchMessagesFailed"),
        variant: "destructive"
      })
      setMessages([])
      setMessagesTotal(0)
    } finally {
      setLoadingMessages(false)
    }
  }

  const fetchMessageDetail = async (userId: string, emailId: string, messageId: string) => {
    setLoadingMessageDetail(true)
    try {
      const res = await fetch(`/api/users/${userId}/emails/${emailId}/messages/${messageId}`)
      const data = await res.json() as { message: MessageDetail }

      if (!res.ok) {
        throw new Error(data.error || t("fetchMessagesFailed"))
      }

      setMessageDetail(data.message)
      if (!data.message.html) {
        setViewMode("text")
      } else {
        setViewMode("html")
      }
    } catch (error) {
      toast({
        title: t("fetchMessagesFailed"),
        description: error instanceof Error ? error.message : t("fetchMessagesFailed"),
        variant: "destructive"
      })
      setMessageDetail(null)
    } finally {
      setLoadingMessageDetail(false)
    }
  }

  const handleMessageSelect = async (messageId: string) => {
    setSelectedMessageId(messageId)
    if (selectedUser && selectedEmail) {
      await fetchMessageDetail(selectedUser.id, selectedEmail.id, messageId)
    }
  }

  const handleRefreshMessages = async () => {
    if (!selectedEmail || !selectedUser) return
    setRefreshingMessages(true)
    setMessagesPage(1)
    await fetchMessages(selectedUser.id, selectedEmail.id, 1, messagesPageSize)
    setRefreshingMessages(false)
  }

  const handleRoleChange = async (user: User, newRole: RoleWithoutEmperor) => {
    // 检查是否是皇帝角色
    const isEmperor = user.roles.some(r => r.name === ROLES.EMPEROR)
    if (isEmperor) {
      toast({
        title: t("roleUpdateFailed"),
        description: t("cannotChangeEmperor"),
        variant: "destructive"
      })
      return
    }

    // 获取当前角色
    const currentRole = user.roles[0]?.name
    if (currentRole === newRole) {
      return // 角色没有变化，不需要更新
    }

    setLoading(true)
    try {
      const res = await fetch("/api/roles/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          roleName: newRole
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || t("roleUpdateFailed"))
      }

      toast({
        title: t("roleUpdateSuccess"),
        description: t("roleUpdateDescription", {
          username: user.username || user.name || user.email || "N/A",
          role: tCard(`roles.${newRole.toUpperCase()}` as any)
        })
      })

      // 刷新当前页
      fetchUsers(currentPage)
    } catch (error) {
      toast({
        title: t("roleUpdateFailed"),
        description: error instanceof Error ? error.message : t("roleUpdateFailed"),
        variant: "destructive"
      })
      setLoading(false)
    }
  }

  const handleDeleteClick = (user: User) => {
    // 检查是否是皇帝角色
    const isEmperor = user.roles.some(r => r.name === ROLES.EMPEROR)
    if (isEmperor) {
      toast({
        title: t("deleteFailed"),
        description: t("cannotDeleteEmperor"),
        variant: "destructive"
      })
      return
    }

    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    setLoading(true)
    setDeleteDialogOpen(false)
    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || t("deleteFailed"))
      }

      toast({
        title: t("deleteSuccess"),
        description: t("deleteDescription", { username: userToDelete.username || userToDelete.name || userToDelete.email || "N/A" })
      })

      // 计算删除后的总数和最大页码
      const newTotal = total - 1
      const maxPage = Math.ceil(newTotal / pageSize)

      // 如果当前页超出范围，回到最大页码
      if (currentPage > maxPage && maxPage > 0) {
        setCurrentPage(maxPage)
        fetchUsers(maxPage)
      } else {
        // 否则刷新当前页
        fetchUsers(currentPage)
      }
    } catch (error) {
      toast({
        title: t("deleteFailed"),
        description: error instanceof Error ? error.message : t("deleteFailed"),
        variant: "destructive"
      })
      setLoading(false)
    } finally {
      setUserToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <UserListTable
        users={users}
        loading={loading}
        total={total}
        currentPage={currentPage}
        pageSize={pageSize}
        searchUsername={searchUsername}
        searchRole={searchRole}
        onSearchUsernameChange={setSearchUsername}
        onSearchRoleChange={setSearchRole}
        onSearch={handleSearch}
        onReset={handleReset}
        onPageChange={(page) => {
          setCurrentPage(page)
          fetchUsers(page)
        }}
        onPageSizeChange={(pageSize) => {
          setPageSize(pageSize)
          setCurrentPage(1)
          fetchUsers(1, pageSize)
        }}
        onRoleChange={handleRoleChange}
        onViewDetails={handleViewUserDetails}
        onDelete={handleDeleteClick}
        deleteDialogOpen={deleteDialogOpen}
        userToDelete={userToDelete}
        onDeleteConfirm={handleDeleteConfirm}
        onDeleteCancel={() => setDeleteDialogOpen(false)}
      />

      <UserDetailsDialog
        open={userDetailsDialogOpen}
        onOpenChange={setUserDetailsDialogOpen}
        user={selectedUser}
        emails={userEmails}
        loadingEmails={loadingEmails}
        refreshingEmails={refreshingEmails}
        emailsPage={emailsPage}
        emailsPageSize={emailsPageSize}
        emailsTotal={emailsTotal}
        selectedEmail={selectedEmail}
        onEmailSelect={handleEmailSelect}
        onRefreshEmails={handleRefreshEmails}
        onEmailsPageChange={(page) => {
          if (selectedUser) fetchUserEmails(selectedUser.id, page, emailsPageSize)
        }}
        onEmailsPageSizeChange={(pageSize) => {
          if (selectedUser) {
            setEmailsPageSize(pageSize)
            fetchUserEmails(selectedUser.id, 1, pageSize)
          }
        }}
        onDeleteEmail={handleDeleteEmailClick}
        messages={messages}
        loadingMessages={loadingMessages}
        refreshingMessages={refreshingMessages}
        messagesPage={messagesPage}
        messagesPageSize={messagesPageSize}
        messagesTotal={messagesTotal}
        selectedMessageId={selectedMessageId}
        onMessageSelect={handleMessageSelect}
        onRefreshMessages={handleRefreshMessages}
        onMessagesPageChange={(page) => {
          if (selectedUser && selectedEmail) {
            fetchMessages(selectedUser.id, selectedEmail.id, page, messagesPageSize)
          }
        }}
        onMessagesPageSizeChange={(pageSize) => {
          if (selectedUser && selectedEmail) {
            setMessagesPageSize(pageSize)
            fetchMessages(selectedUser.id, selectedEmail.id, 1, pageSize)
          }
        }}
        messageDetail={messageDetail}
        loadingMessageDetail={loadingMessageDetail}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        deleteEmailDialogOpen={deleteEmailDialogOpen}
        emailToDelete={emailToDelete}
        onDeleteEmailConfirm={handleDeleteEmailConfirm}
        onDeleteEmailCancel={() => setDeleteEmailDialogOpen(false)}
      />
    </div>
  )
}
