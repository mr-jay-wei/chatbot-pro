"use client";

import React, { useState, FormEvent } from "react";

// 定义消息的类型接口
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [chatId, setChatId] = useState<string | null>(null); // 新增：存储当前对话 ID
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;

    setIsLoading(true);
    const userMessage: Message = { role: 'user', content: currentMessage };
    // 将用户消息和 AI 回复占位符立即添加到历史记录中
    setChatHistory(prev => [...prev, userMessage, { role: 'assistant', content: '' }]);
    setCurrentMessage("");

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentMessage, chatId }), // 发送消息时带上 chatId
      });

      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }
      if (!resp.body) {
        throw new Error("No response body");
      }

      // 从 Header 中获取 chatId 并更新
      const newChatId = resp.headers.get('X-Chat-Id');
      if (newChatId && !chatId) {
        setChatId(newChatId);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        // 实时更新最后一条消息（AI 的回复）
        setChatHistory(prev => {
          const lastMessage = prev[prev.length - 1];
          lastMessage.content += chunk;
          return [...prev.slice(0, -1), lastMessage];
        });
      }
    } catch (err: any) {
      const errorMessage = "发生错误：" + err.message;
      setChatHistory(prev => {
        const lastMessage = prev[prev.length - 1];
        lastMessage.content = errorMessage;
        return [...prev.slice(0, -1), lastMessage];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-2xl h-[80vh] flex flex-col bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center text-gray-800 p-4 border-b">
          ChatBot Pro
        </h1>

        {/* 聊天记录展示区 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}>
                {/* 为了防止 Markdown 被当做 HTML 渲染，我们简单地处理换行 */}
                {msg.content.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 输入区 */}
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              className="flex-1 w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="输入消息..."
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-indigo-600 text-white p-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {isLoading ? "生成中..." : "发送"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}