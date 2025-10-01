import { NextResponse } from "next/server";

/**
 * @description 处理 POST /api/hello 请求
 * @param {Request} request - 客户端发来的请求对象
 * @returns {NextResponse} - 返回给客户端的响应
 */
export async function POST(request: Request) {
  try {
    // 解析请求体中的 JSON 数据
    const body = await request.json();
    const clientMessage = body.message || "没有收到消息";

    // 打印收到的消息，方便调试
    console.log("收到来自客户端的消息：", clientMessage);

    // 构造一个简单的回复
    const reply = `你好，我收到了你的消息：'${clientMessage}'。这是一个来自后端服务器的自动回复。`;

    // 使用 NextResponse.json 返回一个 JSON 响应
    return NextResponse.json({ reply });

  } catch (error) {
    // 如果解析 JSON 或处理过程中出错
    console.error("API 路由出错：", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}