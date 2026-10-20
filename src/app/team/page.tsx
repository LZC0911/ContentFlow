"use client";

import { Users, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function TeamPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[26px] font-bold">团队与成员</h1>
        <p className="text-[13px] text-ink-mute mt-1">
          成员管理、角色权限、额度分配、操作审计。
        </p>
      </header>

      <div className="bg-white border border-surface-border rounded-lg p-10 text-center shadow-soft">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-info-soft mb-4">
          <Users className="w-7 h-7 text-info" />
        </div>
        <h3 className="text-[17px] font-bold mb-2">团队管理正在开发中</h3>
        <p className="text-[13.5px] text-ink-sub max-w-md mx-auto mb-6">
          MVP 阶段默认单租户单角色（创建者即管理员）。团队管理将在下一版本上线，
          支持邀请成员、角色（审阅者 / 生成者 / 管理员）、额度按人分配、审计日志。
        </p>

        <Link href="/billing" className="inline-flex items-center gap-2 btn primary">
          查看订阅档位与席位
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
