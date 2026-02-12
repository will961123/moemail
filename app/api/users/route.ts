import { createDb } from "@/lib/db"
import { eq, sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import { users, emails, messages } from "@/lib/schema"
import { getUserId } from "@/lib/apiKey"

export const runtime = "edge"

const DEFAULT_PAGE_SIZE = 10
const MIN_PAGE_SIZE = 1
const MAX_PAGE_SIZE = 100

// 角色权重映射
const ROLE_WEIGHTS: Record<string, number> = {
  'emperor': 4,
  'duke': 3,
  'knight': 2,
  'civilian': 1,
}

export async function GET(request: Request) {
  const userId = await getUserId()

  if (!userId) {
    return NextResponse.json(
      { error: "未授权" },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const pageParam = searchParams.get('page')
  const pageSizeParam = searchParams.get('pageSize')
  const usernameParam = searchParams.get('username')
  const roleNameParam = searchParams.get('roleName')

  // 解析并验证 pageSize
  let pageSize = DEFAULT_PAGE_SIZE
  if (pageSizeParam) {
    const parsed = parseInt(pageSizeParam, 10)
    if (!isNaN(parsed) && parsed >= MIN_PAGE_SIZE && parsed <= MAX_PAGE_SIZE) {
      pageSize = parsed
    }
  }

  // 解析并验证 page
  let page = 1
  if (pageParam) {
    const parsed = parseInt(pageParam, 10)
    if (!isNaN(parsed) && parsed >= 1) {
      page = parsed
    }
  }

  const db = createDb()

  try {
    // 查询所有用户,包含角色信息
    let allUsers = await db.query.users.findMany({
      with: {
        userRoles: {
          with: {
            role: true
          }
        }
      }
    })

    // 应用用户名搜索过滤
    if (usernameParam) {
      const searchTerm = usernameParam.toLowerCase()
      allUsers = allUsers.filter(user =>
        user.username?.toLowerCase().includes(searchTerm) ||
        user.name?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm)
      )
    }

    // 应用角色过滤
    if (roleNameParam) {
      allUsers = allUsers.filter(user =>
        user.userRoles.some(ur => ur.role.name === roleNameParam)
      )
    }

    // // 计算每个用户的最高角色权重并排序
    // const usersWithWeight = allUsers.map(user => {
    //   const maxWeight = Math.max(
    //     ...user.userRoles.map(ur => ROLE_WEIGHTS[ur.role.name] || 0),
    //     0
    //   )
    //   return { user, maxWeight }
    // })

    // // 按权重降序排序，权重相同则按ID排序
    // usersWithWeight.sort((a, b) => {
    //   if (b.maxWeight !== a.maxWeight) {
    //     return b.maxWeight - a.maxWeight
    //   }
    //   return b.user.id.localeCompare(a.user.id)
    // })

    // // 获取总数
    // const totalCount = usersWithWeight.length

    // // 手动分页
    // const offset = (page - 1) * pageSize
    // const paginatedUsers = usersWithWeight
    //   .slice(offset, offset + pageSize)
    //   .map(item => item.user)

    // 获取总数
    const totalCount = allUsers.length

    // 手动分页
    const offset = (page - 1) * pageSize
    const paginatedUsers = allUsers.slice(offset, offset + pageSize)

    // 为每个用户查询邮箱数量和邮件数量
    const formattedUsers = await Promise.all(paginatedUsers.map(async (user) => {
      // 查询邮箱数量
      const emailCountResult = await db.select({ count: sql<number>`count(*)` })
        .from(emails)
        .where(eq(emails.userId, user.id))
      const emailCount = Number(emailCountResult[0].count)

      // 查询邮件数量（通过邮箱关联）
      const messageCountResult = await db.select({ count: sql<number>`count(*)` })
        .from(messages)
        .innerJoin(emails, eq(messages.emailId, emails.id))
        .where(eq(emails.userId, user.id))
      const messageCount = Number(messageCountResult[0].count)

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        username: user.username,
        emailVerified: user.emailVerified,
        createdAt: user.id, // 使用 ID 作为创建时间的近似值（UUID 包含时间戳）
        emailCount,
        messageCount,
        roles: user.userRoles.map(ur => ({
          id: ur.role.id,
          name: ur.role.name,
          description: ur.role.description
        }))
      }
    }))

    return NextResponse.json({
      users: formattedUsers,
      total: totalCount,
      page,
      pageSize
    })
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json(
      { error: "获取用户列表失败" },
      { status: 500 }
    )
  }
}
