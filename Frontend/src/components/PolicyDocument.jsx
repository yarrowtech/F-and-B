import { useCallback, useEffect, useState } from "react";
import Header from "./Header";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const HEADING_RE = /^(\d+)\.?\s+(\S.*)$/;
const CLAUSE_RE = /^(\d+(?:\.\d+)+\.?)\s+(\S.*)$/;
const SUB_ITEM_RE = /^(\([a-z]{1,4}\))\s+(\S.*)$/i;
const URL_RE = /(https?:\/\/[^\s)”"]*[^\s).,;”"])/g;

const clean = (text) => text.replace(/\s+/g, " ").trim();

const isUpperCaseHeading = (text) =>
  text.length <= 120 && /[A-Z]/.test(text) && text === text.toUpperCase();

// The API serves plain text; numbering and indentation are recovered from each line's prefix.
const parseContent = (content, title) => {
  const lines = String(content || "")
    .split(/\r?\n/)
    .map(clean)
    .filter(Boolean);

  if (lines[0] && lines[0].toUpperCase() === String(title || "").toUpperCase()) {
    lines.shift();
  }

  return lines.map((line, index) => {
    const heading = line.match(HEADING_RE);
    if (heading && isUpperCaseHeading(heading[2])) {
      return { kind: "heading", key: index, number: heading[1], text: heading[2] };
    }

    const clause = line.match(CLAUSE_RE);
    if (clause) return { kind: "clause", key: index, number: clause[1], text: clause[2] };

    const subItem = line.match(SUB_ITEM_RE);
    if (subItem) return { kind: "sub", key: index, number: subItem[1], text: subItem[2] };

    return { kind: "paragraph", key: index, text: line };
  });
};

const renderText = (text) =>
  text.split(URL_RE).map((part, index) =>
    index % 2 === 1 ? (
      <a
        key={index}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="break-words font-semibold text-[#a45d23] underline underline-offset-2 hover:text-[#7c4318]"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );

const formatDate = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
};

function PolicyBlock({ block }) {
  const body = "mt-3 text-sm leading-7 text-[#6a5648] md:text-[15px]";

  if (block.kind === "heading") {
    return (
      <h2 className="mt-10 border-b border-[#eadfce] pb-2 text-lg font-black text-[#2d1b12] first:mt-0 md:text-xl">
        <span className="mr-3 text-[#a45d23]">{block.number}.</span>
        {block.text}
      </h2>
    );
  }

  if (block.kind === "clause" || block.kind === "sub") {
    return (
      <div className={`flex gap-3 ${body} ${block.kind === "sub" ? "pl-8 md:pl-12" : ""}`}>
        <span className="w-12 shrink-0 font-semibold text-[#8a6a52]">{block.number}</span>
        <p className="min-w-0 flex-1">{renderText(block.text)}</p>
      </div>
    );
  }

  return <p className={body}>{renderText(block.text)}</p>;
}

function PolicySkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading">
      {[92, 100, 84, 96, 70, 100, 88, 60].map((width, index) => (
        <div
          key={index}
          className="h-4 rounded bg-[#eadfce]"
          style={{ width: `${width}%` }}
        />
      ))}
    </div>
  );
}

export default function PolicyDocument({ slug, fallbackTitle, intro }) {
  const [policy, setPolicy] = useState(null);
  const [status, setStatus] = useState("loading");

  const load = useCallback(
    (signal) => {
      setStatus("loading");

      fetch(`${API_BASE_URL}/policies/${slug}`, { signal })
        .then(async (res) => {
          const body = await res.json().catch(() => null);
          if (!res.ok || !body?.data?.content) throw new Error("Policy unavailable");
          setPolicy(body.data);
          setStatus("ready");
        })
        .catch((err) => {
          if (err.name !== "AbortError") setStatus("error");
        });
    },
    [slug],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const title = policy?.title || fallbackTitle;
  const effective = formatDate(policy?.effectiveDate);
  const updated = formatDate(policy?.publishedAt || policy?.updatedAt);
  const blocks = policy ? parseContent(policy.content, policy.title) : [];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6f1ea_0%,#fffaf5_48%,#f3efe8_100%)] text-[#21160f]">
      <Header />

      <main className="px-4 pb-16 pt-28 md:px-8">
        <section className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-[#d9cbb9] bg-white/88 shadow-[0_30px_90px_-50px_rgba(35,20,12,0.45)] backdrop-blur">
          <div className="border-b border-[#eadfce] bg-[radial-gradient(circle_at_top_left,#f8e7c9,transparent_42%),linear-gradient(135deg,#fffaf3,#f5ede2)] px-6 py-10 md:px-10">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#a45d23]">
              Legal
            </p>
            <h1 className="mt-3 text-3xl font-black text-[#24140d] md:text-5xl">{title}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#6b5445] md:text-base">
              {policy?.summary || intro}
            </p>
            {status === "ready" && (effective || updated) && (
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6a52]">
                {effective && <span>Effective {effective}</span>}
                {effective && updated && <span className="mx-2">|</span>}
                {updated && <span>Last updated {updated}</span>}
              </p>
            )}
          </div>

          <div className="px-6 py-8 md:px-10 md:py-10">
            {status === "loading" && <PolicySkeleton />}

            {status === "error" && (
              <div className="rounded-[1.5rem] border border-[#ede2d3] bg-[#fffdfa] p-6 text-center">
                <p className="text-sm leading-7 text-[#6a5648] md:text-[15px]">
                  We could not load this document right now. Please try again in a moment.
                </p>
                <button
                  type="button"
                  onClick={() => load()}
                  className="mt-4 rounded-full bg-[#a45d23] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#7c4318]"
                >
                  Try again
                </button>
              </div>
            )}

            {status === "ready" && (
              <article>
                {blocks.map((block) => (
                  <PolicyBlock key={block.key} block={block} />
                ))}
              </article>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
