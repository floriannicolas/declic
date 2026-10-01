import type { Chapter } from "@/types";

export const guides: NonNullable<Chapter["guides"]> = {
  simulator: {
    title: "Comment régler ?",
    illustration: "triangle",
    paragraphs: [
      "1. Lis l'intention. Elle te dit quel réglage compte le plus : figer ou filer un mouvement, c'est la vitesse. Un fond flou ou tout net, c'est l'ouverture.",
      "2. Règle d'abord ce réglage prioritaire, dans la plage demandée. Regarde l'aperçu : le flou de mouvement ou le flou du fond change en direct.",
      "3. Règle le deuxième réglage de façon raisonnable : une vitesse qui évite le bougé à main levée, ou une ouverture moyenne si elle n'est pas imposée.",
      "4. Termine par l'ISO, pour la luminosité. Image trop sombre : monte l'ISO. Trop claire : baisse-le. Si l'ISO est déjà au minimum et que c'est encore trop clair, accélère la vitesse ou ferme l'ouverture.",
      "L'aperçu est ton posemètre : quand sa luminosité paraît naturelle, l'exposition est proche. Pas de chrono, prends ton temps.",
    ],
    terms: ["exposure-triangle", "stop"],
  },
  shutter: {
    title: "La vitesse",
    illustration: "shutter",
    paragraphs: [
      "C'est la durée pendant laquelle le capteur reçoit la lumière. 1/250 veut dire un deux-cent-cinquantième de seconde, donc 1/30 est plus long que 1/250.",
      "Sur la molette, vers la droite ou vers le haut, la vitesse devient plus rapide : moins de lumière, mouvement mieux figé. Vers la gauche ou le bas : plus de lumière, plus de flou de mouvement.",
      "Repères : 1/1000 pour un sport rapide, 1/500 pour une course, 1/125 pour une personne qui bouge, 1/60 pour un sujet immobile, 1/30 à 1/15 pour un filé, 1 s et plus sur trépied.",
      "À main levée, attention au bougé : vise au moins 1 / (focale x facteur de recadrage), soit 1 / (focale x 1,5) sur un capteur APS-C. La stabilisation permet de descendre plus bas, mais seulement pour un sujet immobile.",
    ],
    terms: ["shutter-speed", "panning", "vr"],
  },
  aperture: {
    title: "L'ouverture",
    illustration: "aperture",
    paragraphs: [
      "C'est la taille du trou dans l'objectif, notée en nombre f. Petit nombre (f/1,8) = grand trou, beaucoup de lumière. Grand nombre (f/16) = petit trou, peu de lumière.",
      "Sur la molette, vers la droite ou vers le haut, on ferme : moins de lumière, plus de zone nette. Vers la gauche ou le bas, on ouvre : plus de lumière, fond plus flou.",
      "Repères : f/1,8 à f/2,8 pour un portrait au fond flou, f/5,6 polyvalent, f/8 à f/11 pour un paysage net partout et le meilleur piqué.",
      "Chaque objectif a ses limites : un zoom n'ouvre pas autant à la focale longue qu'à la focale courte. Si la molette résiste, c'est la limite de l'objectif.",
    ],
    terms: ["aperture", "depth-of-field", "bokeh"],
  },
  iso: {
    title: "L'ISO",
    illustration: "iso",
    paragraphs: [
      "L'ISO amplifie le signal du capteur. Il éclaircit l'image sans changer ni le flou de mouvement ni la profondeur de champ, mais ajoute du bruit.",
      "Sur la molette, vers la droite ou vers le haut, l'ISO monte : image plus claire, plus de grain. Chaque doublement (100, 200, 400...) gagne un stop.",
      "Règle-le en dernier : une fois la vitesse et l'ouverture choisies pour l'intention, monte l'ISO jusqu'à ce que l'aperçu soit bien exposé.",
      "Repères : 100 à 400 en plein jour, 800 à 1600 en intérieur éclairé, 3200 et plus la nuit. Le grain devient visible vers 1600, marqué à partir de 6400.",
    ],
    terms: ["iso", "exposure-triangle"],
  },
  stops: {
    title: "Aide-mémoire des stops",
    illustration: "stops",
    paragraphs: [
      "Un stop, c'est deux fois plus ou deux fois moins de lumière. Pour compter, repère les deux valeurs sur l'échelle pleine et compte les crans entre elles.",
      "Ouvertures : 1 - 1,4 - 2 - 2,8 - 4 - 5,6 - 8 - 11 - 16 - 22. Astuce : un nombre sur deux double (1, 2, 4, 8, 16 et 1,4, 2,8, 5,6, 11, 22). Vers les petits nombres, on gagne de la lumière.",
      "Vitesses : 1/1000 - 1/500 - 1/250 - 1/125 - 1/60 - 1/30 - 1/15 - 1/8 - 1/4 - 1/2 - 1 s. Chaque valeur dure deux fois plus que la précédente (1/125 et 1/60 sont des arrondis de 1/128 et 1/64).",
      "ISO : 100 - 200 - 400 - 800 - 1600 - 3200 - 6400. Doubler l'ISO gagne un stop.",
      "Compenser : si un réglage gagne n stops, un autre doit en perdre n pour garder la même exposition. Ouvrir de 2 stops oblige à accélérer de 2 stops, ou à baisser l'ISO de 2 stops.",
    ],
    terms: ["stop", "aperture", "shutter-speed", "iso"],
  },
};
