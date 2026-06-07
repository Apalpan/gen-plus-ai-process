import type { ProcessMap, ProcessNodeData } from '../types/process';

function shapeFor(node: ProcessNodeData, label: string): string {
  switch (node.type) {
    case 'start':
    case 'end':
      return `([${label}])`;
    case 'decision':
    case 'approval':
      return `{${label}}`;
    case 'document':
    case 'evidence':
      return `[/${label}/]`;
    case 'system':
    case 'automation':
      return `[[${label}]]`;
    case 'metric':
      return `>(${label})]`;
    case 'risk':
      return `[/${label}\\]`;
    default:
      return `[${label}]`;
  }
}

function clean(s: string): string {
  return s.replace(/"/g, "'").replace(/[\n\r]+/g, ' ').replace(/[\[\]{}()|]/g, '').trim();
}

export function toMermaid(process: ProcessMap): string {
  const lines: string[] = ['flowchart LR'];
  const nodeId = (id: string) => id.replace(/[^a-zA-Z0-9_]/g, '_');

  // group by lanes as subgraphs
  process.lanes.forEach((lane) => {
    const laneNodes = process.nodes.filter((n) => n.laneId === lane.id);
    if (laneNodes.length === 0) return;
    lines.push(`  subgraph ${nodeId(lane.id)}["${clean(lane.name)}"]`);
    lines.push('    direction LR');
    laneNodes.forEach((n) => {
      const label = clean(n.code ? `${n.code} · ${n.title}` : n.title);
      lines.push(`    ${nodeId(n.id)}${shapeFor(n, label)}`);
    });
    lines.push('  end');
  });

  lines.push('');
  process.edges.forEach((e) => {
    const label = e.label ?? (e.type === 'decision_yes' ? 'Sí' : e.type === 'decision_no' ? 'No' : '');
    const arrow = e.type === 'dependency' || e.type === 'feedback' || e.type === 'metric_impact' ? '-.->' : '-->';
    const lbl = label ? `|${clean(label)}|` : '';
    lines.push(`  ${nodeId(e.source)} ${arrow}${lbl} ${nodeId(e.target)}`);
  });

  // styling
  lines.push('');
  lines.push('  classDef startend fill:#1E5CE8,stroke:#4D84FF,color:#fff;');
  lines.push('  classDef decision fill:#F5A623,stroke:#fbbf24,color:#1a1300;');
  lines.push('  classDef doc fill:#0e7490,stroke:#22D3EE,color:#E9F0FF;');
  lines.push('  classDef auto fill:#6d28d9,stroke:#8B5CF6,color:#fff;');
  lines.push('  classDef risk fill:#7f1d1d,stroke:#F87171,color:#fff;');

  process.nodes.forEach((n) => {
    const cls =
      n.type === 'start' || n.type === 'end'
        ? 'startend'
        : n.type === 'decision' || n.type === 'approval'
        ? 'decision'
        : n.type === 'document' || n.type === 'evidence'
        ? 'doc'
        : n.type === 'automation' || n.type === 'system'
        ? 'auto'
        : n.type === 'risk'
        ? 'risk'
        : '';
    if (cls) lines.push(`  class ${nodeId(n.id)} ${cls};`);
  });

  return lines.join('\n');
}
