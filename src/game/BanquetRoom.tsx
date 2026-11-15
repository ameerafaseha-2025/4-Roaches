import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { Banquet, banquetObstacles, HALL } from './Banquet';
import { reveal, setHideZones, setObstacles, setRoom } from './sim';
import { footstep } from './sound';

export const BANQUET_SPAWN = { x: 0, z: 9.4 };

export function BanquetRoom() {
  const key = useRef<THREE.PointLight>(null);
  const { scene, gl, camera } = useThree();

  useEffect(() => {
    setRoom(HALL.half, 12, HALL.height);
    setObstacles(banquetObstacles);
    setHideZones([]);
    const bg = new THREE.Color('#2a1d12');
    const prev = scene.background;
    scene.background = bg;
    scene.fog = new THREE.Fog(bg, 18, 46);
    const exposure = gl.toneMappingExposure;
    gl.toneMappingExposure = 1.2;
    reveal.active = true;
    reveal.t = 0;
    return () => {
      scene.background = prev;
      scene.fog = null;
      gl.toneMappingExposure = exposure;
      reveal.active = false;
    };
  }, [scene, gl]);

  const last = useRef(0);
  useFrame((state, delta) => {
    if (key.current) key.current.intensity = 34 + Math.sin(state.clock.elapsedTime * 1.7) * 2;
    if (!reveal.active) return;
    reveal.t += Math.min(delta, 0.05);
    const k = Math.min(1, reveal.t / reveal.length);
    const e = k * k * (3 - 2 * k);
    camera.position.set(0, 1.5 + e * 0.7, 11.8 - e * 3.6);
    camera.lookAt(0, 1.55 - e * 0.15, -4);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 70 - e * 20;
      camera.updateProjectionMatrix();
    }
    const step = Math.floor(reveal.t / 0.38);
    if (step !== last.current && reveal.t < reveal.length - 0.6) { last.current = step; footstep(false, 0.5); }
    if (reveal.t >= reveal.length) reveal.active = false;
  });

  return (
    <group>
      <Environment resolution={128} background={false}>
        <Lightformer form="rect" intensity={1.6} color="#ffe3b0" position={[0, 8, 0]} scale={[16, 16, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.1} color="#ffc27a" position={[0, 3, -10]} scale={[14, 6, 1]} />
      </Environment>
      <hemisphereLight args={['#ffe9c4', '#4a3420', 0.75]} />
      <directionalLight position={[-4, 9, 8]} intensity={1.7} color="#ffd9a0" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-camera-far={40} shadow-bias={-0.0004} />
      <pointLight ref={key} position={[0, 4.4, -4]} intensity={34} distance={16} decay={1.4} color="#ffd48a" />
      <pointLight position={[0, 6, 6]} intensity={14} distance={18} decay={1.5} color="#ffe6b8" />
      <Banquet />
    </group>
  );
}
