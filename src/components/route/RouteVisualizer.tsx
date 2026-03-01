import { Box, Flex, Text } from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import type { QuoteSnapshot } from '@/stores/appStore';

interface RouteNode {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  kind: 'token' | 'pool';
}

interface RouteEdge {
  id: string;
  from: RouteNode;
  to: RouteNode;
  label: string;
}

interface RouteLayout {
  viewWidth: number;
  viewHeight: number;
  nodeFontSize: number;
  nodes: RouteNode[];
  edges: RouteEdge[];
}

const MotionSvg = motion.svg;
const MotionPath = motion.path;

/**
 * SVG route visualizer with responsive path layout and dense-route compaction.
 */
export function RouteVisualizer({ snapshot }: { snapshot: QuoteSnapshot | null }) {
  const poolCount = snapshot?.route.fills.length ?? 0;
  const denseLayout = poolCount > 4;
  const containerHeight = denseLayout ? 150 : 120;

  if (!snapshot || poolCount === 0) {
    return (
      <Flex h={`${containerHeight}px`} align="center" justify="center" bg="bgSurface" borderTop="1px solid" borderColor="border">
        <Text fontFamily="mono" fontSize="10px" color="textDim">
          NO ROUTE LOADED
        </Text>
      </Flex>
    );
  }

  const layout = buildLayout(snapshot, containerHeight);

  return (
    <Box
      w="100%"
      h={`${containerHeight}px`}
      overflow="hidden"
      bg="bgSurface"
      borderTop="1px solid"
      borderColor="border"
      pos="relative"
    >
      <AnimatePresence mode="wait">
        <MotionSvg
          key={snapshot.id}
          width="100%"
          height="100%"
          viewBox={`0 0 ${layout.viewWidth} ${layout.viewHeight}`}
          preserveAspectRatio="xMidYMid meet"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {layout.edges.map((edge, index) => (
            <RouteEdgePath key={edge.id} edge={edge} index={index} fontSize={layout.nodeFontSize} />
          ))}
          {layout.nodes.map((node) => (
            <RouteNodeBox key={node.id} node={node} fontSize={layout.nodeFontSize} />
          ))}
        </MotionSvg>
      </AnimatePresence>
    </Box>
  );
}

function RouteEdgePath({ edge, index, fontSize }: { edge: RouteEdge; index: number; fontSize: number }) {
  const x1 = edge.from.x + edge.from.width / 2;
  const y1 = edge.from.y;
  const x2 = edge.to.x - edge.to.width / 2;
  const y2 = edge.to.y;
  const c1x = x1 + (x2 - x1) * 0.45;
  const c2x = x1 + (x2 - x1) * 0.55;
  const path = `M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${y2}, ${x2} ${y2}`;
  const length = Math.max(Math.hypot(x2 - x1, y2 - y1), 1);
  const midpoint = cubicBezierPoint(0.5, { x: x1, y: y1 }, { x: c1x, y: y1 }, { x: c2x, y: y2 }, { x: x2, y: y2 });

  return (
    <g>
      <MotionPath
        d={path}
        fill="none"
        stroke="var(--chakra-colors-cyan)"
        strokeWidth="0.8"
        opacity="0.7"
        strokeDasharray={length}
        initial={{ strokeDashoffset: length }}
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
      />
      <text
        x={midpoint.x}
        y={midpoint.y - 6}
        fill="var(--chakra-colors-textDim)"
        fontFamily="Iosevka Fixed, Iosevka, monospace"
        fontSize={fontSize}
        textAnchor="middle"
      >
        {edge.label}
      </text>
    </g>
  );
}

function RouteNodeBox({ node, fontSize }: { node: RouteNode; fontSize: number }) {
  const x = node.x - node.width / 2;
  const y = node.y - node.height / 2;
  const isTerminal = node.kind === 'token' && (node.id === 'source' || node.id === 'destination');
  const maxChars = Math.max(4, Math.floor((node.width - 8) / (fontSize * 0.58)));
  const label = truncate(node.label, maxChars);

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={node.width}
        height={node.height}
        rx={2}
        fill="var(--chakra-colors-bgRaised)"
        stroke={isTerminal ? 'var(--chakra-colors-amber)' : 'var(--chakra-colors-borderBright)'}
        strokeWidth="1"
      />
      <text
        x={node.x}
        y={node.y + 3}
        fill="var(--chakra-colors-textPrimary)"
        fontFamily="Iosevka Fixed, Iosevka, monospace"
        fontSize={fontSize}
        textAnchor="middle"
      >
        {label}
      </text>
    </g>
  );
}

