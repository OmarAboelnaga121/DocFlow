/**
 * Database schema typing definitions for DocFlow ERD canvas.
 * Designed to support relational database models (PostgreSQL, MySQL, SQLite, Prisma).
 */

export type ColumnDataType =
  | "String"
  | "Int"
  | "BigInt"
  | "Float"
  | "Decimal"
  | "Boolean"
  | "DateTime"
  | "Date"
  | "Json"
  | "Uuid"
  | "Enum"
  | "Bytes"
  | string;

export interface ColumnReference {
  targetTable: string;
  targetColumn: string;
}

export interface SchemaColumn {
  name: string;
  type: ColumnDataType;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
  defaultValue?: string | number | boolean | null;
  references?: ColumnReference;
}

export interface SchemaTable extends Record<string, unknown> {
  id: string;
  name: string;
  columns: SchemaColumn[];
  description?: string | null;
  position?: { x: number; y: number };
  positionX?: number | null;
  positionY?: number | null;
}

export type RelationCardinality = "one-to-one" | "one-to-many" | "many-to-many";

export interface SchemaRelation {
  id: string;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  cardinality?: RelationCardinality | string | null;
  label?: string | null;
}

export interface DatabaseSchema {
  id?: string;
  repoId?: string;
  tables: SchemaTable[];
  relations: SchemaRelation[];
  metadata?: any;
}
