import type { CSSProperties, ReactNode } from "react";
import { BookOpen, History, Settings, Sparkles, WandSparkles } from "lucide-react";

export type EditorTheme = {
  page: string;
  header: string;
  surface: string;
  surfaceRaised: string;
  text: string;
  muted: string;
  subtle: string;
  border: string;
  accent: string;
  accentText: string;
  secondary: string;
  secondaryText: string;
  focus: string;
  radius: string;
  shadow: string;
  font: string;
  headingFont: string;
};

type EditorShellProps = {
  theme: EditorTheme;
  eyebrow?: string;
  children?: ReactNode;
};

function IconLabel({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className="hp-icon-label">
      {icon}
      {children}
    </span>
  );
}

export function EditorShell({ theme, eyebrow, children }: EditorShellProps) {
  const variables = {
    "--hp-page": theme.page,
    "--hp-header": theme.header,
    "--hp-surface": theme.surface,
    "--hp-raised": theme.surfaceRaised,
    "--hp-text": theme.text,
    "--hp-muted": theme.muted,
    "--hp-subtle": theme.subtle,
    "--hp-border": theme.border,
    "--hp-accent": theme.accent,
    "--hp-accent-text": theme.accentText,
    "--hp-secondary": theme.secondary,
    "--hp-secondary-text": theme.secondaryText,
    "--hp-focus": theme.focus,
    "--hp-radius": theme.radius,
    "--hp-shadow": theme.shadow,
    "--hp-font": theme.font,
    "--hp-heading": theme.headingFont,
  } as CSSProperties;

  return (
    <main className="hp-app" style={variables}>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Domine:wght@500;600&family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&display=swap");
        * { box-sizing: border-box; }
        .hp-app {
          width: 100%;
          min-height: 100vh;
          overflow: hidden;
          color: var(--hp-text);
          background: var(--hp-page);
          font-family: var(--hp-font);
          -webkit-font-smoothing: antialiased;
        }
        .hp-header {
          position: relative;
          height: 96px;
          width: 100%;
          background: var(--hp-header);
          border-bottom: 1px solid var(--hp-border);
        }
        .hp-options {
          position: absolute;
          right: 32px;
          bottom: 18px;
          display: flex;
          gap: 24px;
          color: var(--hp-muted);
          font-size: 15px;
          font-weight: 500;
        }
        .hp-icon-label { display: inline-flex; align-items: center; gap: 7px; }
        .hp-icon-label svg { width: 17px; height: 17px; stroke-width: 1.8; }
        .hp-tabs {
          position: absolute;
          left: 16px;
          bottom: 0;
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }
        .hp-tab {
          min-width: 118px;
          padding: 12px 18px 13px;
          border: 1px solid var(--hp-border);
          border-bottom: 0;
          border-radius: var(--hp-radius) var(--hp-radius) 0 0;
          color: var(--hp-muted);
          background: color-mix(in srgb, var(--hp-header) 75%, var(--hp-surface));
          font-size: 15px;
          font-weight: 500;
          letter-spacing: .01em;
        }
        .hp-tab-active {
          color: var(--hp-accent-text);
          background: var(--hp-accent);
          border-color: transparent;
          font-weight: 650;
        }
        .hp-body {
          position: relative;
          height: calc(100vh - 96px);
          min-height: 600px;
          background: var(--hp-page);
        }
        .hp-workspace {
          width: 50%;
          padding: 56px 42px;
        }
        .hp-panel {
          width: 100%;
          max-width: 620px;
        }
        .hp-eyebrow {
          margin: 0 0 12px;
          color: var(--hp-accent);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .13em;
          text-transform: uppercase;
        }
        .hp-title {
          margin: 0;
          color: var(--hp-text);
          font-family: var(--hp-heading);
          font-size: 25px;
          font-weight: 600;
          line-height: 1.25;
          letter-spacing: -.02em;
        }
        .hp-subtitle {
          margin: 9px 0 0;
          color: var(--hp-muted);
          font-size: 15px;
          line-height: 1.55;
        }
        .hp-textarea {
          width: 100%;
          min-height: 220px;
          margin-top: 28px;
          padding: 18px 19px;
          resize: none;
          border: 1px solid var(--hp-border);
          border-radius: var(--hp-radius);
          outline: 0;
          color: var(--hp-text);
          background: var(--hp-surface);
          box-shadow: var(--hp-shadow);
          font: 400 16px/1.6 var(--hp-font);
        }
        .hp-textarea::placeholder { color: var(--hp-subtle); opacity: 1; }
        .hp-textarea:focus {
          border-color: var(--hp-focus);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--hp-focus) 24%, transparent);
        }
        .hp-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 18px;
        }
        .hp-primary, .hp-spellbook {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border-radius: var(--hp-radius);
          font-family: var(--hp-font);
          font-size: 15px;
          font-weight: 650;
        }
        .hp-primary {
          min-height: 48px;
          padding: 0 20px;
          border: 1px solid transparent;
          color: var(--hp-accent-text);
          background: var(--hp-accent);
          box-shadow: var(--hp-shadow);
        }
        .hp-primary svg, .hp-spellbook svg { width: 18px; height: 18px; }
        .hp-spellbook {
          position: absolute;
          left: 32px;
          bottom: 32px;
          min-height: 46px;
          padding: 0 18px;
          border: 1px solid var(--hp-border);
          color: var(--hp-secondary-text);
          background: var(--hp-secondary);
        }
        .hp-note {
          position: absolute;
          right: 42px;
          top: 56px;
          width: calc(50% - 84px);
          min-height: 300px;
          padding: 28px;
          border: 1px solid var(--hp-border);
          border-radius: var(--hp-radius);
          color: var(--hp-muted);
          background: var(--hp-raised);
          box-shadow: var(--hp-shadow);
        }
        .hp-note-label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 18px;
          color: var(--hp-text);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .hp-note-label svg { width: 17px; height: 17px; color: var(--hp-accent); }
        .hp-note-line {
          height: 10px;
          margin-bottom: 13px;
          border-radius: 99px;
          background: color-mix(in srgb, var(--hp-muted) 20%, transparent);
        }
        .hp-note-line:nth-child(2) { width: 88%; }
        .hp-note-line:nth-child(3) { width: 72%; }
        .hp-note-line:nth-child(4) { width: 80%; }
        .hp-note-line:nth-child(5) { width: 54%; }
        .hp-note-caption {
          margin-top: 26px;
          color: var(--hp-subtle);
          font-size: 13px;
          line-height: 1.5;
        }
        @media (max-width: 800px) {
          .hp-header { height: 128px; }
          .hp-options { top: 16px; bottom: auto; left: 16px; right: auto; }
          .hp-tabs { left: 8px; right: 8px; }
          .hp-tab { min-width: 0; flex: 1; padding: 11px 10px; text-align: center; }
          .hp-body { height: calc(100vh - 128px); }
          .hp-workspace { width: 100%; padding: 30px 24px 120px; }
          .hp-note { display: none; }
          .hp-spellbook { left: 24px; bottom: 24px; }
        }
      `}</style>

      <header className="hp-header">
        <nav className="hp-options" aria-label="Application options">
          <IconLabel icon={<Settings />}>Settings</IconLabel>
          <IconLabel icon={<History />}>History</IconLabel>
        </nav>
        <nav className="hp-tabs" aria-label="Effect creation steps">
          <div className="hp-tab hp-tab-active">1. Idea</div>
          <div className="hp-tab">2. Instructions</div>
          <div className="hp-tab">3. Effect</div>
        </nav>
      </header>

      <section className="hp-body">
        <div className="hp-workspace">
          <div className="hp-panel">
            {eyebrow ? <p className="hp-eyebrow">{eyebrow}</p> : null}
            <h1 className="hp-title">Describe the effect you are thinking of ✨</h1>
            <p className="hp-subtitle">
              We will use this to generate step-by-step instructions
            </p>
            <textarea
              className="hp-textarea"
              aria-label="Effect idea"
              placeholder={'Use your own words to describe the effect you want to create, like "fireworks that sparkle like stars". Be as descriptive as you want.'}
            />
            <div className="hp-actions">
              <button className="hp-primary">
                <Sparkles />
                Generate Instructions
              </button>
            </div>
            {children}
          </div>
        </div>

        <aside className="hp-note" aria-label="Generated instruction preview">
          <div className="hp-note-label">
            <WandSparkles />
            Your effect journey
          </div>
          <div className="hp-note-line" />
          <div className="hp-note-line" />
          <div className="hp-note-line" />
          <div className="hp-note-line" />
          <p className="hp-note-caption">
            The right panel mirrors the app’s existing two-column effect workspace
            so hierarchy and contrast can be compared without changing the layout.
          </p>
        </aside>

        <button className="hp-spellbook">
          <BookOpen />
          Spellbook
        </button>
      </section>
    </main>
  );
}