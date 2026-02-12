import { createDb } from "@/lib/db"
import { eq, and } from "drizzle-orm"
import { NextResponse } from "next/server"
import { emails, messages } from "@/lib/schema"
import { getUserId } from "@/lib/apiKey"

export const runtime = "edge"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; emailId: string; messageId: string }> }
) {
  const currentUserId = await getUserId()

  if (!currentUserId) {
    return NextResponse.json(
      { error: "未授权" },
      { status: 401 }
    )
  }

  try {
    const { id: targetUserId, emailId, messageId } = await params
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

    // 获取邮件详情
    const message = await db.query.messages.findFirst({
      where: and(
        eq(messages.id, messageId),
        eq(messages.emailId, emailId)
      )
    })

    if (!message) {
      return NextResponse.json(
        { error: "邮件不存在" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: {
        id: message.id,
        from_address: message.fromAddress || '',
        to_address: message.toAddress || '',
        subject: message.subject,
        content: message.content,
        html: message.html,
        received_at: message.receivedAt ? new Date(message.receivedAt).getTime() : undefined,
        type: message.type,
      }
    })
  } catch (error) {
    console.error('Failed to fetch message:', error)
    return NextResponse.json(
      { error: "获取邮件详情失败" },
      { status: 500 }
    )
  }
}
