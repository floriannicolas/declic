"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { SPRING } from "../motion-tokens";
import { Canvas, Caption, Note, Segmented, figureClass } from "./kit";

function Person({ x, y, scale = 1, color = "#c2533d", blur = 0, id }: { x: number; y: number; scale?: number; color?: string; blur?: number; id: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} filter={blur > 0.1 ? `url(#${id})` : undefined}>
      <path d="M -16 0 Q -15 -34 0 -36 Q 15 -34 16 0 Z" fill={color} />
      <circle cx="0" cy="-46" r="10" fill="#e2ac86" />
    </g>
  );
}

const DOF = [
  { id: "1.8", label: "f/1,8", near: 0.94, far: 1.07 },
  { id: "5.6", label: "f/5,6", near: 0.82, far: 1.3 },
  { id: "16", label: "f/16", near: 0.55, far: 2.6 },
] as const;

export function DepthOfFieldIllustration() {
  const [id, setId] = useState<(typeof DOF)[number]["id"]>("1.8");
  const d = DOF.find((x) => x.id === id)!;
  const focus = 170;
  const toX = (k: number) => 40 + (focus - 40) * k;
  const near = toX(d.near);
  const far = Math.min(350, toX(d.far));
  return (
    <figure className={figureClass}>
      <Segmented label="Ouverture" options={DOF.map((x) => ({ id: x.id, label: x.label }))} value={id} onChange={setId} />
      <Canvas label={`Zone nette à ${d.label}, vue de côté`}>
        <rect x="16" y="104" width="26" height="18" rx="3" fill="#9a9ca3" />
        <rect x="40" y="108" width="8" height="10" fill="#9a9ca3" />
        <motion.rect
          y="40"
          height="130"
          fill="#ffb020"
          fillOpacity="0.16"
          stroke="#ffb020"
          strokeOpacity="0.6"
          initial={false}
          animate={{ x: near, width: far - near }}
          transition={SPRING.layout}
        />
        <line x1={focus} x2={focus} y1="36" y2="174" stroke="#ffb020" strokeDasharray="4 4" />
        <text x={focus} y="30" textAnchor="middle" fontSize="11" fill="#ffb020">plan de mise au point</text>
        <defs>
          <filter id="dof-soft"><feGaussianBlur stdDeviation="2.5" /></filter>
        </defs>
        <Person id="dof-soft" x={110} y={160} scale={0.8} color="#3f5e8a" blur={near > 110 ? 1 : 0} />
        <Person id="dof-soft" x={focus} y={160} />
        <Person id="dof-soft" x={300} y={160} scale={0.7} color="#3b9b6b" blur={far < 300 ? 1 : 0} />
        <line x1="20" x2="350" y1="176" y2="176" stroke="#2b2f36" />
        <text x="110" y="196" textAnchor="middle" fontSize="10" fill="#9a9ca3">devant</text>
        <text x={focus} y="196" textAnchor="middle" fontSize="10" fill="#9a9ca3">sujet</text>
        <text x="300" y="196" textAnchor="middle" fontSize="10" fill="#9a9ca3">derrière</text>
      </Canvas>
      <Caption id={id}>
        {id === "1.8"
          ? "À f/1,8, la zone nette ne fait que quelques dizaines de centimètres : seul le sujet est net."
          : id === "5.6"
            ? "À f/5,6, la zone s'élargit : les personnes proches du sujet commencent à être nettes."
            : "À f/16, presque tout est net, devant comme derrière."}
      </Caption>
      <Note>
        La zone nette s&apos;étend environ deux fois plus derrière le sujet que devant. Elle rétrécit aussi quand on se rapproche du sujet ou qu&apos;on zoome.
      </Note>
    </figure>
  );
}

const METERING = [
  { id: "matrix", label: "Matricielle" },
  { id: "center", label: "Pondérée" },
  { id: "spot", label: "Spot" },
] as const;

export function MeteringIllustration() {
  const [id, setId] = useState<(typeof METERING)[number]["id"]>("matrix");
  return (
    <figure className={figureClass}>
      <Segmented label="Mode de mesure" options={METERING} value={id} onChange={setId} />
      <Canvas label="Zones de mesure sur une personne à contre-jour devant une fenêtre">
        <defs>
          <radialGradient id="metering-center">
            <stop offset="0" stopColor="#ffb020" stopOpacity="0.45" />
            <stop offset="1" stopColor="#ffb020" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="360" height="210" fill="#3a2d24" />
        <rect x="90" y="20" width="180" height="150" fill="#f4efe2" />
        <path d="M 130 210 Q 134 120 180 112 Q 226 120 230 210 Z" fill="#2a1d18" />
        <ellipse cx="180" cy="90" rx="30" ry="36" fill="#4a3428" />
        {id === "matrix" &&
          Array.from({ length: 24 }, (_, k) => (
            <rect key={k} x={8 + (k % 6) * 58} y={8 + Math.floor(k / 6) * 49} width="54" height="45" fill="none" stroke="#ffb020" strokeOpacity="0.8" />
          ))}
        {id === "center" && <circle cx="180" cy="105" r="90" fill="url(#metering-center)" stroke="#ffb020" strokeDasharray="5 5" />}
        {id === "spot" && <circle cx="180" cy="90" r="9" fill="none" stroke="#ffb020" strokeWidth="2.5" />}
      </Canvas>
      <Caption id={id}>
        {id === "matrix"
          ? "Toute l'image est analysée par zones, puis l'appareil fait une moyenne intelligente. Bon réflexe par défaut."
          : id === "center"
            ? "Toute l'image compte, mais le centre pèse beaucoup plus lourd. Pratique pour un sujet centré."
            : "Seul un petit point compte. Placé sur le visage, il l'expose bien, quitte à brûler la fenêtre derrière."}
      </Caption>
      <Note>Ici la fenêtre très claire trompe la mesure matricielle, qui assombrit le visage. La mesure spot sur le visage règle le problème.</Note>
    </figure>
  );
}

