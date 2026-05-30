import { NextResponse } from "next/server";
import { pcBuilderCatalog } from "@/lib/pc-builder";

export async function GET() {
  return NextResponse.json({
    categories: pcBuilderCatalog,
  });
}
