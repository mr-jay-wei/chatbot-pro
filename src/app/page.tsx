"use client";

import React, { useState, FormEvent, useEffect, useRef } from "react";
import { UserButton } from "@clerk/nextjs";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;

    setIsLoading(true);
    const userMessage: Message = { role: 'user', content: currentMessage };
    setChatHistory(prev => [...prev, userMessage, { role: 'assistant', content: '' }]);
    setCurrentMessage("");

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentMessage, chatId }),
      });

      if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
      if (!resp.body) throw new Error("No response body");

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
        setChatHistory(prev => {
          // 确保我们不会修改旧的状态数组
          const newHistory = [...prev];
          const lastMessage = { ...newHistory[newHistory.length - 1] };
          lastMessage.content += chunk;
          newHistory[newHistory.length - 1] = lastMessage;
          return newHistory;
        });
      }
    } catch (err: any) {
      const errorMessage = "发生错误：" + err.message;
      setChatHistory(prev => {
        const newHistory = [...prev];
        const lastMessage = { ...newHistory[newHistory.length - 1] };
        lastMessage.content = errorMessage;
        newHistory[newHistory.length - 1] = lastMessage;
        return newHistory;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-2xl h-[90vh] flex flex-col bg-white rounded-lg shadow-lg">
        <header className="flex justify-between items-center p-4 border-b">
          <h1 className="text-2xl font-bold text-gray-800">
            ChatBot Pro
          </h1>
          {/* --- 核心修正点 --- */}
          {/* 退出登录后，直接跳转到登录页面，避免二次跳转 */}
          <UserButton afterSignOutUrl="/sign-in" />
        </header>

        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>

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