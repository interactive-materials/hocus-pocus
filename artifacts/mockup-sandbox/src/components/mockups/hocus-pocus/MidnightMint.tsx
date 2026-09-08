import { EditorShell, type EditorTheme } from "./_EditorShell";

const midnightMintTheme: EditorTheme = {
  page: "#0b1421",
  header: "#101d2e",
  surface: "#14283b",
  surfaceRaised: "#192f45",
  text: "#e7f6f1",
  muted: "#a8c2c4",
  subtle: "#6f8e98",
  border: "rgba(148, 202, 205, .19)",
  accent: "#79e6c0",
  accentText: "#071b1c",
  secondary: "rgba(139, 127, 205, .13)",
  secondaryText: "#d3caf7",
  focus: "#b9f6e0",
  radius: "10px",
  shadow: "0 18px 42px rgba(1, 8, 17, .26)",
  font: '"DM Sans", sans-serif',
  headingFont: '"Fraunces", serif',
};

export function MidnightMint() {
  return (
    <EditorShell
      theme={midnightMintTheme}
      eyebrow="A quiet place to make strange things"
    />
  );
}