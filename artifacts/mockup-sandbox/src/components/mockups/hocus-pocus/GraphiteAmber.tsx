import { EditorShell, type EditorTheme } from "./_EditorShell";

const graphiteAmberTheme: EditorTheme = {
  page: "#202326",
  header: "#17191b",
  surface: "#292d30",
  surfaceRaised: "#25292c",
  text: "#f3efe6",
  muted: "#a9ada8",
  subtle: "#737a78",
  border: "#41484a",
  accent: "#d8993e",
  accentText: "#211a10",
  secondary: "#252a2c",
  secondaryText: "#d8ddd8",
  focus: "#4fb9ae",
  radius: "7px",
  shadow: "0 14px 34px rgba(7, 9, 10, .28)",
  font: '"IBM Plex Sans", sans-serif',
  headingFont: '"DM Sans", sans-serif',
};

export function GraphiteAmber() {
  return <EditorShell theme={graphiteAmberTheme} eyebrow="Hocus Pocus / effect studio" />;
}