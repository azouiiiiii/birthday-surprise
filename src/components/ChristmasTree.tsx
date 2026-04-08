import { useRef } from "react";
import { Group } from "three";

import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import { easing } from "maath";

import Foliage from "./Foliage";
import Ornaments from "./Ornaments";
import FloatingSnow from "./FloatingSnow";
import Candle from "./Candle"; // 🌸 新增：蜡烛
import PhotoParticles from "./PhotoParticles";

interface ChristmasTreeProps {
  isTreeShape: boolean;
}

function TreeGlow({ isTreeShape }: { isTreeShape: boolean }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (materialRef.current && meshRef.current) {
      const targetAlpha = isTreeShape ? 0.25 : 0;
      const smoothTime = isTreeShape ? 0.8 : 0.3;

      easing.damp(
        materialRef.current.uniforms.uAlpha,
        "value",
        targetAlpha,
        smoothTime,
        delta
      );

      meshRef.current.visible =
        materialRef.current.uniforms.uAlpha.value > 0.001;

      const pulse = 1.0 + Math.sin(state.clock.elapsedTime) * 0.05;
      materialRef.current.uniforms.uScale.value = pulse;
    }
  });

  return (
    <Billboard position={[0, 6, 0]}>
      <mesh ref={meshRef}>
        <planeGeometry args={[20, 20]} />
        <shaderMaterial
          ref={materialRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{
            uAlpha: { value: 0 },
            uColor: { value: new THREE.Color("#ffb6c1") },
            uScale: { value: 1 },
          }}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform float uAlpha;
            uniform vec3 uColor;
            uniform float uScale;
            varying vec2 vUv;
            void main() {
              float d = distance(vUv, vec2(0.5));
              float glow = 1.0 - smoothstep(0.0, 0.5, d);
              glow = pow(glow, 2.5);
              gl_FragColor = vec4(uColor, glow * uAlpha * uScale);
            }
          `}
        />
      </mesh>
    </Billboard>
  );
}

export default function ChristmasTree({ isTreeShape }: ChristmasTreeProps) {
  const groupRef = useRef<Group>(null);

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
      <TreeGlow isTreeShape={isTreeShape} />
      <FloatingSnow isTreeShape={isTreeShape} />

      {/* 树体粒子 */}
      <Foliage isTreeShape={isTreeShape} count={3000} />

      {/* 中层白球 */}
      <Ornaments
        isTreeShape={isTreeShape}
        count={1200}
        type="bauble"
        color="#ffffff"
      />

      {/* 上层橙黄小球 */}
      <Ornaments
        isTreeShape={isTreeShape}
        count={2000}
        type="bauble-small"
        color="#ff9800"
      />

      {/* 底部礼物 */}
      <Ornaments
        isTreeShape={isTreeShape}
        count={30}
        type="gift"
        color="#ffb300"
      />

      {/* 🌸 树顶蜡烛（新增） */}
      <Candle isTreeShape={isTreeShape} />

      {/* 🌸 照片粒子（新增） */}
      <PhotoParticles isTreeShape={isTreeShape} />
    </group>
  );
}



