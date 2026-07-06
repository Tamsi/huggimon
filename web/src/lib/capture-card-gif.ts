import { applyPalette, GIFEncoder, quantize } from "gifenc";
import { toPng } from "html-to-image";

const CARD_ASPECT = 921 / 660;
const EXPORT_WIDTH = 420;
const FRAME_COUNT = 36;
/** Delay per frame in centiseconds (10 ≈ 10 fps). */
const FRAME_DELAY_CS = 10;

async function loadRgba(dataUrl: string, w: number, h: number): Promise<Uint8ClampedArray> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h).data;
}

function dispatchPointer(rotator: HTMLElement, clientX: number, clientY: number) {
  const init: PointerEventInit = {
    bubbles: true,
    clientX,
    clientY,
    pointerId: 1,
    pointerType: "mouse",
    isPrimary: true,
  };
  rotator.dispatchEvent(new PointerEvent("pointerenter", init));
  rotator.dispatchEvent(new PointerEvent("pointermove", init));
}

/** Record holo / tilt motion on the live profile card into a GIF blob. */
export async function captureCardGif(cardRoot: HTMLElement): Promise<Blob> {
  const card = cardRoot.querySelector<HTMLElement>(".card.interactive");
  const rotator = cardRoot.querySelector<HTMLElement>(".card__rotator");
  if (!card || !rotator) {
    throw new Error("Card not ready — wait for the face image to load.");
  }

  const w = EXPORT_WIDTH;
  const h = Math.round(w * CARD_ASPECT);
  const frames: Uint8ClampedArray[] = [];

  for (let i = 0; i < FRAME_COUNT; i++) {
    const rect = rotator.getBoundingClientRect();
    const t = (i / FRAME_COUNT) * Math.PI * 2;
    const x = rect.left + rect.width / 2 + Math.cos(t) * rect.width * 0.38;
    const y = rect.top + rect.height / 2 + Math.sin(t) * rect.height * 0.32;

    dispatchPointer(rotator, x, y);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    await new Promise((r) => setTimeout(r, 55));

    const dataUrl = await toPng(card, {
      width: w,
      height: h,
      pixelRatio: 1,
      cacheBust: true,
    });
    frames.push(await loadRgba(dataUrl, w, h));
  }

  const gif = GIFEncoder();
  for (const rgba of frames) {
    const palette = quantize(rgba, 128);
    const index = applyPalette(rgba, palette);
    gif.writeFrame(index, w, h, { palette, delay: FRAME_DELAY_CS });
  }
  gif.finish();

  const bytes = gif.bytes();
  return new Blob([new Uint8Array(bytes)], { type: "image/gif" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
