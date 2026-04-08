import { useState, useRef, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  PerspectiveCamera,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import ChristmasTree from "../components/ChristmasTree";
import Background from "../components/Background";
import "./Christmas.css"; // 淡入动画

export default function Christmas() {
  const [isTreeShape, setIsTreeShape] = useState(true);
  const [started, setStarted] = useState(false); // 是否点击 start
  const [buttonVisible, setButtonVisible] = useState(false); // BLOW按钮
  const [playingSecond, setPlayingSecond] = useState(false); // 第二首音乐状态

  const audioRef = useRef<HTMLAudioElement>(null);
  const audio2Ref = useRef<HTMLAudioElement>(null);

  // Start Experience 点击
  const handleStartExperience = () => {
    const audio = audioRef.current;
    if (!audio) return;

    setStarted(true); // 隐藏 Start Experience
    audio.volume = 0.4;
    audio.play().finally(() => {
      audio.addEventListener("ended", () => setButtonVisible(true));
    });
  };

  // BLOW / AGAIN 按钮点击
  const handleButtonClick = () => {
    const audio2 = audio2Ref.current;
    if (!audio2) return;

    if (!playingSecond) {
      // 播放第二首音乐并散开
      setIsTreeShape(false);
      audio2.currentTime = 0;
      audio2.play();
      setPlayingSecond(true);
    } else {
      // 聚合并停止第二首音乐
      setIsTreeShape(true);
      audio2.pause();
      setPlayingSecond(false);
    }
  };

  return (
    <>
      {/* 音乐 */}
      <audio ref={audioRef} src="/music/birthday.mp3" />
      <audio ref={audio2Ref} src="/music/lovesong.mp3" loop />

      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: false,
          toneMapping: 3,
          toneMappingExposure: 1.1,
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 4, 18]} fov={50} />
        <OrbitControls
          enablePan={false}
          maxPolarAngle={Math.PI / 1.6}
          minDistance={10}
          maxDistance={25}
          autoRotate={false}
          enableDamping
          dampingFactor={0.05}
          target={[0, 4, 0]}
        />

        {/* 灯光 */}
        <spotLight
          position={[10, 20, 10]}
          angle={0.25}
          penumbra={1}
          intensity={2.8}
          color="#ffb6c1"
          castShadow
          shadow-bias={-0.0001}
        />
        <pointLight
          position={[-10, 5, -10]}
          intensity={1.5}
          color="#da70d6"
          distance={30}
        />
        <spotLight
          position={[0, 10, -10]}
          angle={0.5}
          intensity={2.2}
          color="#e8d4e8"
        />
        <ambientLight intensity={0.2} color="#4b0082" />

        <Suspense fallback={null}>
          <Environment
            files="/hdri/potsdamer_platz_1k.hdr"
            background={false}
          />
        </Suspense>

        <Background />
        <ChristmasTree isTreeShape={isTreeShape} />

        <EffectComposer multisampling={8}>
          <Bloom luminanceThreshold={0.6} mipmapBlur intensity={1.2} radius={0.6} />
          <Noise opacity={0.04} />
          <Vignette eskil={false} offset={0.1} darkness={0.8} />
        </EffectComposer>
      </Canvas>

      {/* Start Experience 按钮 */}
      {!started && (
        <div className="ui-container fade-in">
          <div className="ui-footer">
            <div className="button-group">
              <button className="magic-button" onClick={handleStartExperience}>
                surprise!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BLOW / AGAIN 按钮 */}
      {started && buttonVisible && (
        <div className="ui-container fade-in">
          <div className="ui-header">
            <span className="subtitle">
              {playingSecond ? "Azou & Zélie" : "my little princess"}
            </span>
            <h1>
              {playingSecond ? "200 days anniversary" : "Happy Birthday"}
            </h1>
          </div>

          <div className="ui-footer">
            <div className="button-group">
              <button className="magic-button" onClick={handleButtonClick}>
                {playingSecond ? "AGAIN?" : "BLOW!"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
