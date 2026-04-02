<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { gitEngine } from '../../lib/engine/git/GitEngine.js';
  import { eventBus } from '../../lib/engine/events/GameEventBus.js';
  import type { CommitInfo, BranchInfo } from '../../lib/engine/git/types.js';

  // --- Types ---
  interface GraphNode {
    oid: string;
    shortOid: string;
    message: string;
    parents: string[];
    lane: number;
    row: number;
    color: string;
    branchLabels: string[];
    isHead: boolean;
    isMerge: boolean;
  }

  interface GraphEdge {
    fromOid: string;
    toOid: string;
    color: string;
  }

  // --- Constants ---
  const NODE_RADIUS = 6;
  const V_SPACING = 44;
  const H_SPACING = 32;
  const PADDING_X = 40;
  const PADDING_Y = 28;
  const LABEL_OFFSET_X = 16;

  const BRANCH_COLORS = [
    '#00e436', // main - green
    '#29adff', // blue
    '#ff004d', // red
    '#ffa300', // orange
    '#ff77a8', // pink
    '#00e4ff', // cyan
  ];

  // --- Reactive state ---
  let initialized = $state(false);
  let nodes = $state<GraphNode[]>([]);
  let edges = $state<GraphEdge[]>([]);
  let svgWidth = $state(200);
  let svgHeight = $state(200);
  let unsub: (() => void) | null = null;

  // --- Graph building ---
  function buildGraph(commits: CommitInfo[], branches: BranchInfo[], headOid: string | null, currentBranch: string | null) {
    if (commits.length === 0) return { nodes: [] as GraphNode[], edges: [] as GraphEdge[] };

    // Build branch-to-color map; main/master always lane 0
    const branchOrder: string[] = [];
    const branchColorMap = new Map<string, string>();

    // Sort: current branch first, then main/master, then alphabetical
    const sorted = [...branches].sort((a, b) => {
      if (a.name === 'main' || a.name === 'master') return -1;
      if (b.name === 'main' || b.name === 'master') return 1;
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const b of sorted) {
      if (!branchOrder.includes(b.name)) {
        branchOrder.push(b.name);
        branchColorMap.set(b.name, BRANCH_COLORS[branchOrder.length - 1] || BRANCH_COLORS[0]);
      }
    }

    // Map tip oid -> branch names
    const tipToBranches = new Map<string, string[]>();
    for (const b of branches) {
      const existing = tipToBranches.get(b.oid) || [];
      existing.push(b.name);
      tipToBranches.set(b.oid, existing);
    }

    // Assign each commit to the "best" branch (first branch whose tip is reachable)
    // Simple heuristic: for each commit, find the first branch that contains it
    const commitBranch = new Map<string, string>();
    const commitMap = new Map<string, CommitInfo>();
    for (const c of commits) {
      commitMap.set(c.oid, c);
    }

    // For each branch, walk its commits and claim unclaimed ones
    for (const b of sorted) {
      const branchTip = b.oid;
      // Walk from tip down through parents
      const stack = [branchTip];
      const visited = new Set<string>();
      while (stack.length > 0) {
        const oid = stack.pop()!;
        if (visited.has(oid)) continue;
        visited.add(oid);
        if (commitMap.has(oid) && !commitBranch.has(oid)) {
          commitBranch.set(oid, b.name);
        }
        const commit = commitMap.get(oid);
        if (commit) {
          for (const p of commit.parents) {
            stack.push(p);
          }
        }
      }
    }

    // Topological sort (newest first via timestamp, stable)
    const sortedCommits = [...commits].sort((a, b) => b.author.timestamp - a.author.timestamp);

    // Assign lane per branch
    const branchLane = new Map<string, number>();
    let nextLane = 0;
    for (const bName of branchOrder) {
      branchLane.set(bName, nextLane++);
    }

    // Build nodes
    const graphNodes: GraphNode[] = [];
    const oidToNode = new Map<string, GraphNode>();

    for (let i = 0; i < sortedCommits.length; i++) {
      const c = sortedCommits[i];
      const branch = commitBranch.get(c.oid) || branchOrder[0] || 'main';
      const lane = branchLane.get(branch) ?? 0;
      const color = branchColorMap.get(branch) || BRANCH_COLORS[0];
      const branchLabels = tipToBranches.get(c.oid) || [];

      const node: GraphNode = {
        oid: c.oid,
        shortOid: c.oid.slice(0, 7),
        message: c.message.split('\n')[0].slice(0, 40),
        parents: c.parents,
        lane,
        row: i,
        color,
        branchLabels,
        isHead: c.oid === headOid,
        isMerge: c.parents.length >= 2,
      };

      graphNodes.push(node);
      oidToNode.set(c.oid, node);
    }

    // Build edges
    const graphEdges: GraphEdge[] = [];
    for (const node of graphNodes) {
      for (const parentOid of node.parents) {
        const parentNode = oidToNode.get(parentOid);
        if (parentNode) {
          graphEdges.push({
            fromOid: node.oid,
            toOid: parentOid,
            color: node.color,
          });
        }
      }
    }

    return { nodes: graphNodes, edges: graphEdges };
  }

  function nodeX(lane: number): number {
    return PADDING_X + lane * H_SPACING;
  }

  function nodeY(row: number): number {
    return PADDING_Y + row * V_SPACING;
  }

  function edgePath(fromNode: GraphNode, toNode: GraphNode): string {
    const x1 = nodeX(fromNode.lane);
    const y1 = nodeY(fromNode.row);
    const x2 = nodeX(toNode.lane);
    const y2 = nodeY(toNode.row);

    if (x1 === x2) {
      // Straight vertical line
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    }

    // Curved path for cross-lane edges
    const midY = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  }

  // --- Data fetching ---
  async function refreshGraph() {
    try {
      await gitEngine.fs.promises.stat(`${gitEngine.dir}/.git`);
    } catch {
      initialized = false;
      nodes = [];
      edges = [];
      return;
    }

    initialized = true;

    const [allCommits, allBranches, headOid, currentBranch] = await Promise.all([
      gitEngine.getAllCommits(20),
      gitEngine.getBranches(),
      gitEngine.getHeadOid(),
      gitEngine.getCurrentBranch(),
    ]);

    const result = buildGraph(allCommits, allBranches, headOid, currentBranch);
    nodes = result.nodes;
    edges = result.edges;

    // Compute SVG dimensions
    const maxLane = nodes.reduce((max, n) => Math.max(max, n.lane), 0);
    const maxRow = nodes.reduce((max, n) => Math.max(max, n.row), 0);
    svgWidth = Math.max(200, PADDING_X * 2 + maxLane * H_SPACING + 120);
    svgHeight = Math.max(100, PADDING_Y * 2 + maxRow * V_SPACING);
  }

  // --- Build oid lookup for edge rendering ---
  const oidToNode = $derived(new Map(nodes.map(n => [n.oid, n])));

  onMount(() => {
    unsub = eventBus.on('state:changed', refreshGraph);
    refreshGraph();
  });

  onDestroy(() => {
    unsub?.();
  });
</script>

<div class="graph-container">
  <div class="panel-header">
    <span class="panel-title">COMMIT GRAPH</span>
  </div>

  {#if !initialized}
    <div class="empty-state">
      <svg class="empty-icon-svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
        <line x1="16" y1="4" x2="16" y2="28" stroke="#5f574f" stroke-width="2" />
        <circle cx="16" cy="8" r="3" fill="none" stroke="#5f574f" stroke-width="2" />
        <circle cx="16" cy="20" r="3" fill="none" stroke="#5f574f" stroke-width="2" />
        <line x1="16" y1="23" x2="24" y2="28" stroke="#5f574f" stroke-width="2" />
        <circle cx="24" cy="28" r="2" fill="none" stroke="#5f574f" stroke-width="2" />
      </svg>
      <span class="empty-text">No commits yet</span>
      <span class="empty-hint">Make your first <code>git commit</code></span>
    </div>
  {:else if nodes.length === 0}
    <div class="empty-state">
      <span class="empty-text">No commits yet</span>
      <span class="empty-hint">Make your first <code>git commit</code></span>
    </div>
  {:else}
    <div class="graph-scroll">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox="0 0 {svgWidth} {svgHeight}"
        class="graph-svg"
      >
        <!-- Edges -->
        {#each edges as edge}
          {@const fromNode = oidToNode.get(edge.fromOid)}
          {@const toNode = oidToNode.get(edge.toOid)}
          {#if fromNode && toNode}
            <path
              d={edgePath(fromNode, toNode)}
              fill="none"
              stroke={edge.color}
              stroke-width="2"
              stroke-opacity="0.5"
              class="graph-edge"
            />
          {/if}
        {/each}

        <!-- Nodes -->
        {#each nodes as node}
          {@const cx = nodeX(node.lane)}
          {@const cy = nodeY(node.row)}

          <!-- HEAD glow -->
          {#if node.isHead}
            <circle
              cx={cx}
              cy={cy}
              r={NODE_RADIUS + 4}
              fill="none"
              stroke="#fff"
              stroke-width="1.5"
              stroke-opacity="0.4"
              class="head-glow"
            />
          {/if}

          <!-- Commit node (retro square) -->
          <rect
            x={cx - NODE_RADIUS}
            y={cy - NODE_RADIUS}
            width={NODE_RADIUS * 2}
            height={NODE_RADIUS * 2}
            fill={node.color}
            rx="1"
            class="commit-node"
            class:merge-node={node.isMerge}
          />

          <!-- Merge diamond overlay -->
          {#if node.isMerge}
            <rect
              x={cx - NODE_RADIUS + 1}
              y={cy - NODE_RADIUS + 1}
              width={NODE_RADIUS * 2 - 2}
              height={NODE_RADIUS * 2 - 2}
              fill="none"
              stroke="#0a0a0a"
              stroke-width="1"
              rx="0"
            />
          {/if}

          <!-- SHA label -->
          <text
            x={cx + LABEL_OFFSET_X}
            y={cy + 1}
            class="sha-label"
            dominant-baseline="middle"
          >
            {node.shortOid}
          </text>

          <!-- Commit message (truncated) -->
          <text
            x={cx + LABEL_OFFSET_X + 62}
            y={cy + 1}
            class="message-label"
            dominant-baseline="middle"
          >
            {node.message}
          </text>

          <!-- Branch labels -->
          {#each node.branchLabels as label, i}
            <g>
              <rect
                x={cx + LABEL_OFFSET_X + 56 * i - 4}
                y={cy - 22}
                width={label.length * 6.5 + 10}
                height={14}
                rx="2"
                fill={node.color}
                fill-opacity="0.15"
                stroke={node.color}
                stroke-width="1"
                stroke-opacity="0.5"
              />
              <text
                x={cx + LABEL_OFFSET_X + 56 * i + 1}
                y={cy - 13}
                class="branch-label"
                fill={node.color}
                dominant-baseline="middle"
              >
                {label}
              </text>
            </g>
          {/each}

          <!-- HEAD arrow -->
          {#if node.isHead}
            <text
              x={cx - LABEL_OFFSET_X - 6}
              y={cy + 1}
              class="head-label"
              dominant-baseline="middle"
              text-anchor="end"
            >
              HEAD
            </text>
          {/if}
        {/each}
      </svg>
    </div>
  {/if}
</div>

<style>
  .graph-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0a0a0a;
    border: 1px solid #2a2a4e;
    border-radius: 4px;
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    background: #1a1a2e;
    border-bottom: 1px solid #2a2a4e;
    flex-shrink: 0;
  }

  .panel-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
    color: #5f574f;
    letter-spacing: 2px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 8px;
    padding: 24px;
  }

  .empty-icon-svg {
    opacity: 0.6;
  }

  .empty-text {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #5f574f;
  }

  .empty-hint {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #5f574f88;
  }

  .empty-hint code {
    color: #00e436;
    background: #00e43622;
    padding: 1px 4px;
    border-radius: 2px;
  }

  .graph-scroll {
    flex: 1;
    overflow: auto;
    padding: 4px;
  }

  .graph-svg {
    display: block;
  }

  .graph-edge {
    transition: d 0.3s ease;
  }

  .commit-node {
    transition: all 0.2s ease;
    filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.1));
  }

  .commit-node:hover {
    filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.3));
  }

  .merge-node {
    filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.15));
  }

  .head-glow {
    animation: glow-pulse 2s ease-in-out infinite;
  }

  @keyframes glow-pulse {
    0%, 100% { stroke-opacity: 0.25; }
    50% { stroke-opacity: 0.6; }
  }

  .sha-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    fill: #8b8b8b;
    pointer-events: none;
    user-select: none;
  }

  .message-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    fill: #5f574f;
    pointer-events: none;
    user-select: none;
  }

  .branch-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8px;
    pointer-events: none;
    user-select: none;
  }

  .head-label {
    font-family: 'Press Start 2P', monospace;
    font-size: 6px;
    fill: #ffa300;
    pointer-events: none;
    user-select: none;
  }
</style>
