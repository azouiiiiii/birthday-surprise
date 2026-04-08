import { useMemo, useRef, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { easing } from "maath";

interface CandleProps {
  isTreeShape: boolean;
}

const tempObject = new THREE.Object3D();
const tempPos = new THREE.Vector3();

const CANDLE_HEIGHT = 2.2;

export default function Candle({ isTreeShape }: CandleProps) {
  const candleRef = useRef<THREE.InstancedMesh>(null);
  const flameRef = useRef<THREE.Mesh>(null);

  /* ------------------ 分散 / 聚合数据 ------------------ */
  const { scatter, target } = useMemo(() => {
    // 分散状态
    const scatter = {
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        Math.random() * 5 + 3,
        (Math.random() - 0.5) * 10
      ),
      rotation: new THREE.Euler(
        Math.random() * 0.6,
        Math.random() * Math.PI * 2,
        Math.random() * 0.6
      ),
      scale: 1,
    };

    // 聚合状态：圆柱顶部中心
    const target = {
      position: new THREE.Vector3(0, 4.1, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: 1,
    };

    return { scatter, target };
  }, []);

  /* ------------------ 初始化 ------------------ */
  useLayoutEffect(() => {
    if (!candleRef.current) return;

    tempObject.position.copy(scatter.position);
    tempObject.rotation.copy(scatter.rotation);
    tempObject.scale.setScalar(scatter.scale);
    tempObject.updateMatrix();
    candleRef.current.setMatrixAt(0, tempObject.matrix);
    candleRef.current.instanceMatrix.needsUpdate = true;
  }, [scatter]);

  /* ------------------ 动画 ------------------ */
  useFrame((state, delta) => {
    if (!candleRef.current || !flameRef.current) return;

    if (candleRef.current.userData.mix === undefined)
      candleRef.current.userData.mix = 0;

    easing.damp(
      candleRef.current.userData,
      "mix",
      isTreeShape ? 1 : 0,
      isTreeShape ? 0.9 : 0.5,
      delta
    );

    const mix = candleRef.current.userData.mix;
    const time = state.clock.elapsedTime;

    // 插值位置
    tempPos.lerpVectors(scatter.position, target.position, mix);

    // 分散时轻微飘动
    const float = Math.sin(time * 1.5) * 0.15 * (1 - mix);

    tempObject.position.set(
      tempPos.x,
      tempPos.y + float,
      tempPos.z
    );

    // 插值旋转（聚合后正立）
    tempObject.rotation.x =
      scatter.rotation.x * (1 - mix) + target.rotation.x * mix;
    tempObject.rotation.y =
      scatter.rotation.y * (1 - mix) + target.rotation.y * mix;
    tempObject.rotation.z =
      scatter.rotation.z * (1 - mix) + target.rotation.z * mix;

    tempObject.updateMatrix();
    candleRef.current.setMatrixAt(0, tempObject.matrix);
    candleRef.current.instanceMatrix.needsUpdate = true;

    /* ------------------ 火焰动画 ------------------ */
    const jump = Math.sin(time * 6) * 0.08;

    flameRef.current.position.set(
      tempPos.x,
      tempPos.y + CANDLE_HEIGHT / 2 + 0.15 + jump,
      tempPos.z
    );

    const flameScale = 1 + Math.sin(time * 8) * 0.2;
    flameRef.current.scale.setScalar(flameScale);
  });

  /* ------------------ 几何 & 材质 ------------------ */
  const candleGeometry = useMemo(
    () => new THREE.CylinderGeometry(0.07, 0.075, CANDLE_HEIGHT, 24),
    []
  );

  const candleMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffb6c1", // 粉色蜡烛
        roughness: 0.5,
        metalness: 0.05,
      }),
    []
  );

  const flameGeometry = useMemo(
    () => new THREE.SphereGeometry(0.12, 16, 16),
    []
  );

  const flameMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffcc55",
        emissive: "#ff9900",
        emissiveIntensity: 2.5,
        toneMapped: false,
      }),
    []
  );

  return (
    <>
      {/* 蜡烛本体 */}
      <instancedMesh
        ref={candleRef}
        args={[candleGeometry, candleMaterial, 1]}
        castShadow
        receiveShadow
      />

      {/* 火焰 */}
      <mesh ref={flameRef} geometry={flameGeometry} material={flameMaterial} />
    </>
  );
}

