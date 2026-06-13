import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Line, Billboard } from '@react-three/drei';
import { useProcessStore } from '../../store/useProcessStore';
import { NODE_TYPE_META } from '../../lib/processSchema';
import type { ProcessMap, ProcessNodeData } from '../../types/process';

const S = 62; // escala flow→3D
const LANE_H = 168;

function project(p: ProcessMap) {
  const xs = p.nodes.map((n) => n.position.x);
  const ys = p.nodes.map((n) => n.position.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const at = (n: ProcessNodeData): [number, number] => [(n.position.x - cx) / S, (n.position.y - cy) / S];
  const widthU = (Math.max(...xs) - Math.min(...xs)) / S + 6;
  return { cx, cy, at, widthU };
}

function Node3D({ node, x, z, selected, onClick }: { node: ProcessNodeData; x: number; z: number; selected: boolean; onClick: () => void }) {
  const color = NODE_TYPE_META[node.type].color;
  const isDecision = node.type === 'decision';
  const h = selected ? 1.1 : 0.7;
  return (
    <group position={[x, 0, z]}>
      <mesh
        position={[0, h / 2, 0]}
        rotation={isDecision ? [0, Math.PI / 4, 0] : [0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
        castShadow
      >
        {isDecision ? <boxGeometry args={[1.7, h, 1.7]} /> : <boxGeometry args={[3, h, 1.5]} />}
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected ? 0.6 : 0.18} metalness={0.3} roughness={0.45} />
      </mesh>
      {/* base luminosa */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.4, 1.9]} />
        <meshBasicMaterial color={color} transparent opacity={0.16} />
      </mesh>
      <Billboard position={[0, h + 0.55, 0]}>
        <Text fontSize={0.42} color="#ffffff" anchorX="center" anchorY="middle" maxWidth={4} outlineWidth={0.012} outlineColor="#04122b">
          {node.title.length > 38 ? node.title.slice(0, 36) + '…' : node.title}
        </Text>
      </Billboard>
    </group>
  );
}

function Scene() {
  const process = useProcessStore((s) => s.process);
  const selectedNodeId = useProcessStore((s) => s.selectedNodeId);
  const selectNode = useProcessStore((s) => s.selectNode);
  const { cy, at, widthU } = useMemo(() => project(process), [process]);

  const byId = new Map(process.nodes.map((n) => [n.id, n]));

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 18, 8]} intensity={1.1} castShadow />
      <directionalLight position={[-12, 10, -6]} intensity={0.4} color="#6A98FF" />

      {/* carriles como planos translúcidos */}
      {process.lanes.map((lane, i) => {
        const z = (i * LANE_H + 84 - cy) / S;
        return (
          <group key={lane.id} position={[0, 0, z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
              <planeGeometry args={[widthU, LANE_H / S - 0.2]} />
              <meshBasicMaterial color={lane.color} transparent opacity={0.1} />
            </mesh>
            <Billboard position={[-widthU / 2 - 0.4, 0.4, 0]}>
              <Text fontSize={0.5} color={lane.color} anchorX="right" anchorY="middle" outlineWidth={0.012} outlineColor="#04122b">
                {lane.name}
              </Text>
            </Billboard>
          </group>
        );
      })}

      {/* aristas */}
      {process.edges.map((e) => {
        const a = byId.get(e.source);
        const b = byId.get(e.target);
        if (!a || !b) return null;
        const [ax, az] = at(a);
        const [bx, bz] = at(b);
        const color = NODE_TYPE_META[a.type].color;
        return <Line key={e.id} points={[[ax, 0.45, az], [bx, 0.45, bz]]} color={color} lineWidth={2.2} />;
      })}

      {/* nodos */}
      {process.nodes.map((n) => {
        const [x, z] = at(n);
        return <Node3D key={n.id} node={n} x={x} z={z} selected={n.id === selectedNodeId} onClick={() => selectNode(n.id)} />;
      })}

      <gridHelper args={[60, 30, '#1748B5', '#0e2a6b']} position={[0, -0.04, 0]} />
      <OrbitControls makeDefault enablePan enableDamping dampingFactor={0.1} minDistance={6} maxDistance={60} maxPolarAngle={Math.PI / 2.1} />
    </>
  );
}

/** Vista 3D real (WebGL / three.js). Orbita con el mouse; clic en un nodo lo selecciona. */
export default function Canvas3DView() {
  const theme = useProcessStore((s) => s.theme);
  const bg = theme === 'dark' ? '#040f20' : '#0a1530';
  return (
    <div className="h-full w-full" style={{ background: bg }}>
      <Canvas shadows camera={{ position: [0, 17, 24], fov: 45 }} dpr={[1, 2]}>
        <color attach="background" args={[bg]} />
        <fog attach="fog" args={[bg, 35, 75]} />
        <Scene />
      </Canvas>
    </div>
  );
}
