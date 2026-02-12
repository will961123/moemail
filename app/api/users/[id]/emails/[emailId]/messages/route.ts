import { createDb } from "@/lib/db"
import { eq, and, desc, sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import { emails, messages } from "@/lib/schema"
import { getUserId } from "@/lib/apiKey"

export const runtime = "edge"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; emailId: string }> }
) {
  const currentUserId = await getUserId()

  if (!currentUserId) {
    return NextResponse.json(
      { error: "未授权" },
      { status: 401 }
    )
  }

  try {
    const { id: targetUserId, emailId } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10)
    const offset = (page - 1) * pageSize

    const db = createDb()

    // 验证邮箱是否存在且属于目标用户
    const email = await db.query.emails.findFirst({
      where: and(
        eq(emails.id, emailId),
        eq(emails.userId, targetUserId)
      )
    })

    if (!email) {
      return NextResponse.json(
        { error: "邮箱不存在" },
        { status: 404 }
      )
    }

    // 获取邮件总数
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(eq(messages.emailId, emailId))
    const total = Number(totalResult[0].count)

    // 获取分页的邮件列表
    const messageList = await db.query.messages.findMany({
      where: eq(messages.emailId, emailId),
      orderBy: [desc(messages.receivedAt)],
      limit: pageSize,
      offset: offset,
    })

    return NextResponse.json({
      messages: messageList.map(msg => ({
        id: msg.id,
        from: msg.fromAddress || '',
        to: msg.toAddress || '',
        subject: msg.subject,
        receivedAt: msg.receivedAt,
        type: msg.type,
      })),
      total,
      page,
      pageSize,
    })
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return NextResponse.json(
      { error: "获取邮件列表失败" },
      { status: 500 }
    )
  }
}
