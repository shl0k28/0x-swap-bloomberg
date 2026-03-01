import { Box, Flex, Text, useToken } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import type { QuoteSnapshot } from '@/stores/appStore';

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'token' | 'pool';
  subtitle?: string;
}

interface Edge {
  id: string;
  from: Node;
  to: Node;
  label: string;
}

interface GraphModel {
  nodes: Node[];
  edges: Edge[];
}

const MotionLine = motion.line;

/**
 * Compact SVG route visualizer rendered in the bottom panel.
 */
export function RouteVisualizer({ snapshot }: { snapshot: QuoteSnapshot | null }) {
  const [cyan, textDim, bgSurface, bgRaised, amber, borderBright, textPrimary] = useToken(
    'colors',
    ['cyan', 'textDim', 'bgSurface', 'bgRaised', 'amber', 'borderBright', 'textPrimary'],
  );

  if (!snapshot || snapshot.route.fills.length === 0) {
    return (
      <Flex h="80px" align="center" justify="center" bg="bgSurface">
        <Text fontFamily="mono" fontSize="10px" color="textDim">
          NO ROUTE LOADED
        </Text>
      </Flex>
    );
  }

  const graph = buildGraph(snapshot);

  return (
    <Box h="80px" w="100%" overflowX="auto" bg="bgSurface">
      <svg width="700" height="80" role="img" aria-label="0x route">
        {graph.edges.map((edge, index) => (
          <RouteEdgeSvg key={edge.id} edge={edge} index={index} color={cyan} labelColor={textDim} />
        ))}

        {graph.nodes.map((node) => (
          <RouteNodeSvg
            key={node.id}
            node={node}
            tokenFill={bgSurface}
            poolFill={bgRaised}
            tokenStroke={amber}
            poolStroke={borderBright}
            textColor={textPrimary}
            subtitleColor={cyan}
          />
        ))}
      </svg>
    </Box>
  );
}

function RouteEdgeSvg({
  edge,
  index,
  color,
  labelColor,
}: {
  edge: Edge;
  index: number;
  color: string;
  labelColor: string;
}) {
  const x1 = edge.from.x + edge.from.width / 2;
  const y1 = edge.from.y;
  const x2 = edge.to.x - edge.to.width / 2;
  const y2 = edge.to.y;
  const length = Math.max(Math.hypot(x2 - x1, y2 - y1), 1);
  return (
    <g>
      <MotionLine
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth="1"
        initial={{ pathLength: 0, opacity: 0.7, strokeDasharray: length, strokeDashoffset: length }}
        animate={{ pathLength: 1, opacity: 1, strokeDashoffset: 0 }}
        transition={{ duration: 0.6, delay: index * 0.08, ease: 'easeOut' }}
      />
      <text
        x={(x1 + x2) / 2}
        y={(y1 + y2) / 2 - 6}
        fill={labelColor}
        fontFamily="Iosevka Fixed, Iosevka, monospace"
        fontSize="9"
        textAnchor="middle"
      >
        {edge.label}
      </text>
    </g>
  );
}

function RouteNodeSvg({
  node,
  tokenFill,
  poolFill,
  tokenStroke,
  poolStroke,
  textColor,
  subtitleColor,
}: {
  node: Node;
  tokenFill: string;
  poolFill: string;
  tokenStroke: string;
  poolStroke: string;
  textColor: string;
  subtitleColor: string;
}) {
  const isToken = node.type === 'token';
  return (
    <g>
      <rect
        x={node.x - node.width / 2}
        y={node.y - node.height / 2}
        width={node.width}
        height={node.height}
        rx={2}
        fill={isToken ? tokenFill : poolFill}
        stroke={isToken ? tokenStroke : poolStroke}
        strokeWidth="1"
      />
      <text
        x={node.x}
        y={node.y + 3}
        fill={textColor}
        fontFamily="Iosevka Fixed, Iosevka, monospace"
        fontSize="10"
        textAnchor="middle"
      >
        {node.label}
      </text>
      {node.subtitle ? (
        <text
          x={node.x}
          y={node.y + 15}
          fill={subtitleColor}
          fontFamily="Iosevka Fixed, Iosevka, monospace"
          fontSize="8"
          textAnchor="middle"
        >
          {node.subtitle}
        </text>
      ) : null}
    </g>
  );
}

function buildGraph(snapshot: QuoteSnapshot): GraphModel {
  const tokenLookup = new Map<string, string>();
  for (const token of snapshot.route.tokens) {
    if (token.symbol) {
      tokenLookup.set(token.address.toLowerCase(), token.symbol);
    }
  }

  const source = createNode('token-source', snapshot.sellSymbol, 64, 40, 'token', 54, 24);
  const destination = createNode('token-destination', snapshot.buySymbol, 610, 40, 'token', 54, 24);
  const routeCount = Math.max(snapshot.route.fills.length, 1);

  const pools = snapshot.route.fills.map((fill, index) => {
    const y = 40 + (routeCount === 1 ? 0 : (index - (routeCount - 1) / 2) * 20);
    return createNode(`pool-${index}`, fill.source, 270, y, 'pool', 72, 20, tokenLookup.get(fill.to.toLowerCase()));
  });

  const mids = snapshot.route.fills.reduce<Record<number, Node>>((acc, fill, index) => {
    const symbol = tokenLookup.get(fill.to.toLowerCase());
    if (symbol && symbol !== snapshot.buySymbol) {
      const y = 40 + (routeCount === 1 ? 0 : (index - (routeCount - 1) / 2) * 20);
      acc[index] = createNode(`mid-${index}`, symbol, 460, y, 'token', 54, 24);
    }
    return acc;
  }, {});

  const edges = snapshot.route.fills.flatMap((fill, index) => {
    const pool = pools[index];
    if (!pool) return [];
    const label = `${(Number(fill.proportionBps) / 100).toFixed(2)}%`;
    const mid = mids[index];
    return mid
      ? [
          { id: `${pool.id}-in`, from: source, to: pool, label },
          { id: `${pool.id}-mid`, from: pool, to: mid, label },
          { id: `${pool.id}-out`, from: mid, to: destination, label },
        ]
      : [
          { id: `${pool.id}-in`, from: source, to: pool, label },
          { id: `${pool.id}-out`, from: pool, to: destination, label },
        ];
  });

  return { nodes: [source, ...pools, ...Object.values(mids), destination], edges };
}

function createNode(
  id: string,
  label: string,
  x: number,
  y: number,
  type: Node['type'],
  width: number,
  height: number,
  subtitle?: string,
): Node {
  return { id, label, x, y, width, height, type, subtitle };
}
