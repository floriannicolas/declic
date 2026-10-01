"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { SPRING } from "../motion-tokens";
import { Canvas, Caption, Note, Segmented, figureClass } from "./kit";
import { MiniScene } from "./mini-scene";

export function SensorIllustration() {
  const [id, setId] = useState<"full" | "apsc">("apsc");
  // Full frame 36 x 24 mm drawn at 7 px/mm, APS-C 23.5 x 15.6 mm.
  const full = { w: 252, h: 168 };
  const apsc = { w: 164.5, h: 109.2 };
  const box = id === "full" ? full : apsc;
  return (
    <figure className={figureClass}>
      <Segmented
        label="Format de capteur"
        options={[
          { id: "full", label: "Plein format" },
          { id: "apsc", label: "APS-C" },
        ]}
        value={id}
        onChange={setId}
      />
      <Canvas label="Ce que voit chaque capteur derrière le même objectif">
        <svg x={(360 - full.w) / 2} y="21" width={full.w} height={full.h} viewBox="0 0 360 240" preserveAspectRatio="xMidYMid slice">
          <MiniScene />
        </svg>
        <motion.rect
          fill="none"
          stroke="#ffb020"
          strokeWidth="3"
          initial={false}
          animate={{ x: 180 - box.w / 2, y: 105 - box.h / 2, width: box.w, height: box.h }}
          transition={SPRING.layout}
        />
        <rect x={(360 - full.w) / 2} y="21" width={full.w} height={full.h} fill="none" stroke="#9a9ca3" strokeDasharray="4 4" />
      </Canvas>
      <Caption id={id}>
        {id === "full"
          ? "Plein format, 24 x 36 mm : le capteur couvre tout le cercle d'image de l'objectif."
          : "APS-C, environ 23,5 x 15,6 mm : le capteur ne garde que le centre. L'image paraît 1,5 fois plus serrée."}
      </Caption>
      <Note>
        C&apos;est le « facteur de recadrage » : sur APS-C, un 35 mm cadre comme un 52 mm en plein format (35 x 1,5). L&apos;objectif ne change pas, seul le
        capteur recadre.
      </Note>
    </figure>
  );
}

const FOCALS = [
  { id: "18", f: 18, label: "18 mm" },
  { id: "35", f: 35, label: "35 mm" },
  { id: "55", f: 55, label: "55 mm" },
] as const;

export function FocalLengthIllustration() {
  const [id, setId] = useState<(typeof FOCALS)[number]["id"]>("18");
  const f = FOCALS.find((x) => x.id === id)!.f;
  // Horizontal angle of view on APS-C.
  const angle = 2 * Math.atan(23.5 / 2 / f);
  const half = angle / 2;
  const length = 110;
  const zoom = f / 18;
  return (
    <figure className={figureClass}>
      <Segmented label="Focale" options={FOCALS} value={id} onChange={setId} />
      <Canvas label={`Angle de champ à ${f} mm`}>
        <motion.path
          initial={false}
          animate={{ d: `M 40 105 L ${40 + length * Math.cos(half)} ${105 - length * Math.sin(half)} L ${40 + length * Math.cos(half)} ${105 + length * Math.sin(half)} Z` }}
          transition={SPRING.layout}
          fill="#ffb020"
          fillOpacity="0.18"
          stroke="#ffb020"
        />
        <rect x="22" y="96" width="20" height="18" rx="3" fill="#9a9ca3" />
        <text x="40" y="196" fontSize="11" fill="#9a9ca3">{Math.round((angle * 180) / Math.PI)}° de champ</text>
        <svg x="170" y="45" width="180" height="120" viewBox="0 0 360 240">
          <motion.g initial={false} animate={{ scale: zoom }} transition={SPRING.layout} style={{ transformOrigin: "180px 120px" }}>
            <svg width="360" height="240" viewBox="0 0 360 170" preserveAspectRatio="xMidYMid slice">
              <MiniScene />
            </svg>
          </motion.g>
          <rect width="360" height="240" fill="none" stroke="#ffb020" strokeWidth="4" />
        </svg>
      </Canvas>
      <Caption id={id}>
        {f === 18
          ? "18 mm : grand angle. On voit large, pratique en intérieur ou pour un paysage."
          : f === 35
            ? "35 mm : proche de la vision humaine sur APS-C. Polyvalent, idéal en rue."
            : "55 mm : plus serré. Le sujet est isolé, bien pour un portrait ou un détail."}
      </Caption>
      <Note>La focale ne change pas la luminosité ni la mise au point : elle change ce qui entre dans le cadre.</Note>
    </figure>
  );
}

