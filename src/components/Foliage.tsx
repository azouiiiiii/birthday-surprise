import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { easing } from "maath";

const vertexShader = `
  uniform float uTime;
  uniform float uMix;
  
  attribute vec3 treePosition;
  attribute float size;
  attribute float speed;
  attribute float pulse;
  
  varying vec3 vColor;
  
  void main() {
    // Mix between scattered position and target shape
    vec3 pos = mix(position, treePosition, uMix);
    
    // Breathing / wind effect
    float breathing = sin(uTime * 1.5 + pulse) * 0.05;
    pos.y += breathing;
    
    // Prevent clipping below ground
    if (pos.y < 0.0) pos.y = 0.0;
    
    // Subtle horizontal drift
    pos.x += sin(uTime * speed + pos.y) * 0.02;
    pos.z += cos(uTime * speed + pos.y) * 0.02;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Size attenuation
    gl_PointSize = size * (400.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
    
    // Color gradient
    vec3 deepPurple = vec3(0.3, 0.1, 0.3);
    vec3 softPink  = vec3(0.7, 0.5, 0.7);
    vec3 sparkle   = vec3(0.9, 0.9, 1.0);
    
    float heightFactor = clamp(pos.y / 6.0, 0.0, 1.0);
    vColor = mix(deepPurple, softPink, heightFactor);
    
    if (sin(speed * 50.0 + uTime) > 0.95) {
       vColor = mix(vColor, sparkle, 0.7);
    }
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;

    float glow = 1.0 - smoothstep(0.1, 0.5, d);
    gl_FragColor = vec4(vColor, glow * 0.5);
  }
`;

interface FoliageProps {
  isTreeShape: boolean;
  count: number;
}

export default function Foliage({ isTreeShape, count }: FoliageProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, treePositions, sizes, speeds, pulses } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const treePositions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count);
    const pulses = new Float32Array(count);

    const R = 3.8; // cylinder radius
    const H = 4.0; // cylinder height

    for (let i = 0; i < count; i++) {
      /* =========================
         SCATTER: random sphere
      ========================= */
      const r = 14 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) + 6;
      positions[i * 3 + 2] = r * Math.cos(phi);

      /* =========================
         TREE: CYLINDER (R=3.8, H=6)
      ========================= */
      const thetaC = Math.random() * Math.PI * 2;
      const radiusC = Math.sqrt(Math.random()) * R;
      const yC = Math.random() * H;

      treePositions[i * 3]     = radiusC * Math.cos(thetaC);
      treePositions[i * 3 + 1] = yC;
      treePositions[i * 3 + 2] = radiusC * Math.sin(thetaC);

      /* =========================
         Per-particle attributes
      ========================= */
      sizes[i]  = Math.random() * 0.6 + 0.2;
      speeds[i] = Math.random() * 0.5 + 0.5;
      pulses[i] = Math.random() * Math.PI * 2;
    }

    return { positions, treePositions, sizes, speeds, pulses };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMix: { value: 0 },
    }),
    []
  );

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const material = pointsRef.current.material as THREE.ShaderMaterial;
    material.uniforms.uTime.value = state.clock.elapsedTime;

    easing.damp(
      material.uniforms.uMix,
      "value",
      isTreeShape ? 1 : 0,
      isTreeShape ? 1.0 : 0.6,
      delta
    );
  });

 return (
  <points ref={pointsRef}>
    <bufferGeometry>
      <bufferAttribute
        attach="attributes-position"
        args={[positions, 3]}
      />
      <bufferAttribute
        attach="attributes-treePosition"
        args={[treePositions, 3]}
      />
      <bufferAttribute
        attach="attributes-size"
        args={[sizes, 1]}
      />
      <bufferAttribute
        attach="attributes-speed"
        args={[speeds, 1]}
      />
      <bufferAttribute
        attach="attributes-pulse"
        args={[pulses, 1]}
      />
    </bufferGeometry>

    <shaderMaterial
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={uniforms}
      transparent
      depthWrite={false}
      blending={THREE.AdditiveBlending}
    />
  </points>
);

}

