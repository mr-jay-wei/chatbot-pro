import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseAdmin } from "@/lib/supabaseServer"; // 导入我们的服务器端 client

export const runtime = "edge";

export async function POST(request: Request) {
  let currentChatId = ''; // 用于在函数内部传递 chatId
  let fullAssistantResponse = ''; // 用于累积完整的 AI 回复

  try {
    const body = await request.json();
    const clientMessage: string = body.message;
    const chatId: string | null = body.chatId; // 从前端接收 chatId

    if (!clientMessage) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 步骤 1: 保存用户消息，并确保我们有一个 chatId
    if (chatId) {
      currentChatId = chatId;
      await supabaseAdmin.from('messages').insert({
        chat_id: currentChatId,
        role: 'user',
        content: clientMessage,
      });
    } else {
      // 如果没有 chatId，说明是新对话
      // 1. 创建一个新的 chat
      const { data: chatData, error: chatError } = await supabaseAdmin
        .from('chats')
        .insert({})
        .select('id')
        .single();

      if (chatError) throw chatError;
      currentChatId = chatData.id;

      // 2. 保存用户的第一条消息
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

    // 步骤 3: 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            fullAssistantResponse += content; // 累积 AI 回复
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      },
      async cancel() {
        console.log("Stream cancelled by client.");
      },
    });

    // 步骤 4: 返回流式响应，并在 Header 中附带新的 chatId
    // 这样前端就能知道这次对话的 ID 了
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
  } finally {
    // 步骤 5: 在所有操作结束后，无论成功与否，如果收到了完整的 AI 回复，就保存它
    if (fullAssistantResponse && currentChatId) {
      await supabaseAdmin.from('messages').insert({
        chat_id: currentChatId,
        role: 'assistant',
        content: fullAssistantResponse,
      });
      console.log("成功保存助手回复到数据库。");
    }
  }
}