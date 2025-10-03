import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "nodejs";

// 定义 API 消息的类型接口，确保类型安全
interface ApiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const clientMessage: string = body.message;
    let currentChatId: string | null = body.chatId || null;

    if (!clientMessage) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 步骤 1: 保存用户消息，并确保我们有一个 chatId (逻辑不变)
    if (currentChatId) {
      await supabaseAdmin.from('messages').insert({
        chat_id: currentChatId,
        role: 'user',
        content: clientMessage,
      });
    } else {
      const { data: chatData, error: chatError } = await supabaseAdmin
        .from('chats')
        .insert({})
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

    // --- 核心升级点：获取历史消息 ---
    // 步骤 1.5: 从数据库获取当前对话的完整历史记录
    const { data: historyData, error: historyError } = await supabaseAdmin
      .from('messages')
      .select('role, content')
      .eq('chat_id', currentChatId)
      .order('created_at', { ascending: true }); // 必须按时间排序

    if (historyError) throw historyError;

    // 构造发送给 OpenAI API 的 messages 数组
    const messagesForApi: ApiMessage[] = [
      { role: "system", content: "你是一个友好且专业的中文 AI 助手，请根据上下文进行回复。" },
      // 注意：我们从数据库获取的历史消息已经包含了最新的用户消息
      ...historyData, 
    ];

    // 注意：为了防止上下文过长超出 token 限制，在生产环境中可能需要截断历史消息。
    // 例如，只取最近的 10 条消息。这里为了演示，我们发送全部历史。


    // 步骤 2: 调用 OpenAI，但使用我们构造的完整历史消息
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      baseURL: process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1",
    });

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_API_MODEL || "gpt-4o-mini",
      messages: messagesForApi, // 使用包含完整历史的数组
      stream: true,
    });

    // 步骤 3 和 4: 流式响应和保存 AI 回复 (逻辑不变)
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
          try {
            await supabaseAdmin.from('messages').insert({
              chat_id: currentChatId,
              role: 'assistant',
              content: fullAssistantResponse,
            });
            console.log("成功保存 (带记忆的) 助手回复到数据库。");
          } catch (dbError) {
            console.error("保存助手回复到数据库时出错：", dbError);
          }
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
    console.error("API 路由 (带记忆) 出错：", error);
    return NextResponse.json(
      { error: error.message || "服务器内部错误" },
      { status: 500 }
    );
  }
}