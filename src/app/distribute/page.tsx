"use client";

import { Rocket, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DistributePage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[26px] font-bold">全平台分发</h1>
        <p className="text-[13px] text-ink-mute mt-1">
          一键将审阅通过的内容分发至小红书 / 抖音 / 公众号 / 视频号 / B站等渠道。
        </p>
      </header>

      <div className="bg-white border border-surface-border rounded-lg p-10 text-center shadow-soft">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-50 mb-4">
          <Rocket className="w-7 h-7 text-brand-500" />
        </div>
        <h3 className="text-[17px] font-bold mb-2">分发模块正在开发中</h3>
        <p className="text-[13.5px] text-ink-sub max-w-md mx-auto mb-6">
          MVP 阶段我们优先打通「人设 → 批量生成 → 审阅 → 扣费」主链路。
          全平台分发将在下一版本上线，届时支持账号授权、定时发布、失败回滚与渠道数据回流。
        </p>

        <div className="flex items-center justify-center gap-2 text-[13px] text-ink-mute mb-6">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-success" /> 人设档案 · 已上线
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-success ml-3" /> 批量生成 · 已上线
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-success ml-3" /> 审阅台 · 已上线
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-warning ml-3" /> 全平台分发 · Q2 规划
        </div>

        <Link href="/workbench" className="inline-flex items-center gap-2 btn primary">
          去审阅台处理待发布内容
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
