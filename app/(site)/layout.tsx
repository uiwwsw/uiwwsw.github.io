import type { Metadata } from 'next';
import { SiteFooter } from '@/components/footer/site-footer';
import { SiteHeader } from '@/components/navigation/site-header';
import { buildMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildMetadata();

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-12 lg:px-6">
          <div className="lg:col-span-8 xl:col-span-9">
            {children}
          </div>
          <aside className="hidden space-y-4 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 text-sm text-slate-300 shadow-inner lg:block lg:col-span-4 xl:col-span-3">
            <p className="text-xs uppercase tracking-[0.2em] text-sky-300">레이아웃 가이드</p>
            <p className="leading-relaxed">
              모바일 우선 내비게이션과 접근성을 고려한 헤더/푸터가 포함된 공용 레이아웃입니다. 화면 크기에 따라 네비게이션
              시트가 토글되고, 본문은 최대 폭 6xl로 정렬됩니다.
            </p>
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 px-3 py-3">
              <p className="font-semibold text-white">메타/OG 템플릿</p>
              <p className="mt-1 text-slate-400">lib/metadata.ts 에서 title 템플릿과 Open Graph, Twitter 카드를 설정했습니다.</p>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
