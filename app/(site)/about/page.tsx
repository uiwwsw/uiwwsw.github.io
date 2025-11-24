import { buildMetadata } from '@/lib/metadata';
import { englishSummary, principles, skillStacks, timeline } from './data';

export const metadata = buildMetadata({
  title: 'About',
  description: '9+년간 커머스·여행·핀테크를 리드한 프런트엔드/프로덕트 엔지니어의 실무 스토리와 원칙.',
});

export default function AboutPage() {
  return (
    <div className="space-y-12 text-slate-100">
      <section className="space-y-6 rounded-3xl border border-slate-800/80 bg-slate-900/50 p-6 shadow-inner">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3 lg:max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-sky-300">About</p>
            <h1 className="text-3xl font-bold text-white lg:text-4xl">9+년, 제품을 기준으로 움직인 이야기</h1>
            <p className="text-base leading-relaxed text-slate-200">
              커머스·여행·핀테크에서 KPI를 명확히 정의하고, 디자인/성능/DX를 균형 있게 맞추는 구조를 설계해 왔습니다.
              리서치-실험-모니터링을 한 흐름으로 묶어 팀이 빠르게 학습하도록 돕습니다.
            </p>
            <p className="text-base leading-relaxed text-slate-300">
              반복되는 설정은 OSS 패키지화하고, 실험 플래그·관찰 지점을 먼저 설계해 리스크를 줄입니다. 코드 퀄리티보다
              제품 목표와 사용자 경험을 우선으로 두지만, 그 목표를 오래 유지할 수 있는 도구와 시스템을 만듭니다.
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-200">
              {["Product Engineer", "Design System", "Performance", "Experiment", "DX"].map((tag) => (
                <span key={tag} className="rounded-full border border-slate-800 px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="w-full max-w-sm rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-[0.2em] text-sky-300">English Summary</p>
            <ul className="mt-3 space-y-2">
              {englishSummary.map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden>•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[{ label: '경력', value: '9+년' }, { label: '최근 역량', value: 'RSC · Design System · Growth' }, { label: '관점', value: '디자인/성능/DX 균형' }].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-800/70 bg-slate-950/40 px-4 py-3 text-sm text-slate-200"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-sky-300">{stat.label}</p>
              <p className="mt-1 text-lg font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Timeline</p>
            <h2 className="text-2xl font-semibold text-white">도메인과 팀을 옮기며 만든 결과</h2>
            <p className="text-slate-300">실험 설계, 성능 예산, 디자인 시스템을 공통 언어로 삼아 팀을 이끌었습니다.</p>
          </div>
          <span className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-200">Fact based</span>
        </header>
        <div className="space-y-4">
          {timeline.map((item) => (
            <article
              key={item.period}
              className="rounded-3xl border border-slate-800/80 bg-slate-950/50 p-5 shadow-sm transition hover:border-slate-700"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-300">{item.period}</p>
                  <h3 className="text-xl font-semibold text-white">{item.role}</h3>
                  <p className="text-sm text-slate-300">{item.org}</p>
                </div>
                <div className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200">실험 · 시스템 · 지표</div>
              </div>
              <p className="mt-3 text-base leading-relaxed text-slate-200">{item.story}</p>
              <ul className="mt-4 grid gap-2 md:grid-cols-3">
                {item.achievements.map((achievement) => (
                  <li
                    key={achievement}
                    className="flex gap-2 rounded-xl border border-slate-800/70 bg-slate-900/60 p-3 text-sm text-slate-200"
                  >
                    <span aria-hidden className="text-sky-300">
                      ↳
                    </span>
                    <span>{achievement}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Skill Stack</p>
            <h2 className="text-2xl font-semibold text-white">제품을 빠르게 전달하기 위한 스택</h2>
            <p className="text-slate-300">RSC/SSR, 디자인 시스템, 성장 실험을 위한 데이터 레이어가 중심입니다.</p>
          </div>
          <span className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-200">실무 중심</span>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          {skillStacks.map((stack) => (
            <article
              key={stack.title}
              className="rounded-3xl border border-slate-800/80 bg-slate-950/60 p-5 shadow-sm transition hover:border-slate-700"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-sky-300">{stack.title}</p>
              <h3 className="mt-2 text-lg font-semibold text-white">{stack.description}</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                {stack.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Principles</p>
            <h2 className="text-2xl font-semibold text-white">일을 풀어내는 방식</h2>
            <p className="text-slate-300">디자인/성능/DX의 균형과 실험 가능성을 동시에 가져가는 프로세스를 유지합니다.</p>
          </div>
          <span className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-200">Collaboration</span>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          {principles.map((principle) => (
            <article
              key={principle.title}
              className="rounded-3xl border border-slate-800/80 bg-slate-950/60 p-5 shadow-sm transition hover:border-slate-700"
            >
              <h3 className="text-lg font-semibold text-white">{principle.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">{principle.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-inner">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-sky-300">How I help</p>
            <h2 className="text-2xl font-semibold text-white">문제 정의 → 실험 → 운영까지 함께합니다</h2>
            <p className="text-slate-200">
              요구사항을 사용자 여정과 지표로 번역하고, 배포/모니터링/회고가 이어지는 흐름을 만듭니다.
            </p>
            <ul className="space-y-1 text-sm text-slate-200">
              <li>• PRD에 성공/실패 가설, 롤백 시나리오를 명시하고 QA 스크립트를 자동화합니다.</li>
              <li>• 성능 예산과 접근성 기준을 정의해 디자인/개발/QA가 공유하는 체크리스트를 유지합니다.</li>
              <li>• 실험 플래그와 이벤트 스키마를 선배치해 실험 후 학습 시간을 단축합니다.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
            <p className="font-semibold text-white">함께 만들 준비가 되셨나요?</p>
            <p className="mt-1 text-slate-300">지표·사용자·팀의 제약을 공유해 주시면 구조부터 차근히 설계하겠습니다.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href="mailto:hello@example.com"
                className="rounded-md bg-sky-500 px-3 py-2 text-xs font-semibold text-slate-950 shadow transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                이메일 보내기
              </a>
              <a
                href="https://github.com/uiwwsw"
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
