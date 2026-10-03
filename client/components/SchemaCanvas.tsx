'use client';

import React, { useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDatabase, faDiagramProject, faCompress } from '@fortawesome/free-solid-svg-icons';
import { TableNode } from './canvas/TableNode';
import { DatabaseSchema, SchemaTable, SchemaRelation } from '@/types/schema';

interface SchemaCanvasProps {
  className?: string;
  schema?: DatabaseSchema;
  initialTables?: SchemaTable[];
  initialRelations?: SchemaRelation[];
  onSchemaChange?: (schema: DatabaseSchema) => void;
}

export type TableNodeType = Node<SchemaTable, 'table'>;

const nodeTypes = {
  table: TableNode,
};

function convertSchemaToFlow(tables: SchemaTable[], relations: SchemaRelation[]) {
  const nodes: TableNodeType[] = tables.map((tbl, index) => {
    // Default grid positioning if not provided or mapped from backend
    const defaultX = 50 + (index % 3) * 360;
    const defaultY = 60 + Math.floor(index / 3) * 340;
    const posX = tbl.position?.x ?? (typeof tbl.positionX === 'number' ? tbl.positionX : defaultX);
    const posY = tbl.position?.y ?? (typeof tbl.positionY === 'number' ? tbl.positionY : defaultY);

    const columns = Array.isArray(tbl.columns)
      ? tbl.columns
      : typeof tbl.columns === 'string'
        ? JSON.parse(tbl.columns)
        : [];

    return {
      id: tbl.name,
      type: 'table',
      position: { x: posX, y: posY },
      data: {
        ...tbl,
        columns,
      },
    };
  });

  const edges: Edge[] = relations.map((rel) => ({
    id: rel.id || `rel-${rel.sourceTable}-${rel.sourceColumn}-${rel.targetTable}-${rel.targetColumn}`,
    source: rel.sourceTable,
    target: rel.targetTable,
    sourceHandle: `${rel.sourceColumn}-source`,
    targetHandle: `${rel.targetColumn}-target`,
    type: 'smoothstep',
    animated: false,
    label: rel.label || (rel.cardinality === 'one-to-many' ? '1:N' : rel.cardinality === 'many-to-many' ? 'M:N' : '1:1'),
    labelStyle: {
      fontSize: 10,
      fontFamily: 'monospace',
      fontWeight: 600,
      fill: '#065f46',
    },
    labelBgPadding: [6, 2] as [number, number],
    labelBgBorderRadius: 4,
    labelBgStyle: {
      fill: '#ecfdf5',
      stroke: '#a7f3d0',
      strokeWidth: 1,
    },
    style: {
      stroke: '#059669',
      strokeWidth: 1.8,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 14,
      height: 14,
      color: '#059669',
    },
  }));

  return { nodes, edges };
}

export default function SchemaCanvas({
  className = 'h-[800px] w-full border border-slate-200 rounded-lg',
  schema,
  initialTables,
  initialRelations,
}: SchemaCanvasProps) {
  // Determine effective schema sources
  const activeTables = useMemo(() => {
    if (schema?.tables) return schema.tables;
    if (initialTables) return initialTables;
    return [];
  }, [schema, initialTables]);

  const activeRelations = useMemo(() => {
    if (schema?.relations) return schema.relations;
    if (initialRelations) return initialRelations;
    return [];
  }, [schema, initialRelations]);

  const initialFlow = useMemo(
    () => convertSchemaToFlow(activeTables, activeRelations),
    [activeTables, activeRelations]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlow.edges);

  // Sync state whenever parent props change
  useEffect(() => {
    const updated = convertSchemaToFlow(activeTables, activeRelations);
    setNodes(updated.nodes);
    setEdges(updated.edges);
  }, [activeTables, activeRelations, setNodes, setEdges]);

  // Support interactive dragging of connections between table handles
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'smoothstep',
            style: { stroke: '#059669', strokeWidth: 1.8 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 14,
              height: 14,
              color: '#059669',
            },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  return (
    <div className={className}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.8}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#cbd5e1" />
        <Controls
          className="!bg-white !border !border-slate-200 !shadow-sm !rounded-lg overflow-hidden [&>button]:!border-b [&>button]:!border-slate-100"
          showInteractive={false}
        />
        <MiniMap
          nodeColor="#e2e8f0"
          maskColor="rgba(241, 245, 249, 0.7)"
          className="!border !border-slate-200 !rounded-lg !bg-white/90 !shadow-sm"
          zoomable
          pannable
        />

        {/* Top Info Bar */}
        <Panel position="top-right" className="flex items-center gap-2">
          <div className="bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg px-3 py-1.5 shadow-xs flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-700 font-medium">
              <FontAwesomeIcon icon={faDatabase} className="text-emerald-600 text-[11px]" />
              {nodes.length} {nodes.length === 1 ? 'Table' : 'Tables'}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="flex items-center gap-1.5 text-slate-700 font-medium">
              <FontAwesomeIcon icon={faDiagramProject} className="text-emerald-600 text-[11px]" />
              {edges.length} {edges.length === 1 ? 'Relation' : 'Relations'}
            </span>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
