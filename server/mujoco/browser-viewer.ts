/**
 * Snowboard Big Air Browser Viewer HTML Generator (JavaScript)
 *
 * Ported from snowboard/src/snowboard/browser_viewer.py
 * The HTML output is identical — it contains embedded Three.js replay code.
 */

import fs from 'fs';
import path from 'path';

export function buildBrowserViewerHtml(replayFilename = 'replay.json'): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Snowboard MuJoCo Web Replay</title>
  <style>
    body {
      margin: 0;
      overflow: hidden;
      background: #e8edf2;
      color: #17202a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    #canvas-container {
      position: fixed;
      inset: 0;
    }
    #fallback-canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
    #hud {
      position: fixed;
      left: 16px;
      right: 16px;
      bottom: 16px;
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 12px;
      align-items: center;
      padding: 10px 12px;
      background: rgba(255, 255, 255, 0.88);
      border: 1px solid rgba(23, 32, 42, 0.18);
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }
    button {
      min-width: 72px;
      border: 1px solid #263747;
      border-radius: 6px;
      padding: 7px 12px;
      background: #263747;
      color: white;
      font: inherit;
      cursor: pointer;
    }
    input[type="range"] {
      width: 100%;
    }
    #timecode {
      font-variant-numeric: tabular-nums;
      font-size: 13px;
      color: #34495e;
    }
    .point-label {
      position: fixed;
      transform: translate(-50%, -100%);
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.92);
      color: #d20000;
      font-size: 12px;
      font-weight: 700;
      pointer-events: none;
      white-space: nowrap;
      border: 1px solid rgba(210, 0, 0, 0.25);
    }
  </style>
