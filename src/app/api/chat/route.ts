
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs"; // Edge Runtime 更适合流式

/**
 * @description 处理 POST /api/hello 请求，调用 OpenAI 流式输出
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const clientMessage: string = body.message || "没有收到消息";

    console.log("收到来自客户端的消息：", clientMessage);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      baseURL: process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1",
    });

    // 调用 OpenAI 流式接口
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_API_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: "你是一个友好且专业的中文 AI 助手。" },
        { role: "user", content: clientMessage },
      ],
      stream: true,
    });

    const encoder = new TextEncoder();

    // 用 ReadableStream 包装流式数据
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
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
