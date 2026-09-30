import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  MessageCircle,
  Hash,
  Camera,
  Wand2,
  Type as TypeIcon,
  Calendar,
  Award,
  Image as ImageIcon,
  Sparkles,
  Search,
  BookOpen,
  Heart,
  Repeat2,
  Send,
  ChevronDown,
  Compass,
  Play,
  Pause,
  RotateCcw,
  Network,
  ClipboardList,
  Clock3,
  ArrowDown,
  Workflow,
} from "lucide-react";

/* ----------------------------------------------------------------------- */
/*  Palette (used as CSS custom properties — see <GlobalStyles/>)          */
/*  navy  #0E1B32   navy-deep #08101F   cream #F8F3E8                      */
/*  coral #E2703A   teal #1F6F68        gold  #C89B3C                      */
/* ----------------------------------------------------------------------- */

const SECTIONS = [
  { id: "sec-open", label: "Opening" },
  { id: "sec-admin", label: "Hidden Admin" },
  { id: "sec-map", label: "Today’s Map" },
  { id: "sec-social", label: "Communication" },
  { id: "sec-tools-intro", label: "Daily Tools" },
  { id: "sec-tools", label: "Daily Tools" },
  { id: "sec-ai", label: "Artificial Intelligence" },
  { id: "sec-close", label: "Conclusion" },
];

/* ---------------------------- Hooks ------------------------------------ */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);
  return reduced;
}

function useInView(threshold = 0.3, reduced = false) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (reduced) {
      setInView(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.unobserve(el);
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, reduced]);
  return [ref, inView];
}

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const doc = document.documentElement;
        const scrollTop = doc.scrollTop || document.body.scrollTop;
        const height = doc.scrollHeight - doc.clientHeight;
        setProgress(height > 0 ? Math.min(1, Math.max(0, scrollTop / height)) : 0);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return progress;
}

function useActiveSection(ids) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = ids.indexOf(entry.target.id);
            if (idx !== -1) setActive(idx);
          }
        });
      },
      { threshold: 0.5 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [ids]);
  return active;
}

/* --------------------------- Reveal text -------------------------------- */

function RevealWords({ text, reduced, delay = 0, stagger = 0.045, className = "", style = {}, as: Tag = "span" }) {
  const [ref, inView] = useInView(0.45, reduced);
  const words = text.split(" ");
  return (
    <Tag ref={ref} className={className} style={{ ...style, display: "inline" }}>
      {words.map((w, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            willChange: "transform, opacity",
            transform: reduced ? "none" : inView ? "translateY(0)" : "translateY(0.5em)",
            opacity: reduced ? 1 : inView ? 1 : 0,
            transition: reduced
              ? "none"
              : `transform 0.85s cubic-bezier(.22,1,.36,1) ${delay + i * stagger}s, opacity 0.7s ease ${
                  delay + i * stagger
                }s`,
          }}
        >
          {w}
          {i < words.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </Tag>
  );
}

function Fade({ children, reduced, delay = 0, y = 18, className = "", threshold = 0.25 }) {
  const [ref, inView] = useInView(threshold, reduced);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: reduced ? 1 : inView ? 1 : 0,
        transform: reduced ? "none" : inView ? "translateY(0)" : `translateY(${y}px)`,
        transition: reduced ? "none" : `opacity 0.8s ease ${delay}s, transform 0.8s cubic-bezier(.22,1,.36,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------ Global styles ---------------------------- */

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600&display=swap');

      html, body {
        margin: 0;
        padding: 0;
      }
      .ptp-root {
        --navy: #0E1B32;
        --navy-deep: #08101F;
        --cream: #F8F3E8;
        --coral: #E2703A;
        --teal: #1F6F68;
        --gold: #C89B3C;
        font-family: 'Inter', -apple-system, sans-serif;
        background: var(--cream);
        color: var(--navy);
        text-align: left;
      }
      .ptp-root * { box-sizing: border-box; }
      .ptp-root h1,
      .ptp-root h2,
      .ptp-root h3 { margin: 0; letter-spacing: normal; }
      .ptp-display { font-family: 'Fraunces', Georgia, serif; }
      .ptp-section { scroll-margin-top: 0; }

      /* Neutralize the host page's #root shell (width cap / border / centering)
         so this presentation can render full-bleed. Scoped so it only applies
         when this component is mounted, leaving other pages untouched. */
      #root:has(.ptp-root) {
        width: 100%;
        max-width: 100%;
        margin: 0;
        border-inline: none;
        text-align: left;
        display: block;
      }

      .ptp-root :focus-visible {
        outline: 2px solid var(--gold);
        outline-offset: 3px;
        border-radius: 2px;
      }

      @keyframes ptp-float {
        0%, 100% { transform: translateY(0); opacity: var(--o, 0.6); }
        50% { transform: translateY(-18px); opacity: calc(var(--o, 0.6) * 0.5); }
      }
      @keyframes ptp-drift {
        0% { transform: translate(0,0); }
        50% { transform: translate(6px,-10px); }
        100% { transform: translate(0,0); }
      }
      @keyframes ptp-bob {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(8px); }
      }
      @keyframes ptp-pulse-soft {
        0%, 100% { opacity: 0.35; }
        50% { opacity: 0.85; }
      }
      @keyframes ptp-spin-slow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes ptp-rise {
        from { transform: translateY(24px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes ptp-in {
        from { opacity: 0; transform: scale(0.94); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes ptp-star-fall {
        0% { transform: translate3d(0, -12vh, 0) rotate(0deg) scale(var(--scale, 1)); opacity: 0; }
        8% { opacity: var(--star-o, 0.8); }
        88% { opacity: var(--star-o, 0.8); }
        100% { transform: translate3d(var(--drift, 0px), 112vh, 0) rotate(150deg) scale(var(--scale, 1)); opacity: 0; }
      }

      .ptp-reduced * {
        animation: none !important;
        transition-duration: 0.01s !important;
      }

      /* ---------------------------------------------------------------
         Minimal utility shim.
         This file was authored with Tailwind-style class names, but the
         host project has no Tailwind build configured (no tailwind.config,
         no @tailwind directives). Rather than depend on a utility engine
         that may or may not exist in whatever project this is dropped
         into, every class name actually used above is defined here by
         hand, scoped under .ptp-root so it can never affect anything
         else on the host page.
         ----------------------------------------------------------------*/
      .ptp-root .block { display: block; }
      .ptp-root .flex { display: flex; }
      .ptp-root .inline-flex { display: inline-flex; }
      .ptp-root .grid { display: grid; }
      .ptp-root .hidden { display: none; }
      .ptp-root .flex-col { flex-direction: column; }
      .ptp-root .flex-wrap { flex-wrap: wrap; }
      .ptp-root .items-center { align-items: center; }
      .ptp-root .justify-center { justify-content: center; }
      .ptp-root .justify-end { justify-content: flex-end; }
      .ptp-root .text-center { text-align: center; }
      .ptp-root .relative { position: relative; }
      .ptp-root .z-10 { z-index: 10; }
      .ptp-root .w-full { width: 100%; }
      .ptp-root .min-h-screen { min-height: 100vh; min-height: 100dvh; }
      .ptp-root .overflow-hidden { overflow: hidden; }
      .ptp-root .mx-auto { margin-left: auto; margin-right: auto; }
      .ptp-root .mr-1 { margin-right: 0.25rem; }
      .ptp-root .mb-1\.5 { margin-bottom: 0.375rem; }
      .ptp-root .mb-3 { margin-bottom: 0.75rem; }
      .ptp-root .mb-4 { margin-bottom: 1rem; }
      .ptp-root .mb-5 { margin-bottom: 1.25rem; }
      .ptp-root .mb-6 { margin-bottom: 1.5rem; }
      .ptp-root .mb-10 { margin-bottom: 2.5rem; }
      .ptp-root .mb-16 { margin-bottom: 4rem; }
      .ptp-root .mt-2 { margin-top: 0.5rem; }
      .ptp-root .mt-8 { margin-top: 2rem; }
      .ptp-root .mt-14 { margin-top: 3.5rem; }
      .ptp-root .mt-16 { margin-top: 4rem; }
      .ptp-root .pb-3 { padding-bottom: 0.75rem; }
      .ptp-root .pt-8 { padding-top: 2rem; }
      .ptp-root .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
      .ptp-root .py-14 { padding-top: 3.5rem; padding-bottom: 3.5rem; }
      .ptp-root .py-24 { padding-top: 6rem; padding-bottom: 6rem; }
      .ptp-root .gap-2 { gap: 0.5rem; }
      .ptp-root .gap-2\.5 { gap: 0.625rem; }
      .ptp-root .gap-3 { gap: 0.75rem; }
      .ptp-root .gap-4 { gap: 1rem; }
      .ptp-root .gap-6 { gap: 1.5rem; }
      .ptp-root .gap-10 { gap: 2.5rem; }
      .ptp-root .gap-14 { gap: 3.5rem; }
      .ptp-root .max-w-3xl { max-width: 48rem; }
      .ptp-root .max-w-4xl { max-width: 56rem; }
      .ptp-root .max-w-6xl { max-width: 72rem; }
      .ptp-root .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }

      .ptp-root .group:hover .group-hover\:opacity-100,
      .ptp-root .group:focus .group-hover\:opacity-100,
      .ptp-root .group:hover .group-focus\:opacity-100,
      .ptp-root .group:focus .group-focus\:opacity-100 {
        opacity: 1;
        transform: translateX(0);
      }

      @media (min-width: 768px) {
        .ptp-root .md\:flex { display: flex; }
        .ptp-root .md\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .ptp-root .md\:px-14 { padding-left: 3.5rem; padding-right: 3.5rem; }
      }

      @media (min-width: 1024px) {
        .ptp-root .lg\:flex-row { flex-direction: row; }
        .ptp-root .lg\:flex-row-reverse { flex-direction: row-reverse; }
        .ptp-root .lg\:w-1\/2 { width: 50%; }
        .ptp-root .lg\:w-2\/5 { width: 40%; }
        .ptp-root .lg\:w-3\/5 { width: 60%; }
        .ptp-root .lg\:gap-16 { gap: 4rem; }
        .ptp-root .lg\:px-24 { padding-left: 6rem; padding-right: 6rem; }
      }

      .ptp-scrollbar::-webkit-scrollbar { width: 0; height: 0; }

      .ptp-line-clamp-3 {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      @media (max-width: 767px) {
        .ptp-session-timer { right: 0.75rem !important; top: 0.75rem !important; bottom: auto !important; transform: none !important; }
      }
    `}</style>
  );
}

/* ------------------------------ Progress Nav ----------------------------- */

function ProgressNav({ progress, active, reduced }) {
  const jump = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  };
  return (
    <>
      {/* top progress bar */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: 3,
          width: "100%",
          zIndex: 60,
          background: "rgba(8,16,31,0.08)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress * 100}%`,
            background: "linear-gradient(90deg, var(--gold), var(--coral))",
            transition: reduced ? "none" : "width 0.15s ease-out",
          }}
        />
      </div>

      {/* side dot nav */}
      <nav
        aria-label="Presentation sections"
        style={{
          position: "fixed",
          right: "1.4rem",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 60,
          flexDirection: "column",
          gap: "1.1rem",
        }}
        className="hidden md:flex"
      >
        {SECTIONS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => jump(s.id)}
            aria-label={`Go to ${s.label}`}
            aria-current={active === i ? "true" : "false"}
            className="group relative flex items-center justify-end"
            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
          >
            <span
              className="ptp-display group-hover:opacity-100 group-focus:opacity-100"
              style={{
                position: "absolute",
                right: "1.4rem",
                whiteSpace: "nowrap",
                fontSize: "0.78rem",
                color: "var(--navy)",
                background: "rgba(248,243,232,0.92)",
                padding: "3px 10px",
                borderRadius: "999px",
                opacity: 0,
                transform: "translateX(6px)",
                transition: "opacity 0.2s ease, transform 0.2s ease",
                pointerEvents: "none",
                boxShadow: "0 2px 10px rgba(8,16,31,0.12)",
              }}
            >
              {s.label}
            </span>
            <span
              style={{
                width: active === i ? 10 : 7,
                height: active === i ? 10 : 7,
                borderRadius: "50%",
                background: active === i ? "var(--coral)" : "rgba(8,16,31,0.28)",
                display: "block",
                transition: "all 0.25s ease",
              }}
            />
          </button>
        ))}
      </nav>
    </>
  );
}

