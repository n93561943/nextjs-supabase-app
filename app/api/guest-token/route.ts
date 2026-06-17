import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const existing = cookieStore.get("guest_token")?.value;

  if (existing) {
    return NextResponse.json({ guest_token: existing });
  }

  const token = crypto.randomUUID();
  const response = NextResponse.json({ guest_token: token });
  response.cookies.set("guest_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return response;
}
