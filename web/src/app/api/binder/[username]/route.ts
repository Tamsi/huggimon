import { NextResponse } from "next/server";
import { fetchBinderPage } from "@/lib/binder-fetcher";

type Props = { params: Promise<{ username: string }> };

export async function GET(req: Request, { params }: Props) {
  const { username } = await params;
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? "0");

  try {
    const data = await fetchBinderPage(username, Number.isFinite(page) ? page : 0);
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Binder fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
