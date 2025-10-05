import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 定义公共路由（不需要登录）
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', 
  '/sign-up(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  // 如果不是公共路由，则要求用户登录
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // 排除静态文件和 Next.js 内部路径
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // 始终在根路径和 API 路由上运行
    '/(api|trpc)(.*)',
  ],
};