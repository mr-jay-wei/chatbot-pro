# 项目概览：chatbot-pro

本文档由`generate_project_overview.py`自动生成，包含了项目的结构树和所有可读文件的内容。

## 项目结构

```
chatbot-pro/
├── public
├── src
│   ├── app
│   │   ├── api
│   │   │   └── chat
│   │   │       └── route.ts
│   │   ├── sign-in
│   │   │   └── [[...sign-in]]
│   │   │       └── page.tsx
│   │   ├── sign-up
│   │   │   └── [[...sign-up]]
│   │   │       └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── lib
│   │   └── supabaseServer.ts
│   └── middleware.ts
├── test
│   └── route.ts
├── .env-copy-example
├── .gitignore
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── README.md
└── tsconfig.json
```

---

# 文件内容

## `.env-copy-example`

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="xxx"
CLERK_SECRET_KEY="xxx"

NEXT_PUBLIC_SUPABASE_URL="xxx"
NEXT_PUBLIC_SUPABASE_ANON_KEY="xxx.xxx.xxx"
SUPABASE_SERVICE_KEY="xxx.xxx.xxx"


# 你的OpenAI兼容API的密钥
OPENAI_API_KEY="xxx"
OPENAI_API_BASE_URL="xxx"
OPENAI_API_MODEL="your-model-name"
```

## `.gitignore`

```
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files (can opt-in for committing if needed)
.env*

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

```

## `eslint.config.mjs`

```
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;

```

## `next-env.d.ts`

```typescript
/// <reference types="next" />
/// <reference types="next/image-types/global" />
/// <reference path="./.next/types/routes.d.ts" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.

```

## `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

```

## `package.json`

```json
{
  "name": "chatbot-pro",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 8080",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@clerk/nextjs": "^6.33.2",
    "@supabase/supabase-js": "^2.58.0",
    "next": "15.5.4",
    "openai": "^6.0.1",
    "react": "19.1.0",
    "react-dom": "19.1.0"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "eslint": "^9",
    "eslint-config-next": "15.5.4",
    "tailwindcss": "^4",
    "typescript": "^5.9.3"
  }
}

```

## `postcss.config.mjs`

```
const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default config;

```

## `README.md`

````text
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

#\# Getting Started

First, run the development server:

\`\`\`bash
npm run dev
\# or
yarn dev
\# or
pnpm dev
\# or
bun dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

#\# Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

#\# Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

````

## `src/app/api/chat/route.ts`

```typescript
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
```

## `src/app/globals.css`

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}

```

## `src/app/layout.tsx`

```

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'; // 导入 ClerkProvider
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChatBot Next.js",
  description: "A smart chatbot project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 使用 ClerkProvider 包裹整个应用
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

## `src/app/page.tsx`

```
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
```

## `src/app/sign-in/[[...sign-in]]/page.tsx`

```
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <SignIn />
    </div>
  );
}
```

## `src/app/sign-up/[[...sign-up]]/page.tsx`

```
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <SignUp />
    </div>
  );
}
```

## `src/lib/supabaseServer.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

// 注意：这里的 Client 是用于服务器端的，使用了拥有最高权限的 SERVICE_KEY
// 这个文件不应该在任何客户端组件中导入
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase URL or Service Key is not defined in environment variables.");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
```

## `src/middleware.ts`

```typescript
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  // 将登录、注册页面及其所有子路径定义为公共路由
  publicRoutes: ["/sign-in(.*)", "/sign-up(.*)"],
});

export const config = {
  matcher: [
    // 排除所有包含点的文件路径 (e.g., static assets) 和 Next.js 内部路径 (_next)
    "/((?!.*\\..*|_next).*)",
    // 在根路径上运行
    "/",
    // 在所有 API 和 tRPC 路由上运行
    "/(api|trpc)(.*)",
  ],
};
```

## `test/route.ts`

```typescript
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

```

## `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "jsxImportSource": "react",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": [
        "./src/*"
      ]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}

```

