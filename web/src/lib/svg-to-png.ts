import path from "node:path";
import { Resvg } from "@resvg/resvg-js";

/** Matches Noto Sans TTF family names for resvg font matching. */
export const FACE_FONT_FAMILY = "Noto Sans";

export const FACE_FONT_ATTR = `font-family="${FACE_FONT_FAMILY}, sans-serif"`;

const WEIGHT_FILES = [
  "NotoSans-Regular.ttf",
  "NotoSans-Bold.ttf",
  "NotoSans-Black.ttf",
] as const;

function fontDir(): string {
  return path.join(process.cwd(), "assets", "fonts");
}

let fontFilePaths: string[] | null = null;

function getFontFilePaths(): string[] {
  if (fontFilePaths) return fontFilePaths;
  const dir = fontDir();
  fontFilePaths = WEIGHT_FILES.map((file) => path.join(dir, file));
  return fontFilePaths;
}

/** Rasterize SVG to PNG — resvg renders text reliably on Linux (Vercel). */
export function rasterizeSvgToPng(svg: string): Buffer {
  const resvg = new Resvg(svg, {
    font: {
      fontFiles: getFontFilePaths(),
      loadSystemFonts: false,
      defaultFontFamily: FACE_FONT_FAMILY,
    },
  });
  return Buffer.from(resvg.render().asPng());
}

/** @deprecated librsvg via sharp ignores text on Vercel; kept for empty SVG defs. */
export function svgEmbeddedFontDefs(): string {
  return "";
}