</head>
<body>
  <div id="canvas-container"><canvas id="fallback-canvas"></canvas></div>
  <div id="labels"></div>
  <div id="hud">
    <button id="playPause">Pause</button>
    <input id="scrubber" type="range" min="0" max="1000" value="0" />
    <span id="timecode">0.00s</span>
  </div>
  <script>
    window.__threeReplayReady = false;
    setTimeout(async () => {
      if (window.__threeReplayReady) return;
      const replay = await fetch("${replayFilename}").then((response) => response.json());
      const frames = replay.frames;
      const duration = frames[frames.length - 1].time;
      const canvas = document.getElementById("fallback-canvas");
      const ctx = canvas.getContext("2d");
      const playPause = document.getElementById("playPause");
      const scrubber = document.getElementById("scrubber");
      const timecode = document.getElementById("timecode");
      const labelRoot = document.getElementById("labels");
      let playing = true;
      let replayTime = 0;
      let lastTimestamp = performance.now();
      const xs = replay.config_points.map((point) => point.position[0]);
      const zs = replay.config_points.map((point) => point.position[2]);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minZ = Math.min(...zs);
      const maxZ = Math.max(...zs);

      const labelItems = replay.config_points.map((point) => {
        const element = document.createElement("span");
        element.className = "point-label";
        element.textContent = point.label;
        labelRoot.appendChild(element);
        return { point, element };
      });

      function resize() {
        canvas.width = window.innerWidth * window.devicePixelRatio;
        canvas.height = window.innerHeight * window.devicePixelRatio;
        ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
      }

      function sx(x) {
        return 64 + ((x - minX) / (maxX - minX)) * (window.innerWidth - 128);
      }

      function sz(z) {
        return window.innerHeight - 105 - ((z - minZ) / (maxZ - minZ)) * (window.innerHeight - 190);
      }

      function sampleFrame(time) {
        if (time <= frames[0].time) return [frames[0], frames[0], 0];
        for (let i = 0; i < frames.length - 1; i += 1) {
          const a = frames[i];
          const b = frames[i + 1];
          if (a.time <= time && time <= b.time) {
            const span = Math.max(b.time - a.time, 0.000001);
            return [a, b, (time - a.time) / span];
          }
        }
        const last = frames[frames.length - 1];
        return [last, last, 0];
      }

      function draw(time) {
        const [a, b, alpha] = sampleFrame(time);
        const x = a.position[0] + (b.position[0] - a.position[0]) * alpha;
        const y = a.position[1] + (b.position[1] - a.position[1]) * alpha;
        const z = a.position[2] + (b.position[2] - a.position[2]) * alpha;
        const bodyControl = applySafeLandingPose(a, b, alpha);
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.fillStyle = "#e8edf2";
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.lineWidth = 6;
        ctx.strokeStyle = "#f7fbff";
        ctx.beginPath();
        replay.config_points.forEach((item, index) => {
          const px = sx(item.position[0]);
          const pz = sz(item.position[2]);
          if (index === 0) ctx.moveTo(px, pz);
          else ctx.lineTo(px, pz);
        });
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#9fb1bf";
        ctx.stroke();
        for (const item of labelItems) {
          const px = sx(item.point.position[0]);
          const pz = sz(item.point.position[2]);
          ctx.fillStyle = "#ff0000";
          ctx.beginPath();
          ctx.arc(px, pz, 5, 0, Math.PI * 2);
          ctx.fill();
          item.element.style.left = \`\${px}px\`;
          item.element.style.top = \`\${pz - 9}px\`;
        }
        const boardX = sx(x);
        const boardZ = sz(z);
        ctx.save();
        ctx.translate(boardX, boardZ - y * 10);
        ctx.rotate(-0.18 - bodyControl.forward_lean * 0.35);
        ctx.fillStyle = "#111820";
        ctx.fillRect(-20, -4, 40, 8);
        ctx.fillStyle = "#1253d8";
        const torsoHeight = 26 - bodyControl.compression * 10;
        const torsoTop = -32 + bodyControl.compression * 13;
        ctx.fillRect(-7, torsoTop, 14, torsoHeight);
        ctx.fillStyle = "#f0b56d";
        ctx.beginPath();
        ctx.arc(0, torsoTop - 8, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        scrubber.value = String((time / duration) * 1000);
        timecode.textContent = \`\${time.toFixed(2)}s\`;
      }

      function applySafeLandingPose(a, b, alpha) {
        const start = a.body_control || { compression: 0, forward_lean: 0 };
        const end = b.body_control || { compression: 0, forward_lean: 0 };
        return {
          compression: start.compression + (end.compression - start.compression) * alpha,
          forward_lean: start.forward_lean + (end.forward_lean - start.forward_lean) * alpha,
        };
      }

      function animate(timestamp) {
        const delta = (timestamp - lastTimestamp) / 1000;
        lastTimestamp = timestamp;
        if (playing) replayTime = (replayTime + delta) % duration;
        draw(replayTime);
        requestAnimationFrame(animate);
      }

      playPause.addEventListener("click", () => {
        playing = !playing;
        playPause.textContent = playing ? "Pause" : "Play";
      });
      scrubber.addEventListener("input", () => {
        playing = false;
        playPause.textContent = "Play";
        replayTime = (Number(scrubber.value) / 1000) * duration;
        draw(replayTime);
      });
      window.addEventListener("resize", resize);
      resize();
      requestAnimationFrame(animate);
    }, 900);
  </script>
  <script type="module">
    import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";
    import { OrbitControls } from "https://unpkg.com/three@0.164.1/examples/jsm/controls/OrbitControls.js";

    const container = document.getElementById("canvas-container");
    const labelRoot = document.getElementById("labels");
    const playPause = document.getElementById("playPause");
    const scrubber = document.getElementById("scrubber");
    const timecode = document.getElementById("timecode");
    const replay = await fetch("${replayFilename}").then((response) => response.json());
    const frames = replay.frames;
    const duration = frames[frames.length - 1].time;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe8edf2);
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(-12, -38, 22);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.getElementById("fallback-canvas").style.display = "none";
    container.appendChild(renderer.domElement);
    window.__threeReplayReady = true;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(-8, 0, 10);
    controls.update();

    scene.add(new THREE.HemisphereLight(0xffffff, 0x7b8794, 2.4));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(-10, -15, 30);
    scene.add(sun);

    const terrainGeometry = new THREE.BufferGeometry();
    terrainGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(replay.profile_vertices.flat(), 3)
    );
    terrainGeometry.setIndex(replay.profile_faces.flat());
    terrainGeometry.computeVertexNormals();
    const terrain = new THREE.Mesh(
      terrainGeometry,
      new THREE.MeshStandardMaterial({ color: 0xf7fbff, roughness: 0.72, metalness: 0.02, side: THREE.DoubleSide })
    );
    scene.add(terrain);

    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const markerGeometry = new THREE.SphereGeometry(0.13, 16, 16);
    const labelItems = replay.config_points.map((point) => {
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(point.position[0], -2.75, point.position[2] + 0.2);
      scene.add(marker);
      const element = document.createElement("span");
      element.className = "point-label";
      element.textContent = point.label;
      labelRoot.appendChild(element);
      return { position: marker.position, element };
    });

    const board = new THREE.Mesh(
      new THREE.BoxGeometry(1.65, 0.28, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x111820, roughness: 0.45 })
    );
    const rider = new THREE.Group();
    rider.add(board);
    const torso = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.16, 0.55, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0x1253d8 })
    );
    torso.position.set(-0.05, 0, 0.55);
    rider.add(torso);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 18, 18),
      new THREE.MeshStandardMaterial({ color: 0xf0b56d })
    );
    head.position.set(-0.08, 0, 1.02);
    rider.add(head);
    scene.add(rider);

    let playing = true;
    let replayTime = 0;
    let lastTimestamp = performance.now();

    function sampleFrame(time) {
      if (time <= frames[0].time) return [frames[0], frames[0], 0];
      for (let i = 0; i < frames.length - 1; i += 1) {
        const a = frames[i];
        const b = frames[i + 1];
        if (a.time <= time && time <= b.time) {
          const span = Math.max(b.time - a.time, 0.000001);
          return [a, b, (time - a.time) / span];
        }
      }
      const last = frames[frames.length - 1];
      return [last, last, 0];
    }

    function applyReplayPose(time) {
      const [a, b, alpha] = sampleFrame(time);
      const pa = new THREE.Vector3(...a.position);
      const pb = new THREE.Vector3(...b.position);
      const qa = new THREE.Quaternion(...a.quaternion);
      const qb = new THREE.Quaternion(...b.quaternion);
      rider.position.copy(pa.lerp(pb, alpha));
      rider.quaternion.copy(qa.slerp(qb, alpha));
      applySafeLandingPose(a, b, alpha);
      scrubber.value = String((time / duration) * 1000);
      timecode.textContent = \`\${time.toFixed(2)}s\`;
    }

    function applySafeLandingPose(a, b, alpha) {
      const start = a.body_control || { compression: 0, forward_lean: 0 };
      const end = b.body_control || { compression: 0, forward_lean: 0 };
      const compression = start.compression + (end.compression - start.compression) * alpha;
      const forwardLean = start.forward_lean + (end.forward_lean - start.forward_lean) * alpha;
      const extra = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(-Math.PI * 0.08 * forwardLean, 0, 0)
      );
      rider.quaternion.multiply(extra);
      torso.position.z = 0.55 - 0.22 * compression;
      head.position.z = 1.02 - 0.28 * compression;
    }

    function updateLabels() {
      const rect = renderer.domElement.getBoundingClientRect();
      for (const item of labelItems) {
        const screen = item.position.clone().project(camera);
        item.element.style.left = \`\${rect.left + (screen.x * 0.5 + 0.5) * rect.width}px\`;
        item.element.style.top = \`\${rect.top + (-screen.y * 0.5 + 0.5) * rect.height - 8}px\`;
        item.element.style.display = screen.z < 1 ? "block" : "none";
      }
    }

    function animate(timestamp) {
      const delta = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;
      if (playing) replayTime = (replayTime + delta) % duration;
      applyReplayPose(replayTime);
      updateLabels();
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    playPause.addEventListener("click", () => {
      playing = !playing;
      playPause.textContent = playing ? "Pause" : "Play";
    });
    scrubber.addEventListener("input", () => {
      playing = false;
      playPause.textContent = "Play";
      replayTime = (Number(scrubber.value) / 1000) * duration;
      applyReplayPose(replayTime);
    });
    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    applyReplayPose(0);
    requestAnimationFrame(animate);
  </script>
</body>
</html>`;
}

export function writeBrowserViewerHtml(outputPath: string, replayFilename = 'replay.json'): string {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, buildBrowserViewerHtml(replayFilename), 'utf-8');
  return outputPath;
}