/* ------------------------------ Section shell ---------------------------- */

const Section = React.forwardRef(function Section({ id, style, className = "", children }, ref) {
  return (
    <section
      id={id}
      ref={ref}
      className={`ptp-section relative w-full min-h-screen flex flex-col justify-center px-6 md:px-14 lg:px-24 py-24 overflow-hidden ${className}`}
      style={style}
    >
      {children}
    </section>
  );
});

/* ------------------------------- Section 1 -------------------------------- */

function Particles({ reduced }) {
  const dots = useMemo(
    () =>
      Array.from({ length: 22 }).map(() => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 6,
        dur: 6 + Math.random() * 6,
        o: 0.25 + Math.random() * 0.45,
      })),
    []
  );
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {dots.map((d, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            borderRadius: "50%",
            background: "var(--gold)",
            "--o": d.o,
            opacity: d.o,
            animation: reduced ? "none" : `ptp-float ${d.dur}s ease-in-out ${d.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function FallingStars({ reduced }) {
  const stars = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        left: 3 + Math.random() * 94,
        size: 5 + Math.random() * 8,
        delay: -(Math.random() * 14),
        duration: 10 + Math.random() * 9,
        drift: `${-45 + Math.random() * 90}px`,
        opacity: 0.36 + Math.random() * 0.5,
        scale: 0.7 + Math.random() * 0.65,
        index,
      })),
    []
  );

  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {stars.map((star) => (
        <span
          key={star.index}
          style={{
            position: "absolute",
            top: 0,
            left: `${star.left}%`,
            width: star.size,
            height: star.size,
            background: "var(--cream)",
            clipPath: "polygon(50% 0%, 61% 37%, 100% 50%, 61% 63%, 50% 100%, 39% 63%, 0% 50%, 39% 37%)",
            filter: "drop-shadow(0 0 5px rgba(248,243,232,0.7))",
            "--drift": star.drift,
            "--star-o": star.opacity,
            "--scale": star.scale,
            animation: reduced ? "none" : `ptp-star-fall ${star.duration}s linear ${star.delay}s infinite`,
            opacity: reduced ? star.opacity : 0,
          }}
        />
      ))}
    </div>
  );
}

function SessionTimer() {
  const TOTAL_SECONDS = 45 * 60;
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running || secondsLeft === 0) return undefined;
    const interval = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [running, secondsLeft]);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  const isActive = running && secondsLeft > 0;
  const reset = () => {
    setSecondsLeft(TOTAL_SECONDS);
    setRunning(false);
  };

  return (
    <aside
      className="ptp-session-timer"
      aria-label="45 minute session timer"
      style={{
        position: "fixed",
        right: "clamp(1.25rem, 4vw, 4rem)",
        top: "1.25rem",
        zIndex: 70,
        width: 142,
        padding: "0.8rem 0.75rem",
        border: "1px solid rgba(248,243,232,0.22)",
        borderRadius: "1rem",
        background: "rgba(8,16,31,0.54)",
        boxShadow: "0 12px 32px rgba(0,0,0,0.16)",
        backdropFilter: "blur(10px)",
        textAlign: "center",
      }}
    >
      <div style={{ color: "rgba(248,243,232,0.62)", fontSize: "0.66rem", letterSpacing: "0.09em", textTransform: "uppercase" }}>Session timer</div>
      <div className="ptp-display" aria-live="polite" style={{ color: "var(--cream)", fontSize: "1.85rem", fontVariantNumeric: "tabular-nums", lineHeight: 1.2, margin: "0.25rem 0 0.65rem" }}>
        {minutes}:{seconds}
      </div>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setRunning((current) => (secondsLeft > 0 ? !current : false))}
          aria-label={isActive ? "Pause timer" : "Start timer"}
          style={{ width: 32, height: 30, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--navy-deep)", background: "var(--gold)", border: 0, borderRadius: "0.45rem", cursor: "pointer" }}
        >
          {isActive ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" style={{ marginLeft: 1 }} />}
        </button>
        <button
          type="button"
          onClick={reset}
          aria-label="Reset timer to 45 minutes"
          style={{ width: 32, height: 30, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--cream)", background: "transparent", border: "1px solid rgba(248,243,232,0.34)", borderRadius: "0.45rem", cursor: "pointer" }}
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </aside>
  );
}

function OpeningSection({ setRef, reduced }) {
  return (
    <Section
      id="sec-open"
      ref={setRef}
      className="items-center text-center"
      style={{ background: "radial-gradient(circle at 50% 20%, #142445 0%, var(--navy) 55%, var(--navy-deep) 100%)", color: "var(--cream)" }}
    >
      <Particles reduced={reduced} />
      <FallingStars reduced={reduced} />
      <SessionTimer />
      <div aria-hidden="true" style={{ position: "absolute", right: "7%", bottom: "10%", width: "min(32vw, 380px)", aspectRatio: "1/1", opacity: 0.3 }}>
        <Network size="100%" strokeWidth={0.7} color="var(--gold)" style={{ width: "100%", height: "100%", animation: reduced ? "none" : "ptp-spin-slow 34s linear infinite" }} />
      </div>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "70vw",
          height: "70vw",
          maxWidth: 900,
          maxHeight: 900,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200,155,60,0.16) 0%, rgba(200,155,60,0) 65%)",
          animation: reduced ? "none" : "ptp-pulse-soft 7s ease-in-out infinite",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto">
        <Fade reduced={reduced} delay={0.1}>
          <p
            className="mb-6"
            style={{
              color: "var(--gold)",
              fontSize: "0.95rem",
              letterSpacing: "0.02em",
              opacity: 0.9,
            }}
          >
            A Digital Workshop
          </p>
        </Fade>

        <h1 className="ptp-display" style={{ fontSize: "clamp(2.6rem, 7vw, 5.6rem)", fontWeight: 500, lineHeight: 1.12, color: "var(--cream)" }}>
          <RevealWords reduced={reduced} delay={0.25} text="From Pulpit" />
          <br />
          <RevealWords reduced={reduced} delay={0.55} text="to Pixels" />
        </h1>

        <div style={{ maxWidth: 620, margin: "1.8rem auto 0" }}>
          <RevealWords
            reduced={reduced}
            delay={1.0}
            stagger={0.025}
            text="Using technology for the ministry of the Church."
            className="ptp-display block"
          />
        </div>

        <Fade reduced={reduced} delay={1.4}>
          <p className="mx-auto mt-8" style={{ maxWidth: 560, color: "rgba(248,243,232,0.72)", fontSize: "1.05rem", lineHeight: 1.75 }}>
            Digital networking lets the Church remain present between Sundays: a parish message, prayer, or invitation can travel from the pulpit into the everyday screens of its people.
          </p>
        </Fade>

        <Fade reduced={reduced} delay={1.7}>
          <div className="mt-16 flex flex-col items-center gap-3" style={{ color: "rgba(248,243,232,0.55)" }}>
            <span style={{ fontSize: "0.85rem" }}>Scroll to begin</span>
            <ChevronDown
              size={20}
              style={{ animation: reduced ? "none" : "ptp-bob 2.2s ease-in-out infinite" }}
            />
          </div>
        </Fade>
      </div>
    </Section>
  );
}

/* ------------------------ Session framing sections ------------------------ */

function HiddenAdminSection({ setRef, reduced }) {
  const tasks = ["Writing notices", "Replying to messages", "Preparing sermons", "Making posters", "Meeting minutes", "Finding documents", "Follow-ups", "Event reminders"];
  return <Section id="sec-admin" ref={setRef} style={{ background: "#F5F0E5" }}><div className="max-w-6xl mx-auto w-full"><Fade reduced={reduced}><p style={{ color: "var(--coral)", fontSize: "0.88rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.6rem" }}>The hidden admin</p><h2 className="ptp-display" style={{ color: "var(--navy)", fontSize: "clamp(2rem, 4.8vw, 3.6rem)", fontWeight: 500, maxWidth: 760 }}>How much of your week is actually spent doing priestly work?</h2><p style={{ color: "rgba(14,27,50,0.7)", fontSize: "1.02rem", lineHeight: 1.7, maxWidth: 680, marginTop: "1rem" }}>Ministry is people, prayer, presence, and preparation. Yet many hours disappear into the practical work that keeps a parish moving.</p></Fade><div className="grid md:grid-cols-2 gap-4" style={{ marginTop: "2.4rem" }}>{tasks.map((task, index) => <Fade key={task} reduced={reduced} delay={index * 0.08}><div className="flex items-center gap-3" style={{ minHeight: 66, background: "#FBFCFD", border: "1px solid rgba(14,27,50,0.1)", borderRadius: "0.7rem", padding: "0.85rem", boxShadow: "0 8px 15px -13px rgba(8,16,31,0.65)", borderLeft: `6px solid ${["var(--teal)", "var(--gold)", "var(--coral)", "#7654B9"][index % 4]}` }}><ClipboardList size={18} color="rgba(14,27,50,0.55)" /><span style={{ color: "var(--navy)", fontSize: "1rem", fontWeight: 600 }}>{task}</span></div></Fade>)}</div><Fade reduced={reduced} delay={0.3}><div style={{ marginTop: "2rem", padding: "1.1rem 1.25rem", borderLeft: "3px solid var(--teal)", background: "rgba(31,111,104,0.08)", color: "rgba(14,27,50,0.78)", lineHeight: 1.55 }}>Today is about using the right digital tool to reduce this repetitive load - so more time returns to people.</div></Fade></div></Section>;
}

function SessionMapSection({ setRef, reduced }) {
  const items = [{ number: "01", title: "Reach", label: "Social communication", body: "Help the parish stay connected through clear, timely messages." }, { number: "02", title: "Organise", label: "Daily tools", body: "Bring notices, schedules, files, registrations, and follow-ups into order." }, { number: "03", title: "Think", label: "Artificial intelligence", body: "Research, study, draft, and create - with human wisdom in charge." }];
  return <Section id="sec-map" ref={setRef} style={{ background: "var(--navy)", color: "var(--cream)" }}><div className="max-w-6xl mx-auto w-full"><Fade reduced={reduced}><p style={{ color: "var(--gold)", fontSize: "0.88rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.6rem" }}>Today’s session</p><h2 className="ptp-display" style={{ fontSize: "clamp(2rem, 4.7vw, 3.6rem)", fontWeight: 500, maxWidth: 700 }}>Three ways digital tools can serve ministry.</h2><p style={{ color: "rgba(248,243,232,0.7)", maxWidth: 650, lineHeight: 1.7, marginTop: "1rem" }}>We will move from reaching people, to organising work, to thinking more clearly - one practical step at a time.</p></Fade><div style={{ position: "relative", maxWidth: 940, margin: "3rem auto 0" }}><div aria-hidden="true" style={{ position: "absolute", top: "50%", left: "15%", right: "15%", height: 1, background: "rgba(200,155,60,0.45)" }} /><div className="grid md:grid-cols-3 gap-6" style={{ position: "relative" }}>{items.map((item, index) => <Fade key={item.title} reduced={reduced} delay={0.2 + index * 0.18}><article style={{ position: "relative", padding: "1.5rem", minHeight: 220, borderRadius: "1.1rem", background: "rgba(248,243,232,0.06)", border: "1px solid rgba(248,243,232,0.15)", backdropFilter: "blur(8px)" }}><div style={{ width: 50, height: 50, borderRadius: "50%", background: "var(--gold)", color: "var(--navy-deep)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.76rem", fontWeight: 700, marginBottom: "1.25rem" }}>{item.number}</div><p style={{ color: "var(--gold)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", margin: 0 }}>{item.label}</p><h3 className="ptp-display" style={{ color: "var(--cream)", fontSize: "1.75rem", fontWeight: 500, margin: "0.25rem 0 0.6rem" }}>{item.title}</h3><p style={{ color: "rgba(248,243,232,0.7)", fontSize: "0.86rem", lineHeight: 1.55, margin: 0 }}>{item.body}</p></article></Fade>)}</div></div><Fade reduced={reduced} delay={0.75}><div className="flex items-center justify-center gap-2" style={{ marginTop: "2.2rem", color: "rgba(248,243,232,0.55)", fontSize: "0.8rem" }}><span>Scroll to begin with parish communication</span><ArrowDown size={15} /></div></Fade></div></Section>;
}

function ToolsTransitionSection({ setRef, reduced }) {
  return <Section id="sec-tools-intro" ref={setRef} className="items-center text-center" style={{ background: "linear-gradient(145deg, var(--teal), #164B48)", color: "var(--cream)" }}><div style={{ maxWidth: 800 }}><Fade reduced={reduced}><Workflow size={36} color="var(--gold)" style={{ margin: "0 auto 1.4rem" }} /><p style={{ color: "rgba(248,243,232,0.72)", fontSize: "0.9rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Next</p><h2 className="ptp-display" style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)", lineHeight: 1, fontWeight: 500, marginTop: "0.6rem" }}>Tools for<br />daily use.</h2><p style={{ color: "rgba(248,243,232,0.75)", lineHeight: 1.7, maxWidth: 540, margin: "1.6rem auto 0" }}>Small, well-chosen systems can make parish administration quieter, clearer, and easier to share.</p></Fade></div></Section>;
}

/* ------------------------------- Section 2 -------------------------------- */

function ChatPhone({ reduced }) {
  const [ref, inView] = useInView(0.35, reduced);
  const messages = [
    { text: "Good morning, beloved in Christ. 🙏\n\nSunday Holy Qurbana begins at 9:00 AM. You are warmly welcome to join us in person or on the livestream.", time: "8:02 AM" },
    { text: "Please keep the Varghese's family in your prayers this week. May God give them comfort and strength. 🤍", time: "10:18 AM" },
    { text: "Verse for today:\n\n“Be still, and know that I am God.”\n— Psalm 46:10 📖", time: "7:30 AM" },
    { text: "A reminder for our young people: Fellowship meets this Friday at 6:00 PM in the parish hall. Bring a friend! ✨", time: "4:15 PM" },
  ];
  return (
    <div
      ref={ref}
      style={{
        background: "var(--navy-deep)",
        borderRadius: "2rem",
        padding: "1.1rem",
        width: "100%",
        maxWidth: 340,
        boxShadow: "0 30px 60px -25px rgba(8,16,31,0.5)",
      }}
    >
      <div
        style={{
          backgroundColor: "#E6DDD0",
          backgroundImage: "radial-gradient(rgba(14,27,50,0.05) 0.7px, transparent 0.7px)",
          backgroundSize: "9px 9px",
          borderRadius: "1.3rem",
          padding: "0.9rem",
          minHeight: 410,
        }}
      >
        <div className="flex items-center gap-2 pb-3 mb-3" style={{ borderBottom: "1px solid rgba(8,16,31,0.08)" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--teal)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            <MessageCircle size={16} />
          </div>
          <div>
            <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--navy)" }}>KOTTAYAM – KOCHI DIOCESE</p>
            <p style={{ fontSize: "0.68rem", color: "var(--teal)" }}>Announcements</p>
          </div>
        </div>
        <div className="flex flex-col" style={{ gap: "0.9rem" }}>
          <div style={{ alignSelf: "center", color: "rgba(14,27,50,0.55)", background: "rgba(255,255,255,0.72)", borderRadius: "999px", padding: "0.22rem 0.55rem", fontSize: "0.59rem", marginBottom: "0.1rem" }}>
            TODAY
          </div>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: "flex-start",
                background: "white",
                borderRadius: "0.75rem",
                borderTopLeftRadius: "0.18rem",
                padding: "0.5rem 0.65rem 0.38rem 0.75rem",
                maxWidth: "92%",
                fontSize: "0.71rem",
                lineHeight: 1.45,
                color: "var(--navy)",
                boxShadow: "0 2px 6px rgba(8,16,31,0.06)",
                opacity: reduced ? 1 : inView ? 1 : 0,
                transform: reduced ? "none" : inView ? "translateY(0)" : "translateY(14px)",
                transition: reduced ? "none" : `opacity 0.6s ease ${0.15 * i}s, transform 0.6s cubic-bezier(.22,1,.36,1) ${0.15 * i}s`,
              }}
            >
              <div style={{ color: "#B06D14", fontSize: "0.6rem", fontWeight: 600, marginBottom: "0.1rem" }}>Rt. Rev. Thomas Mar Timotheos Episcopa</div>
              <div style={{ color: "rgba(14,27,50,0.52)", fontSize: "0.54rem", marginBottom: "0.36rem" }}>Community admin</div>
              <span style={{ whiteSpace: "pre-line" }}>{m.text}</span>
              <span style={{ color: "rgba(14,27,50,0.5)", fontSize: "0.56rem", marginLeft: "0.45rem", whiteSpace: "nowrap", verticalAlign: "bottom" }}>{m.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InstagramMock({ reduced }) {
  const [ref, inView] = useInView(0.35, reduced);
  const cards = [
    { label: "Behind the scenes of Sunday worship" },
    { label: "Three takeaways from this week's message" },
    { label: "Save the date — Homecoming Sunday" },
  ];
  return (
    <div ref={ref} className="grid grid-cols-3 gap-2" style={{ maxWidth: 340 }}>
      {cards.map((c, i) => (
        <div
          key={i}
          style={{
            aspectRatio: "3/4",
            borderRadius: "0.9rem",
            padding: "0.6rem",
            display: "flex",
            alignItems: "flex-end",
            background: `linear-gradient(155deg, ${
              i === 0 ? "#E2703A" : i === 1 ? "#C89B3C" : "#1F6F68"
            } 0%, rgba(14,27,50,0.85) 100%)`,
            opacity: reduced ? 1 : inView ? 1 : 0,
            transform: reduced ? "none" : inView ? "translateY(0) scale(1)" : "translateY(20px) scale(0.94)",
            transition: reduced ? "none" : `opacity 0.6s ease ${0.15 * i}s, transform 0.6s cubic-bezier(.22,1,.36,1) ${0.15 * i}s`,
          }}
        >
          <p style={{ color: "white", fontSize: "0.62rem", lineHeight: 1.35, fontWeight: 500 }}>{c.label}</p>
        </div>
      ))}
    </div>
  );
}

function XMock({ reduced }) {
  const [ref, inView] = useInView(0.35, reduced);
  const [engagement, setEngagement] = useState([
    { liked: false, reposted: false, likes: 84, reposts: 21 },
    { liked: false, reposted: false, likes: 126, reposts: 37 },
    { liked: false, reposted: false, likes: 63, reposts: 14 },
  ]);
  const posts = [
    "Grateful for a church that shows up — this week we served over 400 meals in our community.",
    "Whatever you’re carrying today, you do not carry it alone. Our parish family is praying with you.",
    "Renovations begin next week. Thank you for your patience, your prayers, and your continued support.",
  ];
  const toggle = (index, type) => {
    setEngagement((current) => current.map((item, i) => {
      if (i !== index) return item;
      const enabled = !item[type];
      return {
        ...item,
        [type]: enabled,
        [type === "liked" ? "likes" : "reposts"]: item[type === "liked" ? "likes" : "reposts"] + (enabled ? 1 : -1),
      };
    }));
  };
  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        maxWidth: 416,
        padding: "0.6rem",
        borderRadius: "2.35rem",
        background: "linear-gradient(145deg, #0A1220, #263449)",
        boxShadow: "0 28px 55px -28px rgba(8,16,31,0.65)",
      }}
    >
      <div aria-hidden="true" style={{ width: 102, height: 18, borderRadius: "0 0 0.8rem 0.8rem", background: "#0A1220", margin: "-0.6rem auto 0", position: "relative", zIndex: 2 }} />
      <div className="flex flex-col" style={{ border: "1px solid rgba(8,16,31,0.14)", borderRadius: "1.75rem", overflow: "hidden", background: "#fff" }}>
      <div className="flex items-center justify-between" style={{ padding: "0.8rem 0.95rem", borderBottom: "1px solid rgba(8,16,31,0.1)" }}>
        <span style={{ fontSize: "1.35rem", fontWeight: 700, lineHeight: 1, color: "#0F1419" }}>𝕏</span>
        <span style={{ color: "rgba(15,20,25,0.55)", fontSize: "0.72rem" }}>Posts</span>
      </div>
      {posts.map((p, i) => (
        <div
          key={i}
          style={{
            background: "#fff",
            borderBottom: i === posts.length - 1 ? "none" : "1px solid rgba(8,16,31,0.1)",
            padding: "0.9rem 0.95rem",
            opacity: reduced ? 1 : inView ? 1 : 0,
            transform: reduced ? "none" : inView ? "translateX(0)" : "translateX(24px)",
            transition: reduced ? "none" : `opacity 0.6s ease ${0.15 * i}s, transform 0.6s cubic-bezier(.22,1,.36,1) ${0.15 * i}s`,
          }}
        >
          <div className="flex gap-2.5">
            <div aria-hidden="true" style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(145deg, var(--navy), #294A7D)", color: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fraunces', serif", fontSize: "1.05rem", flex: "0 0 auto" }}>TT</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="flex items-center" style={{ gap: "0.3rem", lineHeight: 1.2 }}>
                <span style={{ color: "#0F1419", fontSize: "0.76rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Rt. Rev. Thomas Mar Timotheos Episcopa</span>
                <span aria-label="Verified" style={{ color: "#1D9BF0", fontSize: "0.66rem" }}>●</span>
              </div>
              <div style={{ color: "#536471", fontSize: "0.67rem", marginTop: "0.12rem" }}>@ThomasMarTimotheos · {i === 0 ? "2h" : i === 1 ? "1d" : "3d"}</div>
              <p style={{ fontSize: "0.76rem", lineHeight: 1.5, color: "#0F1419", margin: "0.5rem 0 0.55rem" }}>{p}</p>
              <div className="flex items-center justify-between" style={{ maxWidth: 245, color: "#536471" }}>
                <button type="button" aria-label="Reply to post" style={{ background: "none", border: 0, padding: "0.15rem", color: "inherit", cursor: "pointer", display: "inline-flex" }}><MessageCircle size={14} /></button>
                <button type="button" onClick={() => toggle(i, "reposted")} aria-label={engagement[i].reposted ? "Undo repost" : "Repost"} aria-pressed={engagement[i].reposted} style={{ background: "none", border: 0, padding: "0.15rem", color: engagement[i].reposted ? "#00BA7C" : "#536471", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.22rem" }}><Repeat2 size={14} /><span style={{ fontSize: "0.62rem" }}>{engagement[i].reposts}</span></button>
                <button type="button" onClick={() => toggle(i, "liked")} aria-label={engagement[i].liked ? "Unlike post" : "Like post"} aria-pressed={engagement[i].liked} style={{ background: "none", border: 0, padding: "0.15rem", color: engagement[i].liked ? "#F91880" : "#536471", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.22rem" }}><Heart size={14} fill={engagement[i].liked ? "currentColor" : "none"} /><span style={{ fontSize: "0.62rem" }}>{engagement[i].likes}</span></button>
                <button type="button" aria-label="Share post" style={{ background: "none", border: 0, padding: "0.15rem", color: "inherit", cursor: "pointer", display: "inline-flex" }}><Send size={14} /></button>
              </div>
            </div>
          </div>
        </div>
      ))}
      </div>
      <div aria-hidden="true" style={{ width: 112, height: 4, borderRadius: "999px", background: "rgba(248,243,232,0.72)", margin: "0.6rem auto 0.1rem" }} />
    </div>
  );
}

function FacebookPhone({ reduced }) {
  const [liked, setLiked] = useState(false);
  return <div style={{ width: "100%", maxWidth: 218, margin: "0 auto", padding: "0.42rem", borderRadius: "1.55rem", background: "linear-gradient(145deg, #101827, #40516D)", boxShadow: "0 18px 32px -21px rgba(8,16,31,0.8)", animation: reduced ? "none" : "ptp-drift 6s ease-in-out infinite" }}><div style={{ background: "#F8FAFD", borderRadius: "1.22rem", overflow: "hidden", minHeight: 280 }}><div className="flex items-center justify-between" style={{ padding: "0.65rem 0.7rem", color: "#1877F2", fontSize: "0.9rem", fontWeight: 700 }}><span>facebook</span><span style={{ color: "#64748B" }}>⌕</span></div><div style={{ height: 76, background: "linear-gradient(135deg, #315D93, #8DB7E8)", position: "relative" }}><div style={{ position: "absolute", width: 38, height: 38, borderRadius: "50%", background: "var(--cream)", border: "2px solid white", left: "0.7rem", bottom: "-19px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--navy)", fontFamily: "'Fraunces', serif", fontSize: "0.75rem" }}>KC</div></div><div style={{ padding: "1.6rem 0.7rem 0.7rem" }}><strong style={{ color: "#172033", fontSize: "0.68rem" }}>Kottayam - Kochi Diocese</strong><p style={{ color: "#526071", fontSize: "0.6rem", lineHeight: 1.45, margin: "0.55rem 0" }}>Join us this Sunday for Holy Qurbana at 9:00 AM. All are welcome.</p><div style={{ height: 48, borderRadius: "0.4rem", background: "linear-gradient(135deg, var(--gold), var(--coral))", marginBottom: "0.5rem" }} /><div className="flex items-center justify-between" style={{ borderTop: "1px solid #E4EAF2", paddingTop: "0.45rem" }}><button onClick={() => setLiked((value) => !value)} aria-pressed={liked} style={{ border: 0, background: "none", color: liked ? "#1877F2" : "#64748B", fontSize: "0.59rem", cursor: "pointer" }}>{liked ? "● Liked" : "♡ Like"}</button><span style={{ color: "#64748B", fontSize: "0.59rem" }}>Comment &nbsp; Share</span></div></div></div></div>;
}

function YouTubePhone({ reduced }) {
  const [playing, setPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  return <div style={{ width: "100%", maxWidth: 238, margin: "0 auto", padding: "0.42rem", borderRadius: "1.55rem", background: "linear-gradient(145deg, #101827, #40516D)", boxShadow: "0 18px 32px -21px rgba(8,16,31,0.8)", animation: reduced ? "none" : "ptp-drift 6s ease-in-out 0.6s infinite" }}><div style={{ background: "#0F0F0F", borderRadius: "1.22rem", overflow: "hidden", minHeight: 344, color: "#F1F1F1" }}><div className="flex items-center justify-between" style={{ padding: "0.48rem 0.62rem", fontSize: "0.57rem", color: "#B7B7B7" }}><span>13:47</span><span>◉ &nbsp; ▰ &nbsp; ▪</span></div><button type="button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "Pause sermon video" : "Play sermon video"} style={{ width: "100%", height: 124, border: 0, cursor: "pointer", background: "radial-gradient(ellipse at 50% 38%, #C89B3C 0%, #6F5834 24%, #151C27 67%)", color: "white", position: "relative" }}><div style={{ width: 47, height: 67, borderRadius: "45% 45% 18% 18%", background: "linear-gradient(90deg, #302012, #EEE0BA 48%, #7D5A25)", margin: "0 auto" }} /><span style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.55)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>{playing ? "Ⅱ" : "▶"}</span><span style={{ position: "absolute", left: "0.45rem", bottom: "0.35rem", fontSize: "0.48rem", color: "rgba(255,255,255,0.8)" }}>{playing ? "LIVE - playing now" : "Mar Thoma Sangamam - Live"}</span></button><div style={{ padding: "0.68rem" }}><strong style={{ color: "#F1F1F1", fontSize: "0.7rem", lineHeight: 1.35, display: "block" }}>Rt. Rev.Thomas Mar Timotheos Episcopa Sermon</strong><p style={{ color: "#A5A5A5", fontSize: "0.55rem", margin: "0.28rem 0 0.55rem" }}>Kottayam - Kochi Diocese · 3.2K views · 1 day ago</p><div className="flex items-center justify-between" style={{ borderTop: "1px solid #303030", borderBottom: "1px solid #303030", padding: "0.47rem 0", color: "#D9D9D9", fontSize: "0.56rem" }}><button type="button" onClick={() => setLiked((value) => !value)} aria-pressed={liked} style={{ background: "#272727", border: 0, borderRadius: "999px", color: liked ? "#FF4D4D" : "#F1F1F1", cursor: "pointer", padding: "0.3rem 0.42rem", fontSize: "0.55rem" }}>{liked ? "♥ 26" : "♡ 25"}</button><span>↪ Share</span><span>✦</span><span>•••</span></div><div style={{ marginTop: "0.6rem", padding: "0.52rem", borderRadius: "0.55rem", background: "#212121" }}><strong style={{ fontSize: "0.58rem" }}>Comments&nbsp; 3</strong><p style={{ color: "#C5C5C5", fontSize: "0.53rem", lineHeight: 1.4, margin: "0.28rem 0 0" }}>Praise the Lord! Hallelujah! Amen.</p></div></div></div></div>;
}

function SocialPostingCheck({ reduced }) {
  const checks = ["Is it true?", "Is it necessary?", "Is it pastoral?", "Is consent and privacy respected?", "Would I say this from the pulpit?"];
  const formats = [
    { name: "Facebook", label: "Public parish presence", use: "Use a Page for public presence, Events for programmes, and Groups for ongoing conversation.", phone: FacebookPhone },
    { name: "YouTube", label: "Teaching archive", use: "Sermons, Bible studies, Shorts, and playlists create a searchable archive for your parish.", phone: YouTubePhone },
  ];
  return <Fade reduced={reduced}><div style={{ margin: "0.5rem 0 3.5rem" }}><div style={{ padding: "1.35rem 1.5rem", borderRadius: "1rem", background: "rgba(31,111,104,0.08)", borderLeft: "4px solid var(--teal)" }}><p style={{ color: "var(--teal)", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>The 30-second rule</p><h3 className="ptp-display" style={{ color: "var(--navy)", fontSize: "1.35rem", fontWeight: 500, margin: "0.35rem 0 0.75rem" }}>Pause before you post.</h3><div className="flex flex-wrap gap-2">{checks.map((check) => <span key={check} style={{ color: "var(--navy)", background: "white", border: "1px solid rgba(14,27,50,0.1)", borderRadius: "999px", padding: "0.38rem 0.65rem", fontSize: "0.78rem" }}>{check}</span>)}</div></div><div className="grid md:grid-cols-2 gap-6" style={{ marginTop: "1.5rem" }}>{formats.map((format) => { const Phone = format.phone; return <article key={format.name} className="flex flex-col items-center gap-4" style={{ background: "white", border: "1px solid rgba(14,27,50,0.1)", borderRadius: "1.1rem", padding: "1.25rem", boxShadow: "0 16px 30px -26px rgba(8,16,31,0.6)" }}><Phone reduced={reduced} /><div style={{ textAlign: "center" }}><div style={{ color: "var(--coral)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{format.label}</div><h4 className="ptp-display" style={{ color: "var(--navy)", fontSize: "1.3rem", fontWeight: 500, margin: "0.3rem 0" }}>{format.name}</h4><p style={{ color: "rgba(14,27,50,0.68)", fontSize: "0.86rem", lineHeight: 1.55, margin: 0 }}>{format.use}</p></div></article>; })}</div></div></Fade>;
}

function PlatformBlock({ reduced, icon: Icon, tint, name, tagline, body, visual, reverse }) {
  return (
    <div className={`flex flex-col ${reverse ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-10 lg:gap-16 py-14`}>
      <div className="w-full lg:w-1/2">
        <Fade reduced={reduced}>
          <div
            className="inline-flex items-center justify-center mb-5"
            style={{ width: 46, height: 46, borderRadius: "0.9rem", background: tint }}
          >
            <Icon size={20} color="white" />
          </div>
          <h3 className="ptp-display" style={{ fontSize: "clamp(1.6rem, 3vw, 2.3rem)", fontWeight: 500, marginBottom: "0.6rem", color: "var(--navy)" }}>
            {name}
          </h3>
          <p style={{ color: tint, fontSize: "0.95rem", fontWeight: 500, marginBottom: "1rem" }}>{tagline}</p>
          <p style={{ maxWidth: 480, color: "rgba(14,27,50,0.72)", fontSize: "1rem", lineHeight: 1.75 }}>{body}</p>
        </Fade>
      </div>
      <div className="w-full lg:w-1/2 flex justify-center">{visual}</div>
    </div>
  );
}

function CommunityStepVisual({ step }) {
  const base = { background: "#fff", border: "1px solid rgba(14,27,50,0.12)", borderRadius: "0.85rem", minHeight: 188, padding: "0.75rem", color: "var(--navy)", overflow: "hidden", fontSize: "0.64rem" };
  const title = { fontSize: "0.7rem", fontWeight: 600, marginBottom: "0.7rem" };
  const greenIcon = { width: 31, height: 31, borderRadius: "0.55rem", background: "#1BAE63", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flex: "0 0 auto" };

  if (step === 1) return <div style={base}><div style={title}>Communities <span style={{ float: "right", fontSize: "1.1rem", lineHeight: 0.55 }}>＋</span></div><div className="flex items-center gap-2" style={{ padding: "0.58rem", background: "#F4F3F3", borderRadius: "0.65rem" }}><div style={greenIcon}>♟</div><span style={{ fontSize: "0.7rem" }}>New community</span></div><div style={{ margin: "0.8rem 0.25rem", fontWeight: 600 }}>Your parish groups</div><div className="flex items-center gap-2"><div style={{ ...greenIcon, background: "#C9EDFB", color: "#087BAC" }}>♟</div><span>Announcements</span></div></div>;
  if (step === 2) return <div style={{ ...base, textAlign: "center" }}><div style={{ textAlign: "left", ...title }}>‹ &nbsp; New community</div><div style={{ width: 54, height: 54, borderRadius: "50%", background: "#DFFDD5", border: "1px solid var(--navy)", margin: "1rem auto 0.65rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.45rem" }}>♟</div><div style={{ fontSize: "0.82rem", fontWeight: 500 }}>Create a new community</div><p style={{ color: "rgba(14,27,50,0.62)", lineHeight: 1.35, margin: "0.35rem 0 0.75rem" }}>Bring your parish groups together.</p><span style={{ display: "inline-block", background: "#1BAE63", color: "white", borderRadius: "999px", padding: "0.42rem 0.95rem", fontWeight: 600 }}>Get started</span></div>;
  if (step === 3) return <div style={base}><div style={title}>‹ &nbsp; New community</div><div style={{ margin: "0.7rem auto", width: 42, height: 42, borderRadius: "0.65rem", background: "#838383", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>♟</div><div style={{ color: "rgba(14,27,50,0.55)", fontSize: "0.55rem" }}>Community name</div><div style={{ borderBottom: "2px solid #1BAE63", padding: "0.32rem 0", marginBottom: "0.62rem", fontSize: "0.7rem" }}>Kottayam – Kochi</div><div style={{ background: "#F5F5F5", padding: "0.45rem", color: "rgba(14,27,50,0.68)", lineHeight: 1.35 }}>A home for parish groups and important announcements.</div></div>;
  return <div style={base}><div style={title}>‹ &nbsp; Kottayam – Kochi <span style={{ float: "right" }}>⋮</span></div><div className="flex items-center gap-2" style={{ marginBottom: "0.9rem" }}><div style={{ ...greenIcon, background: "#F8D8E4", color: "#D83272" }}>⌁</div><div><div style={{ fontSize: "0.7rem", fontWeight: 500 }}>Announcements</div><div style={{ color: "rgba(14,27,50,0.55)", marginTop: "0.18rem" }}>Welcome to your community!</div></div></div><div style={{ color: "rgba(14,27,50,0.55)", fontWeight: 600, marginBottom: "0.45rem" }}>GROUPS YOU'RE IN</div><div className="flex items-center gap-2"><div style={{ ...greenIcon, background: "#D9E4E8", color: "#53636B" }}>●</div><div><div style={{ fontSize: "0.7rem" }}>General</div><div style={{ color: "rgba(14,27,50,0.55)", marginTop: "0.18rem" }}>Welcome to the group</div></div></div></div>;
}

function CommunityGuide({ reduced }) {
  const steps = [
    { title: "Open Communities", text: "In WhatsApp, select Communities, then choose New community." },
    { title: "Begin setup", text: "Select Get started to create a space that brings your parish groups together." },
    { title: "Name the community", text: "Add a clear name, a helpful description, and an icon for easy recognition." },
    { title: "Add your groups", text: "WhatsApp creates Announcements automatically; add groups such as General, Youth, or Choir." },
  ];
  const benefits = [
    { icon: MessageCircle, title: "One trusted voice", text: "Send important parish updates to everyone through the Announcements group." },
    { icon: Hash, title: "Groups with a purpose", text: "Keep Youth, Choir, Sunday School, and ministry conversations organised in one place." },
    { icon: BookOpen, title: "Less noise, clearer care", text: "Members receive the information that matters without searching across many separate chats." },
  ];
  return <div style={{ padding: "4.5rem 0", borderTop: "1px solid rgba(14,27,50,0.1)" }}><div style={{ maxWidth: 760, marginBottom: "2.25rem" }}><Fade reduced={reduced}><p style={{ color: "var(--teal)", fontSize: "0.95rem", marginBottom: "0.7rem" }}>WhatsApp Communities</p><h3 className="ptp-display" style={{ color: "var(--navy)", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 500, lineHeight: 1.15 }}>One home for every parish group</h3><p style={{ color: "rgba(14,27,50,0.7)", fontSize: "1rem", lineHeight: 1.7, marginTop: "1rem", maxWidth: 660 }}>A Community gathers your existing WhatsApp groups under one parish home. It includes a dedicated Announcements group, so leaders can share essential information clearly with everyone.</p></Fade></div><div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(205px, 1fr))" }}>{steps.map((step, index) => <Fade key={step.title} reduced={reduced} delay={index * 0.08}><article style={{ background: "white", border: "1px solid rgba(14,27,50,0.1)", borderRadius: "1rem", padding: "0.6rem", boxShadow: "0 12px 26px -24px rgba(8,16,31,0.45)" }}><CommunityStepVisual step={index + 1} /><div style={{ padding: "1rem 0.5rem 0.45rem" }}><div style={{ color: "var(--coral)", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.28rem" }}>Step {index + 1}</div><h4 style={{ color: "var(--navy)", fontSize: "1.05rem", margin: 0 }}>{step.title}</h4><p style={{ color: "rgba(14,27,50,0.65)", fontSize: "0.88rem", lineHeight: 1.55, margin: "0.42rem 0 0" }}>{step.text}</p></div></article></Fade>)}</div><div style={{ marginTop: "2.5rem", background: "var(--navy)", color: "var(--cream)", padding: "1.7rem", borderRadius: "1.1rem" }}><h4 className="ptp-display" style={{ fontSize: "1.45rem", fontWeight: 500, margin: "0 0 1.2rem" }}>Why create a parish Community?</h4><div className="grid md:grid-cols-2 gap-4">{benefits.map((benefit) => { const Icon = benefit.icon; return <div key={benefit.title} className="flex gap-3" style={{ padding: "0.2rem 0" }}><div style={{ flex: "0 0 auto", color: "var(--gold)", paddingTop: "0.15rem" }}><Icon size={18} /></div><div><h5 style={{ color: "var(--cream)", fontSize: "0.95rem", margin: 0 }}>{benefit.title}</h5><p style={{ color: "rgba(248,243,232,0.68)", fontSize: "0.84rem", lineHeight: 1.55, margin: "0.26rem 0 0" }}>{benefit.text}</p></div></div>; })}</div></div></div>;
}

function BroadcastStepVisual({ step }) {
  const shell = { minHeight: 170, background: "#101619", borderRadius: "0.8rem", color: "#F4F6F4", padding: "0.8rem", fontSize: "0.64rem", overflow: "hidden" };
  const dim = { color: "rgba(244,246,244,0.56)" };
  const action = { background: "#22C55E", color: "#07110B", borderRadius: "0.55rem", padding: "0.37rem 0.68rem", fontWeight: 700, display: "inline-block" };
  if (step === 1) return <div style={shell}><div className="flex items-center justify-end" style={{ fontSize: "1.1rem", height: 18 }}>⋮</div><div style={{ background: "#20282C", borderRadius: "0.55rem", padding: "0.45rem", margin: "0.2rem 0 0.65rem" }}>New group<br /><span style={{ display: "inline-block", marginTop: "0.45rem" }}>New community</span><br /><strong style={{ display: "inline-block", color: "#5BE588", marginTop: "0.45rem" }}>Broadcast lists</strong><br /><span style={{ display: "inline-block", marginTop: "0.45rem" }}>Linked devices</span></div><div style={dim}>Chats → menu → Broadcast lists</div></div>;
  if (step === 2) return <div style={shell}><div style={{ fontSize: "0.86rem", fontWeight: 600 }}>‹ &nbsp; Broadcasts</div><div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", margin: "0.7rem -0.8rem", padding: "0.75rem 0.8rem" }}><div className="flex justify-end"><span style={action}>＋</span></div><div style={{ marginTop: "2rem", textAlign: "center", ...dim }}>No broadcasts yet</div></div><div style={{ ...dim, fontSize: "0.58rem" }}>Tap + to start a new broadcast</div></div>;
  if (step === 3) return <div style={shell}><div style={{ background: "#1B2226", borderRadius: "999px", padding: "0.45rem 0.65rem", ...dim }}>← &nbsp; Search contacts</div><div style={{ marginTop: "0.7rem", fontWeight: 600 }}>Choose recipients</div>{["Anita Joseph", "Joseph Mathew", "Mary Thomas"].map((name, i) => <div key={name} className="flex items-center gap-2" style={{ marginTop: "0.55rem" }}><span style={{ width: 20, height: 20, borderRadius: "50%", background: i === 1 ? "#DDAF7D" : "#6F9DB0", display: "inline-block" }} /><span>{name}</span><span style={{ marginLeft: "auto", color: "#5BE588" }}>✓</span></div>)}</div>;
  return <div style={shell}><div className="flex items-center gap-2"><span style={{ width: 28, height: 28, borderRadius: "50%", background: "#F4F6F4", color: "#101619", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>⌁</span><div><div style={{ fontWeight: 600 }}>3 recipients</div><div style={{ ...dim, fontSize: "0.55rem" }}>Your parish broadcast list</div></div></div><div style={{ margin: "1rem auto", textAlign: "center", color: "#B6B9BA", background: "#1D2427", borderRadius: "999px", width: "fit-content", padding: "0.32rem 0.55rem", fontSize: "0.58rem" }}>Broadcast list created</div><div style={{ background: "#20282C", borderRadius: "0.65rem", padding: "0.5rem", ...dim }}>Write your first announcement…</div></div>;
}

function BroadcastGuide({ reduced }) {
  const steps = [
    { title: "Open Broadcast lists", text: "On Android, open Chats and tap the three-dot menu. On iPhone, find Broadcast Lists in Chats." },
    { title: "Start a new list", text: "Select New broadcast or New List, then tap the plus button to begin." },
    { title: "Choose recipients", text: "Select the contacts from your address book who should receive parish updates—up to 256 contacts." },
    { title: "Create and send", text: "Tap the checkmark or Create. Your new list is ready for the first message." },
  ];
  return <div style={{ padding: "4.5rem 0", borderTop: "1px solid rgba(14,27,50,0.1)" }}><div style={{ maxWidth: 760, marginBottom: "2.25rem" }}><Fade reduced={reduced}><p style={{ color: "var(--coral)", fontSize: "0.95rem", marginBottom: "0.7rem" }}>WhatsApp Broadcast Lists</p><h3 className="ptp-display" style={{ color: "var(--navy)", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 500, lineHeight: 1.15 }}>Share one message, privately</h3><p style={{ color: "rgba(14,27,50,0.7)", fontSize: "1rem", lineHeight: 1.7, marginTop: "1rem", maxWidth: 690 }}>A Broadcast List sends one update to many people as individual WhatsApp messages. Recipients do not see one another, making it useful for personal pastoral communication and timely reminders.</p></Fade></div><div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(205px, 1fr))" }}>{steps.map((step, index) => <Fade key={step.title} reduced={reduced} delay={index * 0.08}><article style={{ background: "white", border: "1px solid rgba(14,27,50,0.1)", borderRadius: "1rem", padding: "0.6rem", boxShadow: "0 12px 26px -24px rgba(8,16,31,0.45)" }}><BroadcastStepVisual step={index + 1} /><div style={{ padding: "1rem 0.5rem 0.45rem" }}><div style={{ color: "var(--coral)", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.28rem" }}>Step {index + 1}</div><h4 style={{ color: "var(--navy)", fontSize: "1.05rem", margin: 0 }}>{step.title}</h4><p style={{ color: "rgba(14,27,50,0.65)", fontSize: "0.88rem", lineHeight: 1.55, margin: "0.42rem 0 0" }}>{step.text}</p></div></article></Fade>)}</div><div style={{ marginTop: "2rem", padding: "1rem 1.2rem", borderLeft: "3px solid var(--teal)", background: "rgba(31,111,104,0.08)", color: "rgba(14,27,50,0.78)", fontSize: "0.9rem", lineHeight: 1.6 }}><strong style={{ color: "var(--navy)" }}>Helpful note:</strong> A recipient usually needs to have saved the sender’s phone number in their contacts to receive a WhatsApp broadcast.</div></div>;
}

function SocialSection({ setRef, reduced }) {
  return (
    <Section id="sec-social" ref={setRef} style={{ background: "var(--cream)" }}>
      <div className="max-w-6xl mx-auto w-full">
        <Fade reduced={reduced}>
          <p style={{ color: "var(--teal)", fontSize: "0.95rem", marginBottom: "0.8rem" }}>Social Media</p>
        </Fade>
        <h2 className="ptp-display" style={{ fontSize: "clamp(2rem, 5vw, 3.4rem)", fontWeight: 500, maxWidth: 720, lineHeight: 1.15, color: "var(--navy)" }}>
          <RevealWords reduced={reduced} text="Meeting people where they already are" />
        </h2>
        <Fade reduced={reduced} delay={0.15}>
          <p style={{ maxWidth: 620, marginTop: "1.4rem", color: "rgba(14,27,50,0.68)", fontSize: "1.05rem", lineHeight: 1.75 }}>
            A congregation now lives across screens as much as pews. We begin with the simplest and most direct parish communication tool: WhatsApp.
          </p>
        </Fade>

        <div style={{ borderTop: "1px solid rgba(14,27,50,0.1)" }}>
          <PlatformBlock
            reduced={reduced}
            icon={MessageCircle}
            tint="var(--teal)"
            name="WhatsApp"
            tagline="Direct, personal, dependable"
            body="Broadcast lists carry a pastor's voice straight into the pockets of the congregation — announcements, prayer requests, verses of the day, event reminders, and quiet words of encouragement, delivered the way people already talk to their families."
            visual={<ChatPhone reduced={reduced} />}
          />
          <CommunityGuide reduced={reduced} />
          <BroadcastGuide reduced={reduced} />
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------- Section 3 -------------------------------- */

function PosterBuild({ reduced }) {
  const [ref, inView] = useInView(0.4, reduced);
  const layerStyle = (delay, from) => ({
    opacity: reduced ? 1 : inView ? 1 : 0,
    transform: reduced ? "none" : inView ? "translate(0,0)" : from,
    transition: reduced ? "none" : `opacity 0.7s ease ${delay}s, transform 0.8s cubic-bezier(.22,1,.36,1) ${delay}s`,
  });
  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 340,
        aspectRatio: "3/4",
        borderRadius: "1.2rem",
        background: "linear-gradient(160deg, #10233F 0%, #0E1B32 100%)",
        boxShadow: "0 30px 70px -25px rgba(8,16,31,0.5)",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "8%",
          left: "8%",
          right: "8%",
          bottom: "38%",
          borderRadius: "0.8rem",
          background: "linear-gradient(135deg, var(--coral), var(--gold))",
          ...layerStyle(0.1, "translateY(-24px)"),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "8%",
          right: "8%",
          bottom: "24%",
          color: "var(--cream)",
          fontFamily: "'Fraunces', serif",
          fontSize: "1.35rem",
          fontWeight: 500,
          lineHeight: 1.1,
          ...layerStyle(0.35, "translateX(-30px)"),
        }}
      >
        Homecoming Sunday
      </div>
      <div
        style={{
          position: "absolute",
          left: "8%",
          bottom: "15%",
          color: "rgba(248,243,232,0.7)",
          fontSize: "0.72rem",
          ...layerStyle(0.5, "translateX(-20px)"),
        }}
      >
        October 12 · 9:00 AM
      </div>
      <div
        style={{
          position: "absolute",
          right: "8%",
          bottom: "9%",
          width: 46,
          height: 46,
          borderRadius: "50%",
          border: "2px solid var(--gold)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...layerStyle(0.65, "scale(0.6)"),
        }}
      >
        <ImageIcon size={16} color="var(--gold)" />
      </div>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "6%",
          background: "var(--teal)",
          ...layerStyle(0.8, "translateY(20px)"),
        }}
      />
    </div>
  );
}

function CanvaStepVisual({ step }) {
  const app = { borderRadius: "0.75rem", overflow: "hidden", background: "#F7F7FA", minHeight: 168, color: "#1E1E2A", border: "1px solid #E2E2EA", fontSize: "0.59rem" };
  const top = <div className="flex items-center justify-between" style={{ height: 27, padding: "0 0.55rem", background: "white", borderBottom: "1px solid #E9E9EF" }}><strong style={{ fontSize: "0.72rem", background: "linear-gradient(90deg, #8B3DFF, #16C7CC)", color: "transparent", backgroundClip: "text" }}>Canva</strong><span style={{ color: "#6E6E80" }}>⋯</span></div>;
  if (step === 1) return <div style={app}>{top}<div style={{ padding: "0.65rem" }}><strong style={{ fontSize: "0.66rem" }}>What will you design?</strong><div style={{ background: "white", border: "1px solid #DEDEEA", borderRadius: "0.4rem", padding: "0.4rem", color: "#777789", margin: "0.5rem 0" }}>⌕ Search poster templates</div><div className="grid grid-cols-3 gap-2">{["Poster", "Instagram", "Presentation"].map((size, i) => <div key={size} style={{ borderRadius: "0.35rem", padding: "0.45rem 0.2rem", textAlign: "center", background: i === 0 ? "linear-gradient(135deg, #8B3DFF, #16C7CC)" : "#ECECF3", color: i === 0 ? "white" : "#4C4C5A", fontSize: "0.52rem" }}>{size}</div>)}</div></div></div>;
  if (step === 2) return <div style={app}>{top}<div style={{ padding: "0.6rem" }}><strong style={{ fontSize: "0.65rem" }}>Poster templates</strong><div className="grid grid-cols-3 gap-2" style={{ marginTop: "0.5rem" }}>{["#E6A337", "#345A88", "#C4667A", "#4A987F", "#7E66B6", "#C58B46"].map((color, i) => <div key={i} style={{ aspectRatio: "0.72", borderRadius: "0.28rem", padding: "0.28rem", background: `linear-gradient(150deg, ${color}, #1E2841)`, color: "white", fontSize: "0.44rem" }}>{i === 0 ? "SUNDAY\nSERVICE" : "YOUR\nEVENT"}</div>)}</div></div></div>;
  if (step === 3) return <div style={app}>{top}<div className="flex" style={{ height: 140 }}><div style={{ width: 38, padding: "0.4rem 0.25rem", background: "white", color: "#6B6B7C", textAlign: "center", lineHeight: 2.1 }}>T<br />▣<br />◉<br />↑</div><div style={{ flex: 1, padding: "0.55rem", display: "flex", alignItems: "center", justifyContent: "center", background: "#ECECF2" }}><div style={{ height: 112, width: 82, padding: "0.55rem", background: "linear-gradient(145deg, #E2703A, #C89B3C)", color: "white", boxShadow: "0 8px 16px -10px #333" }}><div style={{ borderTop: "1px solid rgba(255,255,255,0.7)", paddingTop: "0.5rem", fontFamily: "'Fraunces', serif", fontSize: "0.86rem" }}>Homecoming<br />Sunday</div><div style={{ marginTop: "2.6rem", fontSize: "0.46rem" }}>OCT 12 · 9:00 AM</div></div></div></div></div>;
  return <div style={app}>{top}<div style={{ padding: "0.7rem" }}><strong style={{ fontSize: "0.65rem" }}>Ready to share?</strong><div style={{ marginTop: "0.55rem", background: "white", borderRadius: "0.45rem", padding: "0.5rem" }}><div className="flex items-center justify-between"><span>Download</span><span style={{ color: "#7D3CFF" }}>⌄</span></div><div style={{ color: "#717183", fontSize: "0.52rem", marginTop: "0.25rem" }}>PNG · best for WhatsApp</div></div><div className="flex gap-2" style={{ marginTop: "0.55rem" }}><span style={{ color: "white", background: "#7D3CFF", borderRadius: "0.35rem", padding: "0.38rem 0.55rem", fontSize: "0.55rem" }}>Download</span><span style={{ color: "#7D3CFF", background: "#EEE6FF", borderRadius: "0.35rem", padding: "0.38rem 0.55rem", fontSize: "0.55rem" }}>Share link</span></div></div></div>;
}

function CanvaGuide({ reduced }) {
  const steps = [
    { title: "Choose the format", text: "Search “Poster” and select the size that suits a noticeboard or WhatsApp post." },
    { title: "Start with a template", text: "Browse the template gallery and choose a clear layout rather than beginning with a blank page." },
    { title: "Make it your parish’s", text: "Tap the text to replace it, then add the correct date, time, logo, image, and one clear message." },
    { title: "Download or share", text: "Use Download to save a PNG for WhatsApp, or share a link with a teammate for final review." },
  ];
  return <div style={{ marginTop: "4rem", paddingTop: "3rem", borderTop: "1px solid rgba(14,27,50,0.12)" }}><Fade reduced={reduced}><p style={{ color: "#7D3CFF", fontSize: "0.88rem", fontWeight: 700, marginBottom: "0.55rem" }}>Canva in four practical steps</p><h3 className="ptp-display" style={{ color: "var(--navy)", fontSize: "clamp(1.6rem, 3.6vw, 2.5rem)", fontWeight: 500, margin: 0 }}>From a parish idea to a finished poster</h3><p style={{ color: "rgba(14,27,50,0.68)", lineHeight: 1.65, maxWidth: 680, margin: "0.8rem 0 1.6rem" }}>Templates give you a strong starting point. Your work is to make the details accurate, readable, and unmistakably yours.</p></Fade><div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(205px, 1fr))" }}>{steps.map((step, index) => <Fade key={step.title} reduced={reduced} delay={index * 0.08}><article style={{ height: "100%", background: "white", border: "1px solid rgba(14,27,50,0.1)", borderRadius: "1rem", padding: "0.65rem", boxShadow: "0 12px 26px -24px rgba(8,16,31,0.45)" }}><CanvaStepVisual step={index + 1} /><div style={{ padding: "0.9rem 0.35rem 0.3rem" }}><div style={{ color: "#7D3CFF", fontSize: "0.69rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Step {index + 1}</div><h4 style={{ color: "var(--navy)", fontSize: "1.02rem", margin: "0.3rem 0" }}>{step.title}</h4><p style={{ color: "rgba(14,27,50,0.66)", fontSize: "0.83rem", lineHeight: 1.52, margin: 0 }}>{step.text}</p></div></article></Fade>)}</div><div className="flex flex-wrap items-center justify-between gap-4" style={{ marginTop: "1.35rem", padding: "0.9rem 1rem", borderRadius: "0.8rem", background: "rgba(125,60,255,0.08)", borderLeft: "3px solid #7D3CFF" }}><p style={{ color: "rgba(14,27,50,0.74)", fontSize: "0.84rem", lineHeight: 1.5, margin: 0 }}>Ready to make your parish poster? Open Canva and choose a template to begin.</p><a href="https://www.canva.com/" target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto", color: "white", background: "#7D3CFF", borderRadius: "0.45rem", padding: "0.52rem 0.8rem", textDecoration: "none", fontSize: "0.84rem", fontWeight: 600 }}>Open Canva ↗</a></div><div style={{ marginTop: "1.35rem", padding: "0.9rem 1rem", background: "rgba(125,60,255,0.08)", borderLeft: "3px solid #7D3CFF", color: "rgba(14,27,50,0.75)", fontSize: "0.84rem", lineHeight: 1.55 }}><strong style={{ color: "var(--navy)" }}>A simple rule:</strong> one poster, one message. Keep the date, time, location, and call to action easy to find at a glance.</div></div>;
}

function GoogleToolLogo({ type }) {
  const shell = { width: 62, height: 62, borderRadius: "1rem", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto", boxShadow: "0 10px 22px -16px rgba(8,16,31,0.55)" };
  if (type === "Keep") return <div style={{ ...shell, background: "#F9E44B", color: "#5D5512", fontSize: "1.75rem" }}>💡</div>;
  if (type === "Calendar") return <div style={{ ...shell, background: "#fff", border: "5px solid #4285F4", color: "#4285F4", fontWeight: 700, fontSize: "1.3rem", position: "relative" }}><span style={{ position: "absolute", top: 2, left: 0, right: 0, height: 10, background: "#4285F4" }} />12</div>;
  if (type === "Drive") return <div style={{ ...shell, background: "#fff" }}><span style={{ width: 0, height: 0, borderLeft: "21px solid transparent", borderRight: "21px solid transparent", borderBottom: "37px solid #0F9D58", position: "relative" }}><span style={{ position: "absolute", width: 21, height: 37, background: "#4285F4", transform: "rotate(60deg)", left: -10, top: 5 }} /></span></div>;
  if (type === "Forms") return <div style={{ ...shell, background: "#7248B9", color: "white", fontSize: "1.55rem" }}>☷</div>;
  if (type === "Notion") return <div style={{ ...shell, background: "#fff", color: "#171717", border: "3px solid #171717", fontSize: "1.65rem", fontFamily: "Georgia, serif", fontWeight: 700 }}>N</div>;
  return <div style={{ ...shell, background: "#1E8E3E", color: "white", fontSize: "1.5rem" }}>▦</div>;
}

function MinistryToolStory({ tool, reduced, reverse }) {
  const visuals = {
    Keep: <div style={{ background: "#FFF8B8", borderRadius: "0.75rem", padding: "1rem", boxShadow: "0 12px 28px -20px rgba(8,16,31,0.5)", transform: "rotate(-2deg)" }}><strong style={{ color: "#4F4812", fontSize: "0.75rem" }}>Sunday sermon ideas</strong><p style={{ color: "#665D17", fontSize: "0.7rem", lineHeight: 1.5 }}>• God meets us in the ordinary<br />• Call Mrs. Mary<br />• Youth prayer theme</p><span style={{ color: "#826F00", fontSize: "0.62rem" }}>🔔 Remind me Friday</span></div>,
    Calendar: <div style={{ background: "#fff", borderRadius: "0.75rem", padding: "0.7rem", boxShadow: "0 12px 28px -20px rgba(8,16,31,0.5)", minWidth: 200 }}><strong style={{ color: "#334155", fontSize: "0.7rem" }}>October 2026</strong><div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginTop: "0.55rem" }}>{Array.from({ length: 21 }, (_, i) => <span key={i} style={{ background: i === 7 ? "#4285F4" : i === 14 ? "#34A853" : "#EDF2F8", color: i === 7 || i === 14 ? "white" : "#718096", borderRadius: "0.2rem", padding: "0.2rem", textAlign: "center", fontSize: "0.52rem" }}>{i + 1}</span>)}</div><p style={{ color: "#4285F4", fontSize: "0.62rem", margin: "0.55rem 0 0" }}>Holy Qurbana · 9:00 AM</p></div>,
    Drive: <div style={{ background: "#fff", borderRadius: "0.75rem", padding: "0.75rem", boxShadow: "0 12px 28px -20px rgba(8,16,31,0.5)", minWidth: 210 }}><strong style={{ color: "#334155", fontSize: "0.7rem" }}>Parish shared drive</strong>{["Sermons", "Parish documents", "Photos & media"].map((folder, i) => <div key={folder} className="flex items-center gap-2" style={{ padding: "0.42rem 0", borderBottom: i === 2 ? 0 : "1px solid #EEF2F6", color: "#526071", fontSize: "0.64rem" }}><span style={{ color: "#FABB05" }}>▰</span>{folder}<span style={{ marginLeft: "auto", color: "#34A853" }}>Shared</span></div>)}</div>,
    Forms: <div style={{ background: "#fff", borderRadius: "0.75rem", overflow: "hidden", boxShadow: "0 12px 28px -20px rgba(8,16,31,0.5)", minWidth: 210 }}><div style={{ height: 7, background: "#7248B9" }} /><div style={{ padding: "0.75rem" }}><strong style={{ color: "#3E2A69", fontSize: "0.7rem" }}>Youth retreat registration</strong><p style={{ color: "#7B6C94", fontSize: "0.61rem", margin: "0.42rem 0" }}>Name</p><div style={{ borderBottom: "1px solid #DAD3E8", height: 10 }} /><p style={{ color: "#7B6C94", fontSize: "0.61rem", margin: "0.55rem 0 0.25rem" }}>Will you attend?</p><span style={{ fontSize: "0.6rem", color: "#3E2A69" }}>◯ Yes &nbsp; ◯ No</span></div></div>,
    Sheets: <div style={{ background: "#fff", borderRadius: "0.75rem", overflow: "hidden", boxShadow: "0 12px 28px -20px rgba(8,16,31,0.5)", minWidth: 210 }}><div style={{ height: 7, background: "#1E8E3E" }} /><div style={{ padding: "0.65rem" }}><strong style={{ color: "#1E6A34", fontSize: "0.68rem" }}>Retreat attendance</strong><div style={{ display: "grid", gridTemplateColumns: "1.5fr 0.6fr", marginTop: "0.45rem", fontSize: "0.58rem" }}>{["Name", "Present", "Anita", "✓", "Joseph", "✓", "Mary", "—"].map((cell, i) => <span key={i} style={{ padding: "0.28rem", border: "1px solid #D6E7DB", color: i < 2 ? "#1E6A34" : "#526071", fontWeight: i < 2 ? 700 : 400 }}>{cell}</span>)}</div></div></div>,
    Notion: <div style={{ background: "#fff", border: "2px solid #202020", borderRadius: "0.75rem", padding: "0.85rem", boxShadow: "0 12px 28px -20px rgba(8,16,31,0.5)", minWidth: 210 }}><strong style={{ color: "#1A1A1A", fontSize: "0.72rem" }}>Parish workspace</strong><p style={{ color: "#7A7A7A", fontSize: "0.59rem", margin: "0.38rem 0" }}>Weekly ministry meeting</p>{["□ Sunday service plan", "□ Follow up new families", "□ Youth team tasks"].map((item) => <p key={item} style={{ color: "#3B3B3B", fontSize: "0.61rem", margin: "0.32rem 0", paddingBottom: "0.28rem", borderBottom: "1px solid #EEEEEE" }}>{item}</p>)}</div>,
  };
  return <Fade reduced={reduced}><article className={`flex flex-col ${reverse ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-10 lg:gap-16`} style={{ padding: "2.5rem 0", borderTop: "1px solid rgba(14,27,50,0.1)" }}><div className="w-full lg:w-1/2"><div className="flex items-center gap-3 mb-4"><GoogleToolLogo type={tool.name} /><div><p style={{ color: tool.color, fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>{tool.prompt}</p><h4 className="ptp-display" style={{ color: "var(--navy)", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 500, margin: "0.2rem 0 0" }}>Google {tool.name}</h4></div></div><p style={{ color: "rgba(14,27,50,0.72)", fontSize: "0.98rem", lineHeight: 1.65, maxWidth: 520 }}>{tool.description}</p><div style={{ marginTop: "1rem", paddingLeft: "0.85rem", borderLeft: `3px solid ${tool.color}` }}><strong style={{ color: "var(--navy)", fontSize: "0.8rem" }}>For ministry</strong><p style={{ color: "rgba(14,27,50,0.66)", fontSize: "0.86rem", lineHeight: 1.5, margin: "0.25rem 0 0" }}>{tool.ministry}</p></div></div><div className="w-full lg:w-1/2 flex justify-center">{visuals[tool.name]}</div></article></Fade>;
}

function GoogleAutomation({ reduced }) {
  const nodes = ["Google Form\nregistration", "Google Sheet\nresponse list", "Apps Script\nautomation", "Calendar + email\nconfirmation"];
  return <Fade reduced={reduced}><div style={{ marginTop: "2.8rem", background: "var(--navy)", borderRadius: "1.15rem", padding: "1.5rem", color: "var(--cream)" }}><p style={{ color: "var(--gold)", fontSize: "0.78rem", letterSpacing: "0.08em", fontWeight: 700, textTransform: "uppercase", margin: 0 }}>Google Workspace automation</p><h3 className="ptp-display" style={{ fontSize: "1.65rem", fontWeight: 500, margin: "0.35rem 0 0.6rem" }}>Let the system carry the repetitive step.</h3><p style={{ color: "rgba(248,243,232,0.7)", fontSize: "0.88rem", lineHeight: 1.55, maxWidth: 710, margin: 0 }}>The technology is Google Apps Script - a small JavaScript automation layer for Google Workspace. For example, one retreat registration can update a sheet, create a calendar event, and send a confirmation without copying the same information by hand.</p><div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))", marginTop: "1.35rem" }}>{nodes.map((node, index) => <React.Fragment key={node}><div style={{ minHeight: 72, borderRadius: "0.7rem", background: "rgba(248,243,232,0.08)", border: "1px solid rgba(248,243,232,0.14)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0.6rem", textAlign: "center", whiteSpace: "pre-line", fontSize: "0.76rem", lineHeight: 1.35 }}>{node}</div>{index < nodes.length - 1 && <div aria-hidden="true" style={{ display: "none" }}>→</div>}</React.Fragment>)}</div><p style={{ color: "rgba(248,243,232,0.48)", fontSize: "0.7rem", margin: "1rem 0 0" }}>Start with one safe, repeatable task. Automation should reduce copying, not replace pastoral judgment.</p></div></Fade>;
}

function ToolsSection({ setRef, reduced }) {
  const uses = [
    { icon: ImageIcon, label: "Posters" },
    { icon: Calendar, label: "Event invitations" },
    { icon: TypeIcon, label: "Sermon slides" },
    { icon: Camera, label: "Social media posts" },
    { icon: Send, label: "Announcements" },
    { icon: Award, label: "Certificates" },
    { icon: Wand2, label: "Church graphics" },
  ];
  const ministryTools = [
    { name: "Keep", prompt: "Capture before you forget", color: "#A99000", description: "Keep is your pocket notebook: save a thought as text, a checklist, a photo, or an audio note, then find it later with labels, colour, and search.", ministry: "Capture sermon ideas, pastoral follow-ups, prayer points, and voice notes the moment they arise." },
    { name: "Calendar", prompt: "Know what is next", color: "#4285F4", description: "Calendar places visits, programmes, and recurring events in one shared schedule, with reminders and attachments kept alongside each event.", ministry: "Create a parish calendar for services, home visits, meetings, and ministry events so the team stays in step." },
    { name: "Drive", prompt: "Keep the parish memory safe", color: "#0F9D58", description: "Drive stores documents and folders in one accessible place, letting you control who can view, comment, or edit each shared resource.", ministry: "Keep approved notices, liturgy files, photos, posters, and handover documents organised beyond one person’s phone." },
    { name: "Forms", prompt: "Collect without confusion", color: "#7248B9", description: "Forms turns a question into a simple shareable registration, survey, or feedback form. Responses can be viewed as they arrive or sent to a spreadsheet.", ministry: "Use it for retreat registrations, volunteer sign-up, prayer requests, and quick feedback after an event." },
    { name: "Sheets", prompt: "See the whole picture", color: "#1E8E3E", description: "Sheets organises information into a shared table that can be sorted, filtered, and updated together in real time.", ministry: "Track attendance, registrations, contact lists, simple budgets, and follow-up tasks with the right team." },
    { name: "Notion", prompt: "Build one shared parish workspace", color: "#171717", description: "Notion combines notes, pages, simple databases, and tasks in one flexible workspace that a team can keep up to date together.", ministry: "Create a ministry handbook, a sermon-planning hub, volunteer task board, or one home for meeting notes and decisions." },
  ];
  return (
    <Section
      id="sec-tools"
      ref={setRef}
      style={{ background: "linear-gradient(180deg, #F8F3E8 0%, #EFE6D3 100%)" }}
    >
      <div className="max-w-6xl mx-auto w-full flex flex-col items-start gap-14">
        <div className="w-full">
          <Fade reduced={reduced}>
            <p style={{ color: "var(--coral)", fontSize: "0.95rem", marginBottom: "0.8rem" }}>Tools for Daily Use</p>
          </Fade>
          <h2 className="ptp-display" style={{ fontSize: "clamp(2rem, 4.6vw, 3.2rem)", fontWeight: 500, lineHeight: 1.15, color: "var(--navy)" }}>
            <RevealWords reduced={reduced} text="Every ministry needs a design team. Canva can be yours." />
          </h2>
          <Fade reduced={reduced} delay={0.15}>
            <p style={{ maxWidth: 500, marginTop: "1.4rem", color: "rgba(14,27,50,0.7)", fontSize: "1.02rem", lineHeight: 1.75 }}>
              No design background required. Canva's drag-and-drop templates let any volunteer on a
              ministry team build something polished in minutes — turning a blank page into a finished
              piece the whole congregation will see.
            </p>
          </Fade>
          <Fade reduced={reduced} delay={0.3}>
            <div className="flex flex-wrap gap-2.5 mt-8">
              {uses.map((u, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2"
                  style={{
                    background: "white",
                    border: "1px solid rgba(14,27,50,0.1)",
                    borderRadius: "999px",
                    padding: "0.5rem 0.95rem",
                    fontSize: "0.85rem",
                    color: "var(--navy)",
                  }}
                >
                  <u.icon size={14} color="var(--coral)" />
                  {u.label}
                </span>
              ))}
            </div>
          </Fade>
        </div>
      </div>
      <div className="max-w-6xl mx-auto w-full">
        <CanvaGuide reduced={reduced} />
        <div style={{ marginTop: "3.5rem", paddingTop: "2.5rem", borderTop: "1px solid rgba(14,27,50,0.12)" }}>
          <Fade reduced={reduced} delay={0.1}>
            <p style={{ color: "var(--teal)", fontSize: "0.88rem", fontWeight: 600, marginBottom: "0.55rem" }}>Organise the work behind ministry</p>
            <h3 className="ptp-display" style={{ color: "var(--navy)", fontSize: "clamp(1.45rem, 3vw, 2.1rem)", fontWeight: 500, marginBottom: "1.25rem" }}>Use the smallest tool that solves the task.</h3>
          </Fade>
          <div>{ministryTools.map((tool, index) => <MinistryToolStory key={tool.name} tool={tool} reduced={reduced} reverse={index % 2 === 1} />)}</div>
          <GoogleAutomation reduced={reduced} />
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------- Section 4 -------------------------------- */

function Constellation({ reduced }) {
  const [ref, inView] = useInView(0.3, reduced);
  const nodes = useMemo(
    () =>
      Array.from({ length: 16 }).map(() => ({
        x: 6 + Math.random() * 88,
        y: 6 + Math.random() * 88,
        r: 1.6 + Math.random() * 1.6,
      })),
    []
  );
  const edges = useMemo(() => {
    const list = [];
    nodes.forEach((_, i) => {
      const a = i;
      const b = (i + 3) % nodes.length;
      const c = (i + 5) % nodes.length;
      list.push([a, b], [a, c]);
    });
    return list;
  }, [nodes]);

  return (
    <div ref={ref} style={{ width: "100%", maxWidth: 460, aspectRatio: "1/1" }}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" role="presentation" aria-hidden="true">
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke="rgba(200,155,60,0.28)"
            strokeWidth="0.25"
            style={{
              opacity: reduced ? 1 : inView ? 1 : 0,
              transition: reduced ? "none" : `opacity 1s ease ${0.03 * i}s`,
            }}
          />
        ))}
        {nodes.map((n, i) => (
          <circle
            key={i}
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill={i % 3 === 0 ? "var(--gold)" : "var(--teal)"}
            style={{
              opacity: reduced ? 0.9 : inView ? 0.9 : 0,
              transition: reduced ? "none" : `opacity 0.8s ease ${0.04 * i}s`,
              animation: reduced ? "none" : `ptp-drift ${5 + (i % 5)}s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </svg>
    </div>
  );
}

function AISection({ setRef, reduced }) {
  return (
    <Section
      id="sec-ai"
      ref={setRef}
      style={{ background: "radial-gradient(circle at 80% 15%, #142445 0%, var(--navy) 55%, var(--navy-deep) 100%)", color: "var(--cream)" }}
    >
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 mb-16">
          <div className="w-full lg:w-3/5">
            <Fade reduced={reduced}>
              <p style={{ color: "var(--gold)", fontSize: "0.95rem", marginBottom: "0.8rem" }}>Artificial Intelligence</p>
            </Fade>
            <h2 className="ptp-display" style={{ fontSize: "clamp(2rem, 4.6vw, 3.2rem)", fontWeight: 500, lineHeight: 1.15, color: "var(--cream)" }}>
              <RevealWords reduced={reduced} text="A study companion, not a shepherd" />
            </h2>
            <Fade reduced={reduced} delay={0.15}>
              <p style={{ maxWidth: 560, marginTop: "1.3rem", color: "rgba(248,243,232,0.7)", fontSize: "1.02rem", lineHeight: 1.75 }}>
                Used well, AI tools save hours of preparation time so leaders can spend more of it with people,
                not screens.
              </p>
            </Fade>
          </div>
          <div className="w-full lg:w-2/5 flex justify-center">
            <Constellation reduced={reduced} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <Fade reduced={reduced} delay={0.1}>
            <div style={{ background: "rgba(248,243,232,0.05)", border: "1px solid rgba(248,243,232,0.12)", borderRadius: "1.2rem", padding: "1.8rem" }}>
              <div className="flex items-center gap-3 mb-4">
                <Sparkles size={18} color="var(--gold)" />
                <h3 className="ptp-display" style={{ fontSize: "1.25rem", fontWeight: 500, color: "var(--cream)" }}>ChatGPT &amp; Claude</h3>
              </div>
              <ul style={{ color: "rgba(248,243,232,0.75)", fontSize: "0.95rem", lineHeight: 2, listStyle: "none", padding: 0 }}>
                <li>Brainstorming sermon series and teaching themes</li>
                <li>Drafting first passes of announcements and letters</li>
                <li>Building small-group and youth study questions</li>
                <li>Translating content for multilingual congregations</li>
                <li>Organizing notes into clear outlines</li>
              </ul>
            </div>
          </Fade>
          <Fade reduced={reduced} delay={0.25}>
            <div style={{ background: "rgba(248,243,232,0.05)", border: "1px solid rgba(248,243,232,0.12)", borderRadius: "1.2rem", padding: "1.8rem" }}>
              <div className="flex items-center gap-3 mb-4">
                <Search size={18} color="var(--gold)" />
                <h3 className="ptp-display" style={{ fontSize: "1.25rem", fontWeight: 500, color: "var(--cream)" }}>Perplexity</h3>
              </div>
              <ul style={{ color: "rgba(248,243,232,0.75)", fontSize: "0.95rem", lineHeight: 2, listStyle: "none", padding: 0 }}>
                <li>Researching topics with cited, checkable sources</li>
                <li>Fact-checking historical or cultural references</li>
                <li>Preparing grounded answers to hard questions</li>
              </ul>
            </div>
          </Fade>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <Fade reduced={reduced} delay={0.1}><div style={{ background: "rgba(248,243,232,0.05)", border: "1px solid rgba(248,243,232,0.12)", borderRadius: "1.2rem", padding: "1.5rem" }}><h3 className="ptp-display" style={{ fontSize: "1.2rem", color: "var(--cream)", fontWeight: 500, marginBottom: "0.75rem" }}>The 4-tool compass</h3><div style={{ color: "rgba(248,243,232,0.75)", fontSize: "0.9rem", lineHeight: 1.8 }}><p style={{ margin: 0 }}><strong>ChatGPT / Gemini:</strong> think, draft, and challenge</p><p style={{ margin: 0 }}><strong>Perplexity:</strong> find current, cited information</p><p style={{ margin: 0 }}><strong>NotebookLM:</strong> study your own sources</p></div></div></Fade>
          <Fade reduced={reduced} delay={0.2}><div style={{ background: "rgba(248,243,232,0.05)", border: "1px solid rgba(248,243,232,0.12)", borderRadius: "1.2rem", padding: "1.5rem" }}><h3 className="ptp-display" style={{ fontSize: "1.2rem", color: "var(--cream)", fontWeight: 500, marginBottom: "0.75rem" }}>Prompt with purpose</h3><p style={{ color: "var(--gold)", fontSize: "0.82rem", fontWeight: 600, letterSpacing: "0.04em", margin: 0 }}>ROLE + CONTEXT + TASK + CONSTRAINTS + FORMAT</p><p style={{ color: "rgba(248,243,232,0.72)", fontSize: "0.88rem", lineHeight: 1.55, margin: "0.7rem 0 0" }}>State who the assistant should be, your congregation and goal, what you need, any boundaries, and the shape of the response.</p></div></Fade>
        </div>

        <Fade reduced={reduced} delay={0.2}>
          <div
            style={{
              borderLeft: "3px solid var(--gold)",
              paddingLeft: "1.6rem",
              maxWidth: 720,
            }}
          >
            <p className="ptp-display" style={{ fontSize: "clamp(1.15rem, 2.2vw, 1.5rem)", fontStyle: "italic", lineHeight: 1.6, color: "var(--cream)" }}>
              Wisdom, discernment, truth, pastoral care, and spiritual leadership remain — and will always
              remain — human responsibilities.
            </p>
            <p style={{ marginTop: "0.9rem", color: "rgba(248,243,232,0.55)", fontSize: "0.9rem" }}>
              AI can prepare a draft. It cannot carry a congregation.
            </p>
          </div>
        </Fade>
        <Fade reduced={reduced} delay={0.3}><div style={{ marginTop: "2rem", padding: "1.15rem 1.35rem", background: "rgba(226,112,58,0.12)", border: "1px solid rgba(226,112,58,0.35)", borderRadius: "0.9rem", maxWidth: 850 }}><strong style={{ color: "var(--cream)", fontSize: "0.92rem" }}>AI safety for ministry</strong><p style={{ color: "rgba(248,243,232,0.75)", fontSize: "0.88rem", lineHeight: 1.6, margin: "0.4rem 0 0" }}>Verify Scripture, citations, historical claims, and current facts. Do not share confidential pastoral information or sensitive personal data. AI may assist preparation, but final pastoral, ethical, and theological judgment remains human.</p></div></Fade>
      </div>
    </Section>
  );
}

/* ------------------------------- Section 5 -------------------------------- */

function ConclusionSection({ setRef, reduced }) {
  return (
    <Section
      id="sec-close"
      ref={setRef}
      className="items-center text-center"
      style={{ background: "linear-gradient(160deg, #C89B3C 0%, #E2703A 100%)", color: "var(--navy-deep)" }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 50% 50%, rgba(248,243,232,0.25), transparent 60%)",
          animation: reduced ? "none" : "ptp-pulse-soft 8s ease-in-out infinite",
        }}
      />
      <div className="relative z-10 max-w-3xl mx-auto">
        <Fade reduced={reduced}>
          <Compass size={30} style={{ margin: "0 auto 1.6rem", opacity: 0.75 }} />
        </Fade>

        <h2 className="ptp-display" style={{ fontSize: "clamp(2rem, 5.5vw, 4rem)", fontWeight: 500, lineHeight: 1.18, color: "var(--navy-deep)" }}>
          <RevealWords reduced={reduced} delay={0.1} text="Technology is a tool." />
          <br />
          <RevealWords reduced={reduced} delay={0.55} text="People are the mission." />
        </h2>

        <Fade reduced={reduced} delay={1.0}>
          <p style={{ maxWidth: 560, margin: "1.8rem auto 0", fontSize: "1.05rem", lineHeight: 1.8, color: "rgba(8,16,31,0.75)" }}>
            Every broadcast, every post, every design, every AI-assisted sermon note exists to serve one
            purpose — helping the Church reach people, communicate clearly, and love its communities with
            wisdom and compassion.
          </p>
        </Fade>

        <Fade reduced={reduced} delay={1.3}>
          <div className="mt-14 pt-8" style={{ borderTop: "1px solid rgba(8,16,31,0.15)" }}>
            <p className="ptp-display" style={{ fontSize: "1.1rem", fontWeight: 500 }}>
              From Pulpit to Pixels
            </p>
            <p style={{ fontSize: "0.85rem", color: "rgba(8,16,31,0.6)", marginTop: "0.35rem" }}>
              Prepared for church and ministry leaders convening on October 12
            </p>
          </div>
        </Fade>
      </div>
    </Section>
  );
}

/* --------------------------------- App ----------------------------------- */

export default function App() {
  const reduced = usePrefersReducedMotion();
  const progress = useScrollProgress();
  const ids = useMemo(() => SECTIONS.map((s) => s.id), []);
  const active = useActiveSection(ids);
  const refs = useRef({});

  const setRef = useCallback((id) => (el) => {
    refs.current[id] = el;
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const order = SECTIONS.map((s) => s.id);
      const currentIdx = active;
      let next = null;
      if (["ArrowDown", "PageDown"].includes(e.key)) next = Math.min(order.length - 1, currentIdx + 1);
      if (["ArrowUp", "PageUp"].includes(e.key)) next = Math.max(0, currentIdx - 1);
      if (e.key === "Home") next = 0;
      if (e.key === "End") next = order.length - 1;
      if (next !== null) {
        e.preventDefault();
        document.getElementById(order[next])?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, reduced]);

  return (
    <div className={`ptp-root ${reduced ? "ptp-reduced" : ""}`}>
      <GlobalStyles />
      <ProgressNav progress={progress} active={active} reduced={reduced} />
      <main>
        <OpeningSection setRef={setRef("sec-open")} reduced={reduced} />
        <HiddenAdminSection setRef={setRef("sec-admin")} reduced={reduced} />
        <SessionMapSection setRef={setRef("sec-map")} reduced={reduced} />
        <SocialSection setRef={setRef("sec-social")} reduced={reduced} />
        <ToolsTransitionSection setRef={setRef("sec-tools-intro")} reduced={reduced} />
        <ToolsSection setRef={setRef("sec-tools")} reduced={reduced} />
        <AISection setRef={setRef("sec-ai")} reduced={reduced} />
        <ConclusionSection setRef={setRef("sec-close")} reduced={reduced} />
      </main>
    </div>
  );
}
