"use client";

import { FolderKanban, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AssetsPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[26px] font-bold">素材库</h1>
        <p className="text-[13px] text-ink-mute mt-1">
          统一管理品牌资产：Logo、门店照片、产品图、品牌话术、合规素材、历史爆款。
        </p>
      </header>

      <div className="bg-white border border-surface-border rounded-lg p-10 text-center shadow-soft">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-success-soft mb-4">
          <FolderKanban className="w-7 h-7 text-success" />
        </div>
        <h3 className="text-[17px] font-bold mb-2">素材库正在开发中</h3>
        <p className="text-[13.5px] text-ink-sub max-w-md mx-auto mb-6">
          MVP 阶段 AI 生成时暂不引入外部素材检索，直接调用人设档案中的品牌信息。
          素材库模块上线后会支持标签检索、自动生成封面、违规图片过滤和爆款追溯。
        </p>

        <Link href="/profiles" className="inline-flex items-center gap-2 btn primary">
          去完善人设档案中的品牌信息
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
