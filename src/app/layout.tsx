import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { ToastProvider } from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "ContentFlow · AI 内容批量生产工具",
  description: "面向电商/MCN/本地商家的脚本、图文、口播批量生成 + 一键多平台分发",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
