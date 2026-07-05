import fs from "node:fs";
import path from "node:path";

/** Embedded in SVG overlays — must ship with serverless bundles (see next.config.ts). */
export const FACE_FONT_FAMILY = "HuggiMon Face";

const WEIGHT_FILES: Record<400 | 700 | 900, string> = {
  400: "NotoSans-Regular.ttf",
  700: "NotoSans-Bold.ttf",
  900: "NotoSans-Black.ttf",
};

let cachedDefs: string | null = null;

function fontDir(): string {
  return path.join(process.cwd(), "assets", "fonts");
}

function fontDataUri(weight: 400 | 700 | 900): string {
  const file = path.join(fontDir(), WEIGHT_FILES[weight]);
  const base64 = fs.readFileSync(file).toString("base64");
  return `data:font/ttf;base64,${base64}`;
}

/** Inline @font-face rules so librsvg can render text on Linux (Vercel). */
export function svgEmbeddedFontDefs(): string {
  if (cachedDefs) return cachedDefs;

  if (!fs.existsSync(path.join(fontDir(), WEIGHT_FILES[400]))) {
    throw new Error(`Card fonts missing at ${fontDir()} — run from web/ root`);
  }

  const regular = fontDataUri(400);
  const bold = fontDataUri(700);
  const black = fontDataUri(900);

  cachedDefs = `<style type="text/css"><![CDATA[
@font-face{font-family:'${FACE_FONT_FAMILY}';font-style:normal;font-weight:400;font-display:swap;src:url('${regular}') format('truetype');}
@font-face{font-family:'${FACE_FONT_FAMILY}';font-style:normal;font-weight:700;font-display:swap;src:url('${bold}') format('truetype');}
@font-face{font-family:'${FACE_FONT_FAMILY}';font-style:normal;font-weight:900;font-display:swap;src:url('${black}') format('truetype');}
]]></style>`;

  return cachedDefs;
}

export const FACE_FONT_ATTR = `font-family="${FACE_FONT_FAMILY}, sans-serif"`;
