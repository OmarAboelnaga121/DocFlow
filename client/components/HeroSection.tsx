"use client";

import Link from "next/link";

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="pt-[100px] pb-16 px-6 md:px-8 max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-12 items-center"
    >
      {/* Left — Copy */}
      <div className="lg:w-1/2 flex flex-col gap-5">
        {/* Eyebrow */}
        <div className="font-mono text-[11px] font-medium tracking-[0.06em] uppercase text-primary">
          [ CODEBASE INTELLIGENCE FOR PRODUCT TEAMS ]
        </div>

        {/* Headline */}
        <h1 className="text-[32px] md:text-[48px] font-extrabold leading-[1.1] tracking-[-0.02em] text-text-primary">
          Bridge the Gap Between Your Codebase and Your Business.
        </h1>

        {/* Sub-copy */}
        <p className="text-base leading-relaxed max-w-xl text-text-secondary">
          Transform your architecture into accessible business intelligence.
          DocFlow indexes your codebase, synthesizing complex logic into
          plain-English answers for product managers and stakeholders—eliminating
          engineering bottlenecks and ensuring strategic alignment.
        </p>

        {/* CTAs */}
        <div className="flex gap-4 mt-2 flex-wrap">
          <Link
            href="/register"
            id="hero-trial-btn"
            className="flex items-center gap-2 font-semibold text-sm h-11 px-5 rounded transition-opacity hover:opacity-90 cursor-pointer bg-primary-container text-surface-container-lowest"
          >
            Start Free Trial
            <span className="material-symbols-outlined text-[18px]">
              chevron_right
            </span>
          </Link>
          <Link
            href="/dashboard"
            id="hero-demo-btn"
            className="flex items-center gap-2 font-semibold text-sm h-11 px-5 rounded transition-colors cursor-pointer border border-white/[0.15] text-text-primary hover:bg-surface-variant/40"
          >
            Explore Interactive Demo
          </Link>
        </div>
      </div>

      {/* Right — Code / Chat Preview */}
      <div className="lg:w-1/2 w-full flex rounded shadow-2xl overflow-hidden bg-surface border border-white/[0.08]">
        {/* Code Pane */}
        <div className="w-[45%] flex flex-col border-r border-white/[0.08]">
          {/* Pane Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-surface-container-low border-b border-white/[0.08]">
            <span className="font-mono text-[11px] font-medium tracking-[0.06em] text-on-surface-variant">
              orders.service.ts
            </span>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-[#ff5f56]" />
              <div className="w-2 h-2 rounded-full bg-[#ffbd2e]" />
              <div className="w-2 h-2 rounded-full bg-[#27c93f]" />
            </div>
          </div>

          {/* Code */}
          <div className="p-3 font-mono text-xs overflow-x-auto h-64 leading-relaxed bg-background text-on-background">
            <pre>
              <code>
                <span className="token-keyword">@Injectable</span>(){"\n"}
                <span className="token-keyword">export</span>{" "}
                <span className="token-keyword">class</span>{" "}
                <span className="token-function">OrdersService</span> {"{"}{"\n"}
                {"  "}<span className="token-keyword">constructor</span>(
                <span className="token-keyword">private</span> prisma:{" "}
                <span className="token-function">PrismaService</span>) {"{}"}
                {"\n\n"}
                {"  "}<span className="token-keyword">async</span>{" "}
                <span className="token-function">processOrder</span>(
                {"\n"}
                {"    "}orderDto:{" "}
                <span className="token-function">CreateOrderDto</span>) {"{"}{"\n"}
                {"    "}<span className="token-comment">// Verify inventory</span>
                {"\n"}
                {"    "}<span className="token-keyword">const</span> inventory ={" "}
                <span className="token-keyword">await</span>{" "}
                <span className="token-keyword">this</span>.prisma.inventory
                {"\n"}
                {"      "}.findUnique({"{"} where: {"{"} id: orderDto.itemId {"}"}{" "}
                {"}"});{"\n\n"}
                {"    "}<span className="token-keyword">if</span> (inventory.stock {"<"}{" "}
                orderDto.quantity) {"{"}{"\n"}
                {"      "}<span className="token-keyword">throw new</span>{" "}
                <span className="token-function">InsufficientStockException</span>();
                {"\n"}
                {"    }"}{"\n\n"}
                {"    "}<span className="token-comment">// Apply VIP rules</span>
                {"\n"}
                {"    "}<span className="token-keyword">let</span> discount = 0;{"\n"}
                {"    "}<span className="token-keyword">if</span> (orderDto.isVip{" "}
                {"&&"} orderDto.total {">"} 500) {"{"}{"\n"}
                {"      "}discount = 0.15;{" "}
                <span className="token-comment">// 15% VIP discount</span>
                {"\n"}
                {"    }"}{"\n"}
                {"  }"}{"\n"}
                {"}"}
              </code>
            </pre>
          </div>
        </div>

        {/* Chat Pane */}
        <div className="w-[55%] flex flex-col bg-surface-container-lowest">
          {/* Pane Header */}
          <div className="flex items-center gap-1 px-3 py-2 bg-surface-container-low border-b border-white/[0.08]">
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
              chat
            </span>
            <span className="font-mono text-[11px] font-medium tracking-[0.06em] text-on-surface-variant">
              DocFlow Query
            </span>
          </div>

          {/* Chat Messages */}
          <div className="p-3 flex flex-col gap-3 h-64 overflow-y-auto">
            {/* User query */}
            <div className="self-end font-mono text-xs p-2 rounded w-4/5 bg-surface-variant/30 border border-white/[0.08] text-on-background">
              &gt; What business rules apply to VIP orders?
            </div>

            {/* AI Answer */}
            <div className="flex flex-col gap-1 w-11/12 p-2 rounded bg-surface-container border border-primary/30">
              <div className="flex items-center gap-1 font-mono text-[10px] font-medium tracking-[0.06em] text-primary">
                <span className="material-symbols-outlined text-[14px]">
                  check_circle
                </span>
                Verified Answer
              </div>
              <p className="text-xs leading-relaxed mt-1 text-on-background">
                For VIP orders, a{" "}
                <strong className="text-primary">15% discount</strong> is
                applied automatically if the order total exceeds{" "}
                <strong className="text-primary">$500</strong>. This logic is
                handled during the order processing phase.
              </p>
              <div className="mt-2 pt-1 flex justify-between items-center border-t border-white/[0.08]">
                <span className="font-mono text-[10px] text-on-surface-variant">
                  Source: orders.service.ts
                </span>
                <span className="font-mono text-[10px] text-primary">
                  Lines 16–19
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
