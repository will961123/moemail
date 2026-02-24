import { createDb } from "@/lib/db"
import { eq, sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import { emails, messages } from "@/lib/schema"
import { getUserId } from "@/lib/apiKey"

export const runtime = "edge"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUserId = await getUserId()

  if (!currentUserId) {
    return NextResponse.json(
      { error: "未授权" },
      { status: 401 }
    )
  }

  try {
    const { id: targetUserId } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10)
    const offset = (page - 1) * pageSize

    const db = createDb()

    // 获取总数
    const totalResult = await db.select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(eq(emails.userId, targetUserId))
    const total = Number(totalResult[0].count)

    // 获取分页的邮箱列表
    const userEmails = await db.query.emails.findMany({
      where: eq(emails.userId, targetUserId),
      orderBy: (emails, { desc }) => [desc(emails.createdAt)],
      limit: pageSize,
      offset: offset,
    })

    // 统计每个邮箱的消息数量
    const emailsWithCount = await Promise.all(
      userEmails.map(async (email) => {
        const messageCountResult = await db.select({ count: sql<number>`count(*)` })
          .from(messages)
          .where(eq(messages.emailId, email.id))
        const messageCount = Number(messageCountResult[0].count)

        return {
          id: email.id,
          address: email.address,
          createdAt: email.createdAt,
          expiresAt: email.expiresAt,
          messageCount,
          isExpired: email.expiresAt <= new Date(),
        }
      })
    )

    return NextResponse.json({
      emails: emailsWithCount,
      total,
      page,
      pageSize,
    })
  } catch (error) {
    console.error('Failed to fetch user emails:', error)
    return NextResponse.json(
      { error: "获取邮箱列表失败" },
      { status: 500 }
    )
  }
}
