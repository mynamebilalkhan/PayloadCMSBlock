import { BuilderShell } from "@/block-builder/components/canvas/BuilderShell";

export default async function BlockBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ load?: string }>;
}) {
  const { load } = await searchParams;
  return <BuilderShell loadSlug={load} />;
}
