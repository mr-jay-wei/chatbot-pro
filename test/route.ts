import { NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * @description 处理 POST /api/hello 请求，调用 OpenAI 大模型生成回复
 * @param {Request} request - 客户端发来的请求对象
 * @returns {NextResponse} - 返回给客户端的响应
 */
export async function POST(request: Request) {
  try {
    // 解析请求体
    const body = await request.json();
    const clientMessage: string = body.message || "没有收到消息";

    console.log("收到来自客户端的消息：", clientMessage);

    // 初始化 OpenAI SDK
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1",
    });

    // 调用 OpenAI Chat Completion
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_API_MODEL || "gpt-4o-mini", // 默认用最新的轻量模型
      messages: [
        { role: "system", content: "你是一个友好且专业的中文 AI 助手。" },
        { role: "user", content: clientMessage },
      ],
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content?.trim() || "（未生成回复）";

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("API 路由出错：", error);
    return NextResponse.json(
      { error: error.message || "服务器内部错误" },
      { status: 500 }
    );
  }
}