/** Deterministic tremor path, drawn around a crosshair. */
function tremor(amplitude: number): string {
  const points = Array.from({ length: 40 }, (_, k) => {
    const t = k / 39;
    const x = 90 + Math.sin(t * 17) * amplitude + Math.sin(t * 41) * amplitude * 0.4;
    const y = 105 + Math.cos(t * 13) * amplitude * 0.8 + Math.sin(t * 29) * amplitude * 0.35;
    return `${k ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  return points.join(" ");
}

export function StabilizationIllustration() {
  const [on, setOn] = useState<"off" | "on">("off");
  const amplitude = on === "on" ? 3 : 22;
  return (
    <figure className={figureClass}>
      <Segmented
        label="Stabilisation"
        options={[
          { id: "off", label: "Sans stabilisation" },
          { id: "on", label: "Avec stabilisation" },
        ]}
        value={on}
        onChange={setOn}
      />
      <Canvas label="Tremblement des mains pendant une pose de 1/8 s">
        <circle cx="90" cy="105" r="70" fill="#1b2338" />
        <line x1="90" x2="90" y1="40" y2="170" stroke="#2b2f36" />
        <line x1="25" x2="155" y1="105" y2="105" stroke="#2b2f36" />
        <motion.path initial={false} animate={{ d: tremor(amplitude) }} transition={SPRING.layout} fill="none" stroke="#ffb020" strokeWidth="1.5" />
        <text x="90" y="198" textAnchor="middle" fontSize="11" fill="#9a9ca3">mouvement de l&apos;image</text>
        <g>
          <text x="265" y="120" textAnchor="middle" fontSize="64" fontWeight="700" fill="#ecebe6" opacity={on === "on" ? 1 : 0.5}>A</text>
          {on === "off" && (
            <text x="273" y="126" textAnchor="middle" fontSize="64" fontWeight="700" fill="#ecebe6" opacity="0.4">A</text>
          )}
          <text x="265" y="198" textAnchor="middle" fontSize="11" fill="#9a9ca3">résultat</text>
        </g>
      </Canvas>
      <Caption id={on}>
        {on === "off"
          ? "Sans stabilisation, l'image danse sur le capteur pendant la pose : les contours se dédoublent."
          : "La stabilisation déplace un élément optique pour compenser : l'image reste quasi immobile, environ 3 stops de gagnés."}
      </Caption>
      <Note>Elle compense tes mains, pas le sujet : une personne qui bouge reste floue à 1/8 s, stabilisation ou non.</Note>
    </figure>
  );
}

export function PanningIllustration() {
  const [id, setId] = useState<"static" | "pan">("pan");
  return (
    <figure className={figureClass}>
      <Segmented
        label="Technique"
        options={[
          { id: "static", label: "Appareil immobile" },
          { id: "pan", label: "Filé" },
        ]}
        value={id}
        onChange={setId}
      />
      <Canvas label={id === "pan" ? "Filé : cycliste net, fond qui file" : "Appareil immobile : cycliste flou, fond net"} height={170}>
        <MiniScene subject="cyclist" subjectSmear={id === "static" ? 70 : 0} backgroundSmear={id === "pan" ? 60 : 0} />
      </Canvas>
      <Caption id={id}>
        {id === "pan"
          ? "On pivote avec le cycliste pendant toute la pose (1/30 s ici) : il reste au même endroit sur le capteur, le décor défile."
          : "À la même vitesse lente, appareil immobile : le décor est net et c'est le cycliste qui laisse une traînée."}
      </Caption>
      <Note>Pivote depuis les hanches, accompagne le mouvement avant et après le déclic. Les premiers essais ratés sont normaux.</Note>
    </figure>
  );
}

const WHO: Record<string, [string, string, string]> = {
  AUTO: ["boîtier", "boîtier", "boîtier"],
  P: ["boîtier", "boîtier", "toi"],
  S: ["toi", "boîtier", "toi"],
  A: ["boîtier", "toi", "toi"],
  M: ["toi", "toi", "toi"],
};

const USAGES: Record<string, string> = {
  AUTO: "AUTO : tout est décidé et verrouillé, même la correction d'exposition. Pratique pour dépanner, pas pour apprendre.",
  P: "P : le boîtier propose un couple vitesse/ouverture, décalable à la molette, et tu gardes la correction d'exposition. Réactif en rue.",
  S: "S : tu fixes la vitesse (figer ou filer un mouvement), le boîtier choisit l'ouverture. Pour le sport et les sujets mobiles.",
  A: "A : tu fixes l'ouverture (profondeur de champ), le boîtier choisit la vitesse. Pour le portrait et le paysage.",
  M: "M : tu choisis tout. Pour le studio avec flashs, la pose longue, ou garder une exposition identique sur une série.",
};

export function ExposureModesIllustration() {
  const [mode, setMode] = useState("A");
  return (
    <figure className={figureClass}>
      <Segmented label="Mode d'exposition" options={Object.keys(WHO).map((m) => ({ id: m, label: m }))} value={mode} onChange={setMode} />
      <Canvas label={`Qui choisit quoi en mode ${mode}`} height={170}>
        {["Vitesse", "Ouverture", "Correction et ISO"].map((label, k) => {
          const y = 22 + k * 50;
          const you = WHO[mode][k] === "toi";
          return (
            <g key={label}>
              <text x="20" y={y + 26} fontSize="13" fill="#ecebe6">{label}</text>
              <motion.rect
                x="200"
                y={y}
                width="140"
                height="40"
                rx="20"
                initial={false}
                animate={{ fill: you ? "#ffb020" : "#1e2126" }}
                transition={{ duration: 0.2 }}
                stroke={you ? "#ffb020" : "#2b2f36"}
              />
              <text x="270" y={y + 25} textAnchor="middle" fontSize="13" fontWeight="600" fill={you ? "#1c1300" : "#9a9ca3"}>
                {you ? "toi" : "le boîtier"}
              </text>
            </g>
          );
        })}
      </Canvas>
      <Caption id={mode}>{USAGES[mode]}</Caption>
    </figure>
  );
}
