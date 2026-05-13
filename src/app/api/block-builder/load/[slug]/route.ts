import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { schemaToBuilderBlock } from "@/block-builder/lib/schemaToBuilderBlock";
import type { RawFieldInput } from "@/builder/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const payload = await getPayload({ config });

  // Accept session cookie (same-origin from /block-builder) or Bearer token
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find the block definition by slug
  const result = await payload.find({
    collection: "block-definitions",
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2, // resolve currentVersion relationship
  });

  if (result.docs.length === 0) {
    return NextResponse.json({ error: `Block "${slug}" not found` }, { status: 404 });
  }

  const definition = result.docs[0] as unknown as Record<string, unknown>;
  const currentVersion = definition.currentVersion as Record<string, unknown> | null;

  if (!currentVersion) {
    return NextResponse.json({ error: `Block "${slug}" has no published version` }, { status: 404 });
  }

  const schema = currentVersion.schema as { fields?: RawFieldInput[] } | null;
  const fields: RawFieldInput[] = schema?.fields ?? [];

  const block = schemaToBuilderBlock(
    slug,
    String(definition.name ?? slug),
    {
      singular: String(definition.name ?? slug),
      plural: `${String(definition.name ?? slug)}s`,
    },
    fields
  );

  return NextResponse.json({ block });
}
