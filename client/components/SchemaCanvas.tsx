'use client';

import { ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface SchemaCanvasProps {
  className?: string;
}

export default function SchemaCanvas({ className = 'h-[800px] w-full border border-slate-200 rounded-lg' }: SchemaCanvasProps) {
  return (
    <div className={className}>
      <ReactFlow
        nodes={[]}
        edges={[]}
      />
    </div>
  );
}
