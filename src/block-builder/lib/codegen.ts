import { Project, ScriptKind } from "ts-morph";
import type { BlockDefinition, FieldDefinition, GeneratedOutput } from "@/block-builder/types";

// ─── Field code generator ─────────────────────────────────────────────────

function fieldToObjectLiteral(field: FieldDefinition): string {
  const parts: string[] = [];

  parts.push(`name: '${field.name}'`);
  parts.push(`type: '${field.type}'`);

  if (field.label) parts.push(`label: '${field.label}'`);
  if (field.required) parts.push(`required: true`);
  if (field.unique) parts.push(`unique: true`);
  if (field.localized) parts.push(`localized: true`);

  if (field.defaultValue !== undefined) {
    const val =
      typeof field.defaultValue === "string"
        ? `'${field.defaultValue}'`
        : field.defaultValue;
    parts.push(`defaultValue: ${val}`);
  }

  if (field.type === "richText") {
    parts.push(`editor: lexicalEditor({})`);
  }

  if (field.options && field.options.length > 0) {
    const opts = field.options
      .map((o) => `{ label: '${o.label}', value: '${o.value}' }`)
      .join(", ");
    parts.push(`options: [${opts}]`);
  }

  if (field.relationTo) {
    parts.push(`relationTo: '${field.relationTo}'`);
  }

  if (field.hasMany !== undefined) {
    parts.push(`hasMany: ${field.hasMany}`);
  }

  if (field.minRows !== undefined) parts.push(`minRows: ${field.minRows}`);
  if (field.maxRows !== undefined) parts.push(`maxRows: ${field.maxRows}`);

  if (field.fields && field.fields.length > 0) {
    const nested = field.fields.map(fieldToObjectLiteral).join(",\n    ");
    parts.push(`fields: [\n    ${nested}\n  ]`);
  }

  const adminParts: string[] = [];
  if (field.admin?.description)
    adminParts.push(`description: '${field.admin.description}'`);
  if (field.admin?.placeholder)
    adminParts.push(`placeholder: '${field.admin.placeholder}'`);
  if (field.admin?.readOnly) adminParts.push(`readOnly: true`);
  if (field.admin?.hidden) adminParts.push(`hidden: true`);

  if (adminParts.length > 0) {
    parts.push(`admin: { ${adminParts.join(", ")} }`);
  }

  return `{\n  ${parts.join(",\n  ")}\n}`;
}

// ─── Block code generator ─────────────────────────────────────────────────

function generateBlockCode(block: BlockDefinition): string {
  const hasRichText = block.fields.some((f) => f.type === "richText");

  const imports: string[] = [`import type { Block } from 'payload'`];
  if (hasRichText) {
    imports.push(`import { lexicalEditor } from '@payloadcms/richtext-lexical'`);
  }

  const fieldsCode = block.fields
    .map((f) => `  ${fieldToObjectLiteral(f)}`)
    .join(",\n");

  const labelsCode = block.labels
    ? `\n  labels: {\n    singular: '${block.labels.singular ?? block.slug}',\n    plural: '${block.labels.plural ?? block.slug + "s"}',\n  },`
    : "";

  const interfaceLine = block.interfaceName
    ? `\n  interfaceName: '${block.interfaceName}',`
    : "";

  return `${imports.join("\n")}

export const ${block.interfaceName ?? block.slug}: Block = {
  slug: '${block.slug}',${interfaceLine}${labelsCode}
  fields: [
${fieldsCode}
  ],
}
`;
}

// ─── Main export ──────────────────────────────────────────────────────────

export async function generateBlockOutput(
  block: BlockDefinition
): Promise<GeneratedOutput> {
  const raw = generateBlockCode(block);

  const project = new Project({ useInMemoryFileSystem: true });
  const filename = `${block.slug}.ts`;

  try {
    const sourceFile = project.createSourceFile(filename, raw, {
      scriptKind: ScriptKind.TS,
    });
    const formatted = sourceFile.getFullText();
    return { filename, code: formatted, language: "typescript" };
  } catch {
    return { filename, code: raw, language: "typescript" };
  }
}

export async function generateAllBlocks(
  blocks: BlockDefinition[]
): Promise<GeneratedOutput[]> {
  return Promise.all(blocks.map(generateBlockOutput));
}

export function generateIndexFile(blocks: BlockDefinition[]): GeneratedOutput {
  const imports = blocks
    .map((b) => `import { ${b.interfaceName ?? b.slug} } from './${b.slug}'`)
    .join("\n");

  const exports = `\nexport const blocks = [\n  ${blocks
    .map((b) => b.interfaceName ?? b.slug)
    .join(",\n  ")}\n] as const\n`;

  return {
    filename: "index.ts",
    code: imports + exports,
    language: "typescript",
  };
}
