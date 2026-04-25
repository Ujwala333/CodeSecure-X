import Link from "next/link";
import { MichiBotHero } from "@/components/MichiBotHero";
import {
  Shield, ScanLine, Zap, FileText, ChevronRight, Code2,
  AlertTriangle, CheckCircle2, Lock,
} from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Instant AI Analysis",
    desc: "Powered by Nebius LLM - paste code and get results in seconds.",
    color: "hsl(210,100%,56%)",
    hoverClass: "card-lightning"
  },
  {
    icon: AlertTriangle,
    title: "Multi-Severity Detection",
    desc: "Finds Critical, High, Medium and Low severity vulnerabilities.",
    color: "hsl(0,72%,51%)",
    hoverClass: "card-warning"
  },
  {
    icon: CheckCircle2,
    title: "Fix Suggestions",
    desc: "Each vulnerability comes with a concrete, actionable fix.",
    color: "hsl(142,71%,45%)",
    hoverClass: "card-check"
  },
  {
    icon: FileText,
    title: "PDF Reports",
    desc: "Generate professional security reports - downloadable instantly.",
    color: "hsl(38,92%,50%)",
    hoverClass: "card-doc"
  },
  {
    icon: Code2,
    title: "4 Languages",
    desc: "Python, JavaScript, Java, and PHP - with Monaco code editor.",
    color: "hsl(270,60%,65%)",
    hoverClass: "card-code"
  },
  {
    icon: Lock,
    title: "Privacy First",
    desc: "Code is never stored - only a SHA-256 hash is kept in the database.",
    color: "hsl(210,100%,56%)",
    hoverClass: "card-lock"
  },
];

