import { EditorShell, type EditorTheme } from "./_EditorShell";

const plumPorcelainTheme: EditorTheme = {
  page: "#2a1729",
  header: "#1d1020",
  surface: "#3b2539",
  surfaceRaised: "#482c42",
  text: "#f8efe7",
  muted: "rgba(248,239,231,.72)",
  subtle: "rgba(248,239,231,.48)",
  border: "rgba(246,220,212,.24)",
  accent: "#d98278",
  accentText: "#2a1729",
  secondary: "rgba(242,233,223,.08)",
  secondaryText: "#f6e8de",
  focus: "#efb5a5",
  radius: "10px",
  shadow: "0 18px 42px rgba(10, 4, 15, .22)",
  font: '"DM Sans", sans-serif',
  headingFont: '"Fraunces", serif',
};

export function PlumPorcelain() {
  return <EditorShell theme={plumPorcelainTheme} eyebrow="A quiet corner for bright ideas" />;
}