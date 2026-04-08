import { useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { easing } from "maath";

interface PhotoParticlesProps {
  isTreeShape: boolean;
}

const PHOTO_COUNT = 11; // 增加数量更容易看到效果
const RADIUS = 8; // 散开半径

function fibonacciSphere(count: number, radius: number) {
  const points: THREE.Vector3[] = [];
  const offset = 2 / count;
  const increment = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = i * offset - 1 + offset / 2;
    const r = Math.sqrt(1 - y * y);
    const phi = i * increment;

    points.push(
      new THREE.Vector3(
        Math.cos(phi) * r * radius,
        y * radius + 4,
        Math.sin(phi) * r * radius
      )
    );
  }

  return points;
}

export default function PhotoParticles({ isTreeShape }: PhotoParticlesProps) {
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const [active, setActive] = useState<number | null>(null);

  const targets = useMemo(() => fibonacciSphere(PHOTO_COUNT, RADIUS), []);

  const textures = useMemo(
    () =>
      Array.from({ length: PHOTO_COUNT }, (_, i) =>
        new THREE.TextureLoader().load(`/photos/p${i + 1}.jpg`)
      ),
    []
  );

  useFrame((_, delta) => {
    if (!group.current) return;

    group.current.children.forEach((mesh, i) => {
      const m = mesh as THREE.Mesh;
      const targetPos = targets[i];

      const hide = isTreeShape;

      const basePos = hide ? new THREE.Vector3(0, 3.5, 0) : targetPos;

      easing.damp3(m.position, basePos, 0.6, delta);

      const s = active === i ? 2 : hide ? 0.01 : 1;
      easing.damp(m.scale, "x", s, 0.4, delta);
      easing.damp(m.scale, "y", s, 0.4, delta);
      easing.damp(m.scale, "z", s, 0.4, delta);

      const mat = m.material as THREE.MeshStandardMaterial;
      mat.transparent = true;
      const opacity = hide ? 0 : 1;
      easing.damp(mat, "opacity", opacity, 0.5, delta);

      // 面始终朝外
      const lookTarget = m.position.clone().multiplyScalar(2);
      m.lookAt(lookTarget);
    });

    // 放大时拉到摄像机前
    if (active !== null) {
      const m = group.current.children[active] as THREE.Mesh;
      const front = camera.position
        .clone()
        .add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(2.5));
      easing.damp3(m.position, front, 0.6, delta);
      m.lookAt(camera.position);
    }
  });

  return (
    <group ref={group} onPointerMissed={() => setActive(null)}>
      {targets.map((_, i) => (
        <mesh
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            setActive(i);
          }}
        >
          <planeGeometry args={[2.4, 1.6]} />
          <meshStandardMaterial
            map={textures[i]}
            transparent
            opacity={1}
            roughness={0.8}
            side={THREE.DoubleSide} // 双面显示，防止背面看不到
          />
        </mesh>
      ))}
    </group>
  );
}
