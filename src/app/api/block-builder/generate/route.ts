import { NextRequest, NextResponse } from "next/server";
import { generateAllBlocks, generateIndexFile } from "@/block-builder/lib/codegen";
import type { BlockDefinition } from "@/block-builder/types";

export async function POST(req: NextRequest) {
  try {
    const { blocks }: { blocks: BlockDefinition[] } = await req.json();

    if (!blocks || !Array.isArray(blocks)) {
      return NextResponse.json({ error: "blocks array required" }, { status: 400 });
    }

    const [blockFiles, indexFile] = await Promise.all([
      generateAllBlocks(blocks),
      Promise.resolve(generateIndexFile(blocks)),
    ]);

    return NextResponse.json({ files: [...blockFiles, indexFile] });
  } catch (err) {
    console.error("[block-builder/generate] error:", err);
    return NextResponse.json({ error: "Code generation failed" }, { status: 500 });
  }
}