function buildLayout(snapshot: QuoteSnapshot, containerHeight: number): RouteLayout {
  const viewWidth = 600;
  const viewHeight = containerHeight;
  const denseLayout = snapshot.route.fills.length > 4;
  const nodeHeight = denseLayout ? 18 : 22;
  const nodeFontSize = denseLayout ? 7 : 8;
  const sourceY = viewHeight / 2;

  const tokenByAddress = new Map<string, string>();
  for (const token of snapshot.route.tokens) {
    if (token.symbol) {
      tokenByAddress.set(token.address.toLowerCase(), token.symbol);
    }
  }

  const intermediateSymbols = snapshot.route.fills.map((fill) => {
    const symbol = tokenByAddress.get(fill.to.toLowerCase());
    return symbol && symbol !== snapshot.buySymbol ? symbol : null;
  });

  const hasIntermediateTokens = intermediateSymbols.some((symbol) => symbol !== null);
  const sourceX = viewWidth * 0.08;
  const poolX = hasIntermediateTokens ? viewWidth * 0.36 : viewWidth * 0.5;
  const tokenX = viewWidth * 0.64;
  const destinationX = viewWidth * 0.9;
  const rowSpacing = viewHeight / (snapshot.route.fills.length + 1);

  const source: RouteNode = {
    id: 'source',
    label: snapshot.sellSymbol,
    x: sourceX,
    y: sourceY,
    width: 48,
    height: nodeHeight,
    kind: 'token',
  };
  const destination: RouteNode = {
    id: 'destination',
    label: snapshot.buySymbol,
    x: destinationX,
    y: sourceY,
    width: 48,
    height: nodeHeight,
    kind: 'token',
  };

  const nodes: RouteNode[] = [source, destination];
  const edges: RouteEdge[] = [];

  snapshot.route.fills.forEach((fill, index) => {
    const y = rowSpacing * (index + 1);
    const poolNode: RouteNode = {
      id: `pool-${index}`,
      label: fill.source,
      x: poolX,
      y,
      width: 80,
      height: nodeHeight,
      kind: 'pool',
    };
    nodes.push(poolNode);

    const edgePct = `${(Number(fill.proportionBps) / 100).toFixed(2)}%`;
    edges.push({
      id: `source-to-pool-${index}`,
      from: source,
      to: poolNode,
      label: edgePct,
    });

    const intermediateSymbol = intermediateSymbols[index];
    if (intermediateSymbol) {
      const tokenNode: RouteNode = {
        id: `token-${index}`,
        label: intermediateSymbol,
        x: tokenX,
        y,
        width: 48,
        height: nodeHeight,
        kind: 'token',
      };
      nodes.push(tokenNode);
      edges.push({
        id: `pool-to-token-${index}`,
        from: poolNode,
        to: tokenNode,
        label: edgePct,
      });
      edges.push({
        id: `token-to-destination-${index}`,
        from: tokenNode,
        to: destination,
        label: edgePct,
      });
    } else {
      edges.push({
        id: `pool-to-destination-${index}`,
        from: poolNode,
        to: destination,
        label: edgePct,
      });
    }
  });

  return { viewWidth, viewHeight, nodeFontSize, nodes, edges };
}

function cubicBezierPoint(
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
): { x: number; y: number } {
  const u = 1 - t;
  const x =
    u ** 3 * p0.x +
    3 * u ** 2 * t * p1.x +
    3 * u * t ** 2 * p2.x +
    t ** 3 * p3.x;
  const y =
    u ** 3 * p0.y +
    3 * u ** 2 * t * p1.y +
    3 * u * t ** 2 * p2.y +
    t ** 3 * p3.y;
  return { x, y };
}

function truncate(value: string, maxChars: number): string {
  if (value.length <= maxChars) {
    return value;
  }
  return `${value.slice(0, Math.max(1, maxChars - 1))}…`;
}
