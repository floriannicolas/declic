"use client";

import { useState } from "react";
import { formatNumber } from "@/engine/format";
import { Canvas, Caption, Note, Segmented, Slider, figureClass } from "./kit";
import { MiniScene } from "./mini-scene";

const fr = formatNumber;

/** Regular polygon standing for the diaphragm opening. */
function diaphragm(cx: number, cy: number, r: number, blades = 7): string {
  return (
    Array.from({ length: blades }, (_, i) => {
      const a = (i / blades) * Math.PI * 2 - Math.PI / 2;
      return `${i ? "L" : "M"} ${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(" ") + " Z"
  );
}

const APERTURES = [1.8, 2.8, 4, 5.6, 8, 11, 16, 22];

export function ApertureIllustration() {
  const [i, setI] = useState(1);
  const f = APERTURES[i];
  const radius = 52 * (1.8 / f) ** 0.75;
  const light = 1 / (f * f);
  const lightVsF8 = (8 * 8) / (f * f);
  return (
    <figure className={figureClass}>
      <Canvas label={`Diaphragme à ${fr(f)} et son effet sur le fond`}>
        <circle cx="72" cy="105" r="62" fill="#1b1f2a" stroke="#3a4152" strokeWidth="3" />
        <circle cx="72" cy="105" r="56" fill="#0a0c12" />
        <path d={diaphragm(72, 105, radius)} fill="#ffd27a" fillOpacity="0.85" />
        <text x="72" y="196" textAnchor="middle" fontSize="15" fontWeight="600" fill="#ffb020">
          f/{fr(f)}
        </text>
        <svg x="150" y="20" width="200" height="94" viewBox="0 0 360 170">
          <MiniScene blur={Math.max(0, Math.log2(11 / f)) * 3.2} />
        </svg>
        <text x="150" y="140" fontSize="11" fill="#9a9ca3">
          Lumière reçue
        </text>
        <rect x="150" y="148" width="200" height="10" rx="5" fill="#2b2f36" />
        <rect x="150" y="148" width={Math.max(4, 200 * Math.sqrt(light / (1 / (1.8 * 1.8))))} height="10" rx="5" fill="#ffb020" />
        <text x="150" y="182" fontSize="11" fill="#ecebe6">
          {lightVsF8 >= 1 ? `${fr(Math.round(lightVsF8 * 10) / 10)} fois plus qu'à f/8` : `${fr(Math.round((1 / lightVsF8) * 10) / 10)} fois moins qu'à f/8`}
        </text>
      </Canvas>
      <Slider label="Nombre f" min={0} max={APERTURES.length - 1} value={i} onChange={setI} display={`f/${fr(f)}`} />
      <Caption id={String(f)}>
        {f <= 2.8
          ? "Petit nombre f, grand trou : beaucoup de lumière et un fond très flou."
          : f >= 11
            ? "Grand nombre f, petit trou : peu de lumière, et presque tout est net du premier plan à l'horizon."
            : "Valeur intermédiaire : le fond reste reconnaissable, un peu adouci."}
      </Caption>
      <Note>Le nombre f est un diviseur : f/2,8 veut dire un trou de diamètre « focale ÷ 2,8 ». C&apos;est pour ça que petit chiffre = grande ouverture.</Note>
    </figure>
  );
}

const SPEEDS = [
  { label: "1/1000", t: 1 / 1000 },
  { label: "1/250", t: 1 / 250 },
  { label: "1/60", t: 1 / 60 },
  { label: "1/15", t: 1 / 15 },
  { label: "1/2 s", t: 1 / 2 },
] as const;

export function ShutterIllustration() {
  const [id, setId] = useState<string>("1/250");
  const speed = SPEEDS.find((s) => s.label === id)!;
  const smear = Math.min(90, Math.max(0, Math.log2(speed.t * 400)) * 9);
  const duration = (Math.log2(speed.t * 1000) / Math.log2(500)) * 320 + 8;
  return (
    <figure className={figureClass}>
      <Segmented label="Vitesse" options={SPEEDS.map((s) => ({ id: s.label, label: s.label }))} value={id} onChange={setId} />
      <Canvas label={`Cycliste photographié à ${speed.label}`}>
        <svg x="0" y="0" width="360" height="170" viewBox="0 0 360 170">
          <MiniScene subject="cyclist" subjectSmear={smear} light={Math.log2(speed.t * 250)} />
        </svg>
        <text x="20" y="188" fontSize="11" fill="#9a9ca3">
          Obturateur ouvert
        </text>
        <rect x="20" y="194" width={duration} height="8" rx="4" fill="#ffb020" />
      </Canvas>
      <Caption id={id}>
        {speed.t <= 1 / 500
          ? "Vitesse rapide : le cycliste est figé, mais l'image reçoit peu de lumière."
          : speed.t <= 1 / 125
            ? "Vitesse moyenne : le mouvement est presque figé."
            : "Vitesse lente : beaucoup de lumière, mais le cycliste laisse une traînée floue."}
      </Caption>
      <Note>Ici l&apos;ouverture et l&apos;ISO ne bougent pas : plus la pose dure, plus l&apos;image est claire. La vitesse règle à la fois la lumière et le flou de mouvement.</Note>
    </figure>
  );
}

const ISOS = [100, 400, 1600, 6400, 25600];

export function IsoIllustration() {
  const [i, setI] = useState(1);
  const iso = ISOS[i];
  return (
    <figure className={figureClass}>
      <Canvas label={`La même scène à ${iso} ISO`} height={170}>
        <MiniScene light={Math.log2(iso / 1600)} grain={Math.min(1, Math.max(0, Math.log2(iso / 800) / 3))} />
      </Canvas>
      <Slider label="Sensibilité" min={0} max={ISOS.length - 1} value={i} onChange={setI} display={`${iso} ISO`} />
      <Caption id={String(iso)}>
        {iso <= 400
          ? "ISO bas : image propre, mais il faut beaucoup de lumière (ou une pose plus longue)."
          : iso <= 1600
            ? "ISO moyen : on gagne de la luminosité, le grain reste discret."
            : "ISO élevé : l'image s'éclaircit, mais le bruit (grain, couleurs ternes) devient visible."}
      </Caption>
      <Note>Vitesse et ouverture sont fixes ici : seul l&apos;ISO change. Chaque cran du curseur double deux fois la luminosité (+2 stops).</Note>
    </figure>
  );
}

const STOP_COLUMNS = [
  { aperture: "f/2,8", shutter: "1/60", iso: "800" },
  { aperture: "f/4", shutter: "1/125", iso: "400" },
  { aperture: "f/5,6", shutter: "1/250", iso: "200" },
  { aperture: "f/8", shutter: "1/500", iso: "100" },
];

export function StopsIllustration() {
  return (
    <figure className={figureClass}>
      <Canvas label="Un stop de moins à chaque colonne, sur les trois réglages" height={220}>
        {STOP_COLUMNS.map((c, i) => {
          const x = 70 + i * 78;
          const size = 46 / Math.sqrt(2) ** i;
          return (
            <g key={c.aperture}>
              <rect x={x - size / 2} y={30 - size / 2 + 23} width={size} height={size} fill="#ffb020" opacity={0.9} />
              <text x={x} y="94" textAnchor="middle" fontSize="11" fill="#9a9ca3">
                {i === 0 ? "lumière x1" : `÷${2 ** i}`}
              </text>
              <text x={x} y="128" textAnchor="middle" fontSize="14" fontWeight="600" fill="#ecebe6">{c.aperture}</text>
              <text x={x} y="158" textAnchor="middle" fontSize="14" fontWeight="600" fill="#ecebe6">{c.shutter}</text>
              <text x={x} y="188" textAnchor="middle" fontSize="14" fontWeight="600" fill="#ecebe6">{c.iso}</text>
              {i > 0 && <text x={x - 39} y="58" textAnchor="middle" fontSize="16" fill="#ffb020">→</text>}
            </g>
          );
        })}
        <text x="12" y="128" fontSize="10" fill="#9a9ca3">Ouv.</text>
        <text x="12" y="158" fontSize="10" fill="#9a9ca3">Vit.</text>
        <text x="12" y="188" fontSize="10" fill="#9a9ca3">ISO</text>
      </Canvas>
      <Note>
        D&apos;une colonne à la suivante, chaque réglage fait perdre exactement un stop : la lumière est divisée par deux. On peut donc échanger un stop
        d&apos;ouverture contre un stop de vitesse ou d&apos;ISO sans changer l&apos;exposition.
      </Note>
    </figure>
  );
}

export function CompensationIllustration() {
  const [thirds, setThirds] = useState(0);
  const ev = thirds / 3;
  const label = `${ev > 0 ? "+" : ev < 0 ? "−" : ""}${fr(Math.abs(Math.round(ev * 10) / 10))}`;
  return (
    <figure className={figureClass}>
      <Canvas label={`Correction d'exposition à ${label}`} height={210}>
        <svg x="0" y="0" width="360" height="170" viewBox="0 0 360 170">
          <MiniScene light={ev} />
        </svg>
        {Array.from({ length: 13 }, (_, k) => {
          const x = 60 + k * 20;
          const major = (k - 6) % 3 === 0;
          return <rect key={k} x={x - 1} y={major ? 180 : 184} width="2" height={major ? 14 : 10} fill="#9a9ca3" />;
        })}
        {[-2, -1, 0, 1, 2].map((v) => (
          <text key={v} x={60 + (v * 3 + 6) * 20} y="208" textAnchor="middle" fontSize="10" fill="#9a9ca3">
            {v > 0 ? `+${v}` : v}
          </text>
        ))}
        <path d={`M ${60 + (thirds + 6) * 20 - 6} 174 L ${60 + (thirds + 6) * 20 + 6} 174 L ${60 + (thirds + 6) * 20} 182 Z`} fill="#ffb020" />
      </Canvas>
      <Slider label="Correction" min={-6} max={6} value={thirds} onChange={setThirds} display={label} />
      <Caption id={String(Math.sign(thirds))}>
        {thirds < 0
          ? "Correction négative : l'appareil assombrit. Utile pour garder des noirs profonds la nuit ou ne pas brûler un ciel."
          : thirds > 0
            ? "Correction positive : l'appareil éclaircit. Utile sur la neige ou une plage, que la mesure rend trop grises."
            : "À 0, l'appareil vise une luminosité moyenne : parfois juste, parfois trompé par les scènes très claires ou très sombres."}
      </Caption>
      <Note>Elle reste mémorisée après extinction : vérifie qu&apos;elle est revenue à 0 en début de séance.</Note>
    </figure>
  );
}

const CORNERS = [
  { id: "shutter", label: "Vitesse", x: 180, y: 44, effect: "Plus lente : plus de lumière, mais flou de mouvement ou de bougé." },
  { id: "aperture", label: "Ouverture", x: 50, y: 182, effect: "Plus ouverte : plus de lumière, mais moins de profondeur de champ." },
  { id: "iso", label: "ISO", x: 310, y: 182, effect: "Plus haute : image plus claire, mais plus de bruit." },
] as const;

export function TriangleIllustration() {
  const [id, setId] = useState<(typeof CORNERS)[number]["id"]>("shutter");
  const active = CORNERS.find((c) => c.id === id)!;
  return (
    <figure className={figureClass}>
      <Segmented label="Réglage" options={CORNERS.map((c) => ({ id: c.id, label: c.label }))} value={id} onChange={setId} />
      <Canvas label="Le triangle d'exposition" height={232}>
        <path d="M 180 44 L 50 182 L 310 182 Z" fill="none" stroke="#3a4152" strokeWidth="2" />
        <text x="180" y="130" textAnchor="middle" fontSize="13" fontWeight="600" fill="#ecebe6">Exposition</text>
        <text x="180" y="148" textAnchor="middle" fontSize="10" fill="#9a9ca3">quantité de lumière</text>
        {CORNERS.map((c) => (
          <g key={c.id}>
            <circle cx={c.x} cy={c.y} r={c.id === id ? 22 : 16} fill={c.id === id ? "#ffb020" : "#1e2126"} stroke="#ffb020" strokeWidth="2" />
            <text x={c.x} y={c.y + (c.id === "shutter" ? -28 : 36)} textAnchor="middle" fontSize="12" fontWeight="600" fill="#ecebe6">
              {c.label}
            </text>
          </g>
        ))}
      </Canvas>
      <Caption id={id}>{active.effect}</Caption>
      <Note>Chaque sommet ajoute ou retire de la lumière, mais chacun a un effet secondaire sur l&apos;image. Bouger l&apos;un oblige à compenser sur un autre.</Note>
    </figure>
  );
}
