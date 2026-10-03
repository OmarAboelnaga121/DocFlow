'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDatabase, faKey, faLink } from '@fortawesome/free-solid-svg-icons';
import { SchemaColumn, SchemaTable } from '@/types/schema';

export interface TableNodeData extends SchemaTable {
  isSelected?: boolean;
}

function getTypeColor(type: string): string {
  const normalized = type.toLowerCase();
  if (normalized.includes('int') || normalized.includes('float') || normalized.includes('decimal') || normalized.includes('number')) {
    return 'text-indigo-600 bg-indigo-50 border-indigo-200';
  }
  if (normalized.includes('bool')) {
    return 'text-amber-700 bg-amber-50 border-amber-200';
  }
  if (normalized.includes('date') || normalized.includes('time')) {
    return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  }
  if (normalized.includes('json') || normalized.includes('bytes')) {
    return 'text-teal-700 bg-teal-50 border-teal-200';
  }
  if (normalized.includes('uuid') || normalized.includes('cuid')) {
    return 'text-purple-700 bg-purple-50 border-purple-200';
  }
  return 'text-slate-600 bg-slate-100 border-slate-200';
}

function TableNodeComponent({ data, selected }: NodeProps) {
  const tableData = data as unknown as TableNodeData;
  const { name, columns = [], description } = tableData;

  return (
    <div
      className={`min-w-[280px] max-w-[360px] rounded-xl border bg-white shadow-sm transition-all duration-150 select-none overflow-hidden ${
        selected
          ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Table-level Target & Source fallback handles */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${name}-table-target`}
        className="!w-2 !h-2 !bg-slate-400 !border-2 !border-white !rounded-full opacity-0 hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Right}
        id={`${name}-table-source`}
        className="!w-2 !h-2 !bg-emerald-500 !border-2 !border-white !rounded-full opacity-0 hover:opacity-100 transition-opacity"
      />

      {/* Header Accent Bar */}
      <div className="h-1 w-full bg-emerald-600" />

      {/* Table Header */}
      <div className="px-3.5 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-6 h-6 rounded-md bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faDatabase} className="text-xs" />
          </span>
          <div className="min-w-0">
            <h3 className="text-xs font-semibold text-slate-900 tracking-tight font-mono truncate">
              {name}
            </h3>
            {description && (
              <p className="text-[10px] text-slate-500 truncate" title={description}>
                {description}
              </p>
            )}
          </div>
        </div>

        <span className="text-[10px] font-medium text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded-full shrink-0">
          {columns.length} {columns.length === 1 ? 'col' : 'cols'}
        </span>
      </div>

      {/* Columns List */}
      <div className="divide-y divide-slate-100/80 text-xs">
        {columns.map((col: SchemaColumn) => {
          const typeColorClass = getTypeColor(col.type);

          return (
            <div
              key={col.name}
              className="relative px-3.5 py-2 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors group"
            >
              {/* Field-level connection handles */}
              <Handle
                type="target"
                position={Position.Left}
                id={`${col.name}-target`}
                className="!w-2 !h-2 !-left-1 !bg-slate-400 !border-2 !border-white !rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <Handle
                type="source"
                position={Position.Right}
                id={`${col.name}-source`}
                className="!w-2 !h-2 !-right-1 !bg-emerald-500 !border-2 !border-white !rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              />

              {/* Left Side: Key indicator & Field name */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {col.isPrimaryKey ? (
                  <span
                    title="Primary Key"
                    className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/70 border border-amber-300/80 px-1 rounded shrink-0"
                  >
                    <FontAwesomeIcon icon={faKey} className="text-[8px]" />
                    PK
                  </span>
                ) : col.isForeignKey ? (
                  <span
                    title={
                      col.references
                        ? `Foreign Key -> ${col.references.targetTable}.${col.references.targetColumn}`
                        : 'Foreign Key'
                    }
                    className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-700 bg-sky-100/70 border border-sky-300/80 px-1 rounded shrink-0"
                  >
                    <FontAwesomeIcon icon={faLink} className="text-[8px]" />
                    FK
                  </span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 ml-1 mr-0.5" />
                )}

                <span
                  className={`font-mono text-[11px] truncate ${
                    col.isPrimaryKey
                      ? 'font-semibold text-slate-900'
                      : 'text-slate-800'
                  }`}
                  title={col.name}
                >
                  {col.name}
                </span>

                {col.isNullable && (
                  <span
                    title="Nullable field"
                    className="text-[10px] font-mono text-slate-400 select-none"
                  >
                    ?
                  </span>
                )}
              </div>

              {/* Right Side: Data type tag & Default/Constraint */}
              <div className="flex items-center gap-1.5 shrink-0">
                {col.isUnique && (
                  <span
                    title="Unique constraint"
                    className="text-[9px] font-mono uppercase text-slate-500 bg-slate-100 border border-slate-200 px-1 rounded"
                  >
                    UQ
                  </span>
                )}
                <span
                  className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border ${typeColorClass}`}
                >
                  {col.type}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const TableNode = memo(TableNodeComponent);
