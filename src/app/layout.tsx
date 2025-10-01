import type { Metadata } from "next";
import { Inter } from "next/font/google"; // 使用一个标准的、不易出错的字体
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChatBot Pro",
  description: "A smart chatbot project",
};


// RootLayouts 是 Next.js 中用于定义应用程序整体布局的组件。
// {children,}表示 page.tsx 的内容
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 将 className 应用到 body 上 */}
      <body className={inter.className}>{children}</body>
    </html>
  );
}