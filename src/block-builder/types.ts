// ─── Field Types ────────────────────────────────────────────────────────────

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "checkbox"
  | "select"
  | "radio"
  | "date"
  | "richText"
  | "upload"
  | "relationship"
  | "array"
  | "group"
  | "tabs"
  | "row"
  | "collapsible"
  | "json"
  | "code"
  | "point"
  | "ui";

export type ValidationRule = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
};

export type SelectOption = {
  label: string;
  value: string;
};

export type AdminConfig = {
  description?: string;
  placeholder?: string;
  readOnly?: boolean;
  hidden?: boolean;
  condition?: string;
};

// ─── Field Definition ────────────────────────────────────────────────────────

export type FieldDefinition = {
  id: string;
  type: FieldType;
  name: string;
  label?: string;
  required?: boolean;
  unique?: boolean;
  localized?: boolean;
  defaultValue?: string | number | boolean;
  validation?: ValidationRule;
  admin?: AdminConfig;
  options?: SelectOption[];
  relationTo?: string;
  hasMany?: boolean;
  maxDepth?: number;
  minRows?: number;
  maxRows?: number;
  fields?: FieldDefinition[];
};

// ─── Block Definition ────────────────────────────────────────────────────────

export type BlockDefinition = {
  id: string;
  slug: string;
  interfaceName?: string;
  labels?: {
    singular?: string;
    plural?: string;
  };
  imageURL?: string;
  imageAltText?: string;
  fields: FieldDefinition[];
};

// ─── Builder State ────────────────────────────────────────────────────────────

export type BuilderState = {
  blocks: BlockDefinition[];
  activeBlockId: string | null;
  activeFieldId: string | null;
  isDirty: boolean;
};

// ─── Code Generation ─────────────────────────────────────────────────────────

export type GeneratedOutput = {
  filename: string;
  code: string;
  language: "typescript" | "javascript";
};