const AF = [
  { id: "af-s", label: "AF-S" },
  { id: "af-c", label: "AF-C" },
  { id: "af-a", label: "AF-A" },
] as const;

export function AutofocusIllustration() {
  const [id, setId] = useState<(typeof AF)[number]["id"]>("af-s");
  // Three moments: the subject runs towards the camera.
  const sharp = { "af-s": [true, false, false], "af-c": [true, true, true], "af-a": [true, true, true] }[id];
  const note = { "af-s": ["point", "verrouillé", "verrouillé"], "af-c": ["point", "suit", "suit"], "af-a": ["point", "bouge ? AF-C", "suit"] }[id];
  return (
    <figure className={figureClass}>
      <Segmented label="Mode de mise au point" options={AF} value={id} onChange={setId} />
      <Canvas label={`${id.toUpperCase()} sur un sujet qui s'approche`}>
        <defs>
          <filter id="af-blur"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>
        {[0, 1, 2].map((k) => {
          const x = 12 + k * 116;
          return (
            <g key={k}>
              <rect x={x} y="20" width="104" height="140" rx="6" fill="#1b2338" stroke="#2b2f36" />
              <Person id="af-blur" x={x + 52} y={150} scale={0.75 + k * 0.35} color="#e04848" blur={sharp[k] ? 0 : 1} />
              <rect x={x + 44} y="70" width="16" height="16" fill="none" stroke={sharp[k] ? "#3ddc84" : "#ff6159"} strokeWidth="2" />
              <text x={x + 52} y="180" textAnchor="middle" fontSize="11" fill={sharp[k] ? "#3ddc84" : "#ff6159"}>
                {note[k]}
              </text>
              <text x={x + 52} y="200" textAnchor="middle" fontSize="10" fill="#9a9ca3">
                {["t = 0", "t + 1 s", "t + 2 s"][k]}
              </text>
            </g>
          );
        })}
      </Canvas>
      <Caption id={id}>
        {id === "af-s"
          ? "AF-S verrouille la mise au point dès qu'elle est trouvée. Si le sujet avance, il sort de la zone nette."
          : id === "af-c"
            ? "AF-C recalcule la mise au point en continu tant que tu gardes le déclencheur à mi-course : le sujet reste net."
            : "AF-A commence comme AF-S, puis bascule seul en AF-C s'il détecte que le sujet bouge."}
      </Caption>
      <Note>Le carré représente le collimateur, c&apos;est-à-dire la zone AF. Choisir la zone et choisir le mode (S, C, A) sont deux réglages différents.</Note>
    </figure>
  );
}

const MOTORS = [
  { id: "af-p", label: "AF-P" },
  { id: "af-s", label: "AF-S" },
  { id: "af-d", label: "AF-D" },
] as const;

export function AfMotorIllustration() {
  const [id, setId] = useState<(typeof MOTORS)[number]["id"]>("af-p");
  const inLens = id !== "af-d";
  return (
    <figure className={figureClass}>
      <Segmented label="Type d'objectif" options={MOTORS} value={id} onChange={setId} />
      <Canvas label={`Où se trouve le moteur de mise au point d'un objectif ${id.toUpperCase()}`}>
        <rect x="24" y="50" width="120" height="110" rx="10" fill="#2a2e36" />
        <text x="84" y="185" textAnchor="middle" fontSize="11" fill="#9a9ca3">boîtier</text>
        <rect x="144" y="70" width="170" height="70" rx="8" fill="#3a3f48" />
        <text x="229" y="165" textAnchor="middle" fontSize="11" fill="#9a9ca3">objectif</text>
        {inLens ? (
          <g>
            <rect x="200" y="86" width="56" height="38" rx="6" fill="#ffb020" />
            <text x="228" y="110" textAnchor="middle" fontSize="11" fontWeight="600" fill="#1c1300">
              moteur
            </text>
          </g>
        ) : (
          <g>
            <rect x="96" y="96" width="44" height="18" rx="4" fill="none" stroke="#ff6159" strokeDasharray="4 3" />
            <text x="118" y="132" textAnchor="middle" fontSize="10" fill="#ff6159">pas de moteur</text>
            <line x1="140" y1="105" x2="176" y2="105" stroke="#9a9ca3" strokeWidth="3" strokeDasharray="3 3" />
            <text x="190" y="100" fontSize="10" fill="#9a9ca3">vis d&apos;entraînement</text>
          </g>
        )}
      </Canvas>
      <Caption id={id}>
        {id === "af-p"
          ? "AF-P : moteur pas à pas dans l'objectif. Très silencieux et rapide, idéal en vidéo."
          : id === "af-s"
            ? "AF-S (sur un objectif) : moteur ultrasonique dans l'objectif. L'autofocus marche sur tous les boîtiers."
            : "AF-D : l'objectif n'a pas de moteur, il attend que le boîtier le fasse tourner par une petite vis. Sur un boîtier sans moteur, la mise au point se fait à la main."}
      </Caption>
      <Note>Piège : sur l&apos;objectif, AF-S et AF-P désignent un moteur. Dans le menu du boîtier, AF-S désigne un mode de mise au point. Même sigle, deux sens.</Note>
    </figure>
  );
}