export default function HomePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .homeWrapper {
          min-height: calc(100vh - 64px);
          background:
            linear-gradient(115deg, #05050f 0%, #080b19 42%, #05050f 100%);
          position: relative;
          overflow: hidden;
        }
        .homeWrapper::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(56, 128, 255, 0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56, 128, 255, 0.04) 1px, transparent 1px);
          background-size: 72px 72px;
          mask-image: linear-gradient(to bottom, black 0%, black 58%, transparent 92%);
          pointer-events: none;
        }
        .homeWrapper::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(5, 5, 15, 0.15), transparent 48%, rgba(4, 8, 18, 0.72)),
            linear-gradient(to bottom, transparent 0%, rgba(5, 5, 15, 0.92) 92%);
          pointer-events: none;
        }
        .heroSection {
          position: relative;
          z-index: 1;
          min-height: calc(100svh - 64px);
          display: grid;
          grid-template-columns: minmax(0, 0.9fr) minmax(420px, 1.1fr);
          align-items: center;
          gap: clamp(32px, 5vw, 88px);
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: clamp(56px, 7vw, 96px) clamp(22px, 5vw, 64px) clamp(42px, 5vw, 72px);
        }
        .heroCopy {
          max-width: 560px;
          animation: heroCopyIn 720ms ease-out both;
        }
        .heroBadge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: hsl(210,100%,62%);
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 28px;
        }
        .heroTitle {
          font-size: clamp(48px, 6vw, 82px);
          line-height: 0.98;
          font-weight: 800;
          letter-spacing: 0;
          color: white;
          margin: 0;
        }
        .heroTitleAccent {
          display: block;
          color: hsl(210,100%,56%);
          margin-top: 8px;
        }
        .heroText {
          max-width: 520px;
          color: hsl(215,16%,70%);
          font-size: clamp(16px, 1.5vw, 19px);
          line-height: 1.65;
          margin: 28px 0 0;
        }
        .heroActions {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 36px;
        }
        .heroPrimary,
        .heroSecondary {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          min-height: 46px;
          padding: 0 22px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          transition: transform 180ms ease, background 180ms ease, border-color 180ms ease;
        }
        .heroPrimary {
          background: hsl(210,100%,56%);
          color: white;
          box-shadow: 0 18px 46px rgba(0, 133, 255, 0.26);
        }
        .heroSecondary {
          color: hsl(213,31%,91%);
          background: rgba(255,255,255,0.045);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .heroPrimary:hover,
        .heroSecondary:hover {
          transform: translateY(-2px);
        }
        .heroPrimary:hover {
          background: hsl(210,100%,49%);
        }
        .heroSecondary:hover {
          background: rgba(255,255,255,0.075);
          border-color: rgba(255,255,255,0.18);
        }
        .heroBotStage {
          position: relative;
          height: clamp(520px, 52vw, 640px);
          min-width: 0;
          animation: heroBotIn 860ms ease-out 120ms both;
        }
        .michiBotCanvas {
          width: 100%;
          height: 100%;
          min-height: 520px;
        }
        .michiBotCanvas canvas {
          display: block;
          width: 100%;
          height: 100%;
        }
        @keyframes heroCopyIn {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroBotIn {
          from { opacity: 0; transform: translate3d(34px, 14px, 0) scale(0.96); }
          to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }
        .featureCard {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          padding: 28px 24px;
          cursor: default;
          transition:
            transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
            border-color 0.25s ease,
            box-shadow 0.25s ease,
            background 0.25s ease;
          position: relative;
          overflow: hidden;
        }
        .featureCard:hover {
          transform: translateY(-6px);
          border-color: rgba(99, 57, 255, 0.5);
          box-shadow:
            0 0 0 1px rgba(99, 57, 255, 0.2),
            0 8px 32px rgba(99, 57, 255, 0.15),
            0 2px 8px rgba(0, 0, 0, 0.4);
          background: rgba(255, 255, 255, 0.05);
        }
        .featureCard::after {
          content: '';
          position: absolute;
          top: -30%;
          left: -20%;
          width: 140%;
          height: 140%;
          background: radial-gradient(ellipse at 30% 30%, rgba(99, 57, 255, 0.08) 0%, transparent 65%);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
          z-index: 0;
        }
        .featureCard:hover::after {
          opacity: 1;
        }
        .featureCard > div {
          position: relative;
          z-index: 1;
        }
        .cardIcon {
          transition:
            transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
            filter 0.3s ease;
          display: inline-block;
        }
        .featureCard:hover .cardIcon {
          transform: scale(1.2) rotate(-5deg);
          filter: brightness(1.3);
        }
        .card-lightning:hover {
          border-color: rgba(56, 128, 255, 0.5);
          box-shadow: 0 0 0 1px rgba(56, 128, 255, 0.2), 0 8px 32px rgba(56, 128, 255, 0.15), 0 2px 8px rgba(0, 0, 0, 0.4);
        }
        .card-lightning::after { background: radial-gradient(ellipse at 30% 30%, rgba(56, 128, 255, 0.08) 0%, transparent 65%); }
        .card-warning:hover {
          border-color: rgba(220, 60, 60, 0.5);
          box-shadow: 0 0 0 1px rgba(220, 60, 60, 0.2), 0 8px 32px rgba(220, 60, 60, 0.15), 0 2px 8px rgba(0, 0, 0, 0.4);
        }
        .card-warning::after { background: radial-gradient(ellipse at 30% 30%, rgba(220, 60, 60, 0.08) 0%, transparent 65%); }
        .card-check:hover {
          border-color: rgba(40, 180, 100, 0.5);
          box-shadow: 0 0 0 1px rgba(40, 180, 100, 0.2), 0 8px 32px rgba(40, 180, 100, 0.15), 0 2px 8px rgba(0, 0, 0, 0.4);
        }
        .card-check::after { background: radial-gradient(ellipse at 30% 30%, rgba(40, 180, 100, 0.08) 0%, transparent 65%); }
        .card-doc:hover {
          border-color: rgba(220, 140, 40, 0.5);
          box-shadow: 0 0 0 1px rgba(220, 140, 40, 0.2), 0 8px 32px rgba(220, 140, 40, 0.15), 0 2px 8px rgba(0, 0, 0, 0.4);
        }
        .card-doc::after { background: radial-gradient(ellipse at 30% 30%, rgba(220, 140, 40, 0.08) 0%, transparent 65%); }
        .card-code:hover {
          border-color: rgba(140, 80, 255, 0.5);
          box-shadow: 0 0 0 1px rgba(140, 80, 255, 0.2), 0 8px 32px rgba(140, 80, 255, 0.15), 0 2px 8px rgba(0, 0, 0, 0.4);
        }
        .card-code::after { background: radial-gradient(ellipse at 30% 30%, rgba(140, 80, 255, 0.08) 0%, transparent 65%); }
        .card-lock:hover {
          border-color: rgba(56, 128, 255, 0.5);
          box-shadow: 0 0 0 1px rgba(56, 128, 255, 0.2), 0 8px 32px rgba(56, 128, 255, 0.15), 0 2px 8px rgba(0, 0, 0, 0.4);
        }
        .card-lock::after { background: radial-gradient(ellipse at 30% 30%, rgba(56, 128, 255, 0.08) 0%, transparent 65%); }
        @media (max-width: 980px) {
          .heroSection {
            grid-template-columns: 1fr;
            gap: 12px;
            min-height: auto;
            padding-top: 56px;
          }
          .heroCopy {
            max-width: 680px;
          }
          .heroBotStage {
            height: clamp(320px, 70vw, 430px);
            order: 2;
          }
          .michiBotCanvas {
            min-height: 320px;
          }
        }
        @media (max-width: 640px) {
          .heroSection {
            padding: 40px 18px 30px;
          }
          .heroTitle {
            font-size: clamp(42px, 14vw, 58px);
          }
          .heroText {
            margin-top: 22px;
          }
          .heroActions {
            align-items: stretch;
            flex-direction: column;
            margin-top: 28px;
          }
          .heroPrimary,
          .heroSecondary {
            justify-content: center;
            width: 100%;
          }
          .heroBotStage {
            height: 330px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .heroCopy,
          .heroBotStage {
            animation: none;
          }
        }
      `}} />
      <div className="homeWrapper flex flex-col">
        <section className="heroSection">
          <div className="heroCopy">
            <div className="heroBadge">
              <Shield className="w-4 h-4" />
              AI-Powered Code Security
            </div>

            <h1 className="heroTitle">
              Secure Your Code
              <span className="heroTitleAccent">Before Attackers Do</span>
            </h1>

            <p className="heroText">
              Our advanced AI instantly detects vulnerabilities like SQL injection
              and XSS, then turns risky code into clear fixes and security reports.
            </p>

            <div className="heroActions">
              <Link href="/scan" className="heroPrimary">
                <ScanLine className="w-4 h-4" />
                Start Code Analysis
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link href="/dashboard" className="heroSecondary">
                View Dashboard
              </Link>
            </div>
          </div>

          <div className="heroBotStage">
            <MichiBotHero />
          </div>
        </section>

        <section className="relative z-10 px-4 pb-24 max-w-6xl mx-auto w-full">
          <h2 className="text-center text-2xl font-bold mb-10">
            Everything you need for secure code
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc, color, hoverClass }) => (
              <div
                key={title}
                className={`featureCard ${hoverClass} group`}
              >
                <div
                  className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center"
                  style={{ background: `${color}18`, border: `1px solid ${color}30` }}
                >
                  <Icon className="w-5 h-5 cardIcon" style={{ color }} />
                </div>
                <h3 className="font-semibold mb-1.5">{title}</h3>
                <p className="text-sm text-[hsl(215,16%,55%)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
