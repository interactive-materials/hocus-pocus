import { EditorShell, type EditorTheme } from "./_EditorShell";

const currentTheme: EditorTheme = {
  page: "#491898",
  header: "#1d0a3d",
  surface: "#582aa0",
  surfaceRaised: "#6b45a9",
  text: "#ffffff",
  muted: "rgba(255,255,255,.78)",
  subtle: "rgba(255,255,255,.5)",
  border: "rgba(255,255,255,.16)",
  accent: "#e05263",
  accentText: "#ffffff",
  secondary: "transparent",
  secondaryText: "#ffffff",
  focus: "#0ff4c6",
  radius: "16px",
  shadow: "none",
  font: '"Barlow", sans-serif',
  headingFont: '"Barlow", sans-serif',
};

export function Current() {
  return <EditorShell theme={currentTheme} />;
}