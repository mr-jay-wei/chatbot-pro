import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { auth } from "@clerk/nextjs/server"; // 导入 auth

export const runtime = "nodejs";

interface ApiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function POST(request: Request) {
  try {
    // 步骤 0: 用户身份验证
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const clientMessage: string = body.message;
    let currentChatId: string | null = body.chatId || null;

    if (!clientMessage) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 步骤 1: 保存用户消息
    if (currentChatId) {
      // 如果有 chatId，验证这个 chat 是否属于当前用户 (安全检查)
      const { data: chat, error } = await supabaseAdmin
        .from('chats')
        .select('user_id')
        .eq('id', currentChatId)
        .single();
      
      if (error || chat.user_id !== userId) {
        return NextResponse.json({ error: "Chat not found or access denied" }, { status: 404 });
      }

      await supabaseAdmin.from('messages').insert({
        chat_id: currentChatId,
        role: 'user',
        content: clientMessage,
      });
    } else {
      // 如果是新对话，创建时必须关联当前 userId
      const { data: chatData, error: chatError } = await supabaseAdmin
        .from('chats')
        .insert({ user_id: userId }) // 关联用户 ID
        .select('id')
        .single();

      if (chatError) throw chatError;
      currentChatId = chatData.id;

      await supabaseAdmin.from('messages').insert({
        chat_id: currentChatId,
        role: 'user',
        content: clientMessage,
      });
    }

    // 步骤 1.5: 获取历史消息 (现在会根据用户 ID 过滤，更安全)
    const { data: historyData, error: historyError } = await supabaseAdmin
      .from('messages')
      .select('role, content')
      .eq('chat_id', currentChatId)
      .order('created_at', { ascending: true });

    if (historyError) throw historyError;

    const messagesForApi: ApiMessage[] = [
      { role: "system", content: "你是一个友好且专业的中文 AI 助手。" },
      ...historyData,
    ];

    // 后续步骤（调用 OpenAI，流式响应，保存 AI 回复）保持不变...
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      baseURL: process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1",
    });

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_API_MODEL || "gpt-4o-mini",
      messages: messagesForApi,
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullAssistantResponse = '';
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            fullAssistantResponse += content;
            controller.enqueue(encoder.encode(content));
          }
        }
        if (fullAssistantResponse && currentChatId) {
          await supabaseAdmin.from('messages').insert({
            chat_id: currentChatId,
            role: 'assistant',
            content: fullAssistantResponse,
          });
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Chat-Id": currentChatId,
      },
    });

  } catch (error: any) {
    console.error("API 路由 (带认证) 出错：", error);
    return NextResponse.json(
      { error: error.message || "服务器内部错误" },
      { status: 500 }
    );
  }
}