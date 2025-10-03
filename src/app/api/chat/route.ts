import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const clientMessage: string = body.message;
    // 如果前端传来 chatId，就用它；否则为 null
    let currentChatId: string | null = body.chatId || null;

    if (!clientMessage) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 步骤 1: 保存用户消息，并确保我们有一个 chatId
    // 这部分逻辑和之前一样，但我们把 currentChatId 的赋值放在了外面
    if (currentChatId) {
      await supabaseAdmin.from('messages').insert({
        chat_id: currentChatId,
        role: 'user',
        content: clientMessage,
      });
    } else {
      // 如果是新对话，先创建 chat，再保存 message
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

    // 步骤 2: 调用 OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      baseURL: process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1",
    });

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_API_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: "你是一个友好且专业的中文 AI 助手。" },
        { role: "user", content: clientMessage },
      ],
      stream: true,
    });

    // 步骤 3: 创建流式响应，并在流结束后保存 AI 回复
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullAssistantResponse = ''; // 在流的内部累积回复

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            fullAssistantResponse += content; // 累积
            controller.enqueue(encoder.encode(content)); // 发送给前端
          }
        }

        // --- 核心修正点 ---
        // 当上面的循环结束后，意味着 AI 的回复已经完整
        // 这就是保存 AI 回复到数据库的正确时机！
        if (fullAssistantResponse && currentChatId) {
          try {
            await supabaseAdmin.from('messages').insert({
              chat_id: currentChatId,
              role: 'assistant',
              content: fullAssistantResponse,
            });
            console.log("成功保存助手回复到数据库。");
          } catch (dbError) {
            console.error("保存助手回复到数据库时出错：", dbError);
          }
        }
        
        controller.close(); // 关闭流
      },
    });

    // 步骤 4: 返回流式响应
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Chat-Id": currentChatId, // 将 chatId 放在 Header 中返回
      },
    });

  } catch (error: any) {
    console.error("API 路由出错：", error);
    return NextResponse.json(
      { error: error.message || "服务器内部错误" },
      { status: 500 }
    );
  }
}