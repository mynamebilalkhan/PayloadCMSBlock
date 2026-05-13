import type { BlockDefinition } from "@/block-builder/types";
import type { SaveSchemaRequest } from "@/builder/types";

const TYPE_MAP: Record<string, string> = {
  richText: "richtext",
  upload: "image",
  radio: "select",
};

const UNSUPPORTED = new Set(["code", "point", "ui", "tabs", "collapsible"]);

export function mapToSaveRequest(block: BlockDefinition): SaveSchemaRequest {
  const fields = block.fields
    .filter((f) => {
      if (UNSUPPORTED.has(f.type)) {
        console.warn(`[block-builder] Field type "${f.type}" is not supported in this project — skipping field "${f.name}"`);
        return false;
      }
      return true;
    })
    .map(({ id: _id, ...f }) => ({
      ...f,
      type: TYPE_MAP[f.type] ?? f.type,
    }));

  return {
    blockSlug: block.slug,
    name: block.labels?.singular ?? block.slug,
    schema: { fields },
    changelog: "Created via block builder",
  };
}
