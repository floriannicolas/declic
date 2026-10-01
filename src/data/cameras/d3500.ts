import type { Camera } from "@/types";

export const d3500: Camera = {
  id: "d3500",
  brand: "Nikon",
  model: "D3500",
  sensor: { format: "APS-C", megapixels: 24, cropFactor: 1.5 },
  iso: {
    min: 100,
    max: 25600,
    scale: [
      100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000,
      5000, 6400, 8000, 10000, 12800, 16000, 20000, 25600,
    ],
  },
  shutter: {
    scale: [
      "30 s", "25 s", "20 s", "15 s", "13 s", "10 s", "8 s", "6 s", "5 s", "4 s", "3 s", "2,5 s",
      "2 s", "1,6 s", "1,3 s", "1 s", "1/1,3", "1/1,6", "1/2", "1/2,5", "1/3", "1/4", "1/5", "1/6",
      "1/8", "1/10", "1/13", "1/15", "1/20", "1/25", "1/30", "1/40", "1/50", "1/60", "1/80",
      "1/100", "1/125", "1/160", "1/200", "1/250", "1/320", "1/400", "1/500", "1/640", "1/800",
      "1/1000", "1/1250", "1/1600", "1/2000", "1/2500", "1/3200", "1/4000",
    ],
  },
  aperture: {
    scale: [
      1.4, 1.6, 1.8, 2, 2.2, 2.5, 2.8, 3.2, 3.5, 4, 4.5, 5, 5.6, 6.3, 7.1, 8, 9, 10, 11, 13, 14, 16,
      18, 20, 22, 25, 29, 32,
    ],
  },
  burstFps: 5,
  afPoints: 11,
  flashSync: "1/200",
  modes: ["AUTO", "scene", "P", "S", "A", "M", "GUIDE"],
  hasAfMotor: false,
  lenses: [
    {
      id: "18-55",
      name: "AF-P DX 18-55 mm f/3.5-5.6 G VR",
      role: "standard-zoom",
      focalLengths: [18, 24, 35, 45, 55],
      maxApertureByFocal: { 18: 3.5, 24: 4, 35: 4.5, 45: 5, 55: 5.6 },
      minAperture: 22,
      stabilized: true,
      stabilizationStops: 3,
      retractable: true,
    },
    {
      id: "35",
      name: "AF-S DX 35 mm f/1.8 G",
      role: "fast-prime",
      focalLengths: [35],
      maxApertureByFocal: { 35: 1.8 },
      minAperture: 22,
      stabilized: false,
    },
  ],
  screen: {
    layout: ["shutter", "aperture", "iso"],
    captions: { shutter: "Vitesse", aperture: "Ouverture", iso: "ISO" },
  },
  controls: {
    quickSettings: "i",
    menu: "MENU",
    back: "MENU",
    exposureCompensation: "+/-",
    dial: "molette de commande",
    help: "?",
  },
  vocabulary: { autoAf: "AF-A", stabilization: "VR", connectivity: "SnapBridge" },
  questions: [
    {
      id: "auto-iso-cap",
      prompt: "Où règle-t-on l'ISO automatique avec un plafond ?",
      answer: "MENU > Prise de vue > Sensibilité ISO > Contrôle de la sensibilité auto > Sensibilité maximale",
      distractors: [
        "Bouton i > ISO > Auto, le plafond est fixé à 3200",
        "MENU > Configuration > Sensibilité ISO > Plafond",
        "Maintenir +/- et tourner la molette de commande",
      ],
      explanation:
        "Le plafond se règle dans le menu Prise de vue, sous Contrôle de la sensibilité auto, ligne Sensibilité maximale. L'appareil monte l'ISO seul sans jamais dépasser cette valeur.",
      keyword: "Sensibilité maximale",
    },
    {
      id: "back-button",
      prompt: "Quel bouton sert de retour en arrière dans les menus ?",
      answer: "MENU",
      distractors: ["Le bouton de lecture", "Le bouton i", "Un bouton « back » dédié, à gauche de l'écran"],
      explanation: "Il n'y a pas de bouton « back » sur le D3500 : on remonte d'un niveau avec MENU.",
      keyword: "MENU",
    },
    {
      id: "exposure-compensation",
      prompt: "Comment applique-t-on une correction d'exposition ?",
      answer: "Maintenir le bouton +/- et tourner la molette de commande",
      distractors: [
        "Appuyer plusieurs fois sur +/- sans toucher à la molette",
        "Tourner la molette de commande seule en mode A",
        "Passer par MENU > Prise de vue > Exposition",
      ],
      explanation:
        "On maintient +/- enfoncé et on tourne la molette de commande. Attention : la correction reste mémorisée même après extinction.",
      keyword: "maintient +/- enfoncé",
    },
    {
      id: "kit-lens-vr",
      prompt: "Où active-t-on la stabilisation du 18-55 AF-P ?",
      answer: "Dans le menu Prise de vue, Réduction de vibration",
      distractors: [
        "Avec l'interrupteur VR sur le fût de l'objectif",
        "Elle est toujours active et ne se désactive pas",
        "Dans le menu Configuration, Objectif",
      ],
      explanation:
        "Cet objectif n'a pas d'interrupteur physique : la VR se règle uniquement dans le menu Prise de vue, ligne Réduction de vibration.",
      keyword: "pas d'interrupteur physique",
    },
    {
      id: "aperture-in-a",
      prompt: "Comment change-t-on l'ouverture en mode A ?",
      answer: "En tournant la molette de commande, sans maintenir aucun bouton",
      distractors: [
        "En maintenant +/- et en tournant la molette de commande",
        "En tournant la bague de l'objectif",
        "Par le bouton i, ligne Ouverture",
      ],
      explanation:
        "En mode A, la molette de commande agit directement sur l'ouverture. Le +/- n'est nécessaire qu'en mode M, pour passer de la vitesse à l'ouverture.",
      keyword: "directement sur l'ouverture",
    },
    {
      id: "kit-lens-55mm",
      prompt: "Pourquoi ne peut-on pas atteindre f/3,5 à 55 mm avec le 18-55 ?",
      answer: "Son ouverture maximale varie avec la focale : f/3,5 à 18 mm, f/5,6 à 55 mm",
      distractors: [
        "Il faut d'abord désactiver la VR",
        "Le boîtier bloque f/3,5 en dehors du mode A",
        "f/3,5 n'est accessible qu'en ISO 100",
      ],
      explanation:
        "Le 18-55 est un zoom à ouverture variable : plus on zoome, plus son ouverture maximale diminue. À 55 mm, f/5,6 est le maximum.",
      keyword: "ouverture variable",
    },
    {
      id: "iso-a",
      prompt: "Que signifie « ISO-A » sur l'écran ?",
      answer: "Le contrôle automatique de la sensibilité est actif",
      distractors: [
        "Le boîtier est en mode A, priorité ouverture",
        "L'ISO est bloqué à sa valeur minimale",
        "La réduction du bruit est activée",
      ],
      explanation:
        "ISO-A indique que le contrôle automatique de la sensibilité est activé : l'ISO bougera seul, jusqu'au plafond choisi.",
      keyword: "contrôle automatique de la sensibilité",
    },
    {
      id: "retracted-lens",
      prompt: "Que se passe-t-il si l'objectif rétractable n'est pas déployé ?",
      answer: "Le boîtier affiche une erreur et refuse de déclencher",
      distractors: [
        "La photo est prise à 18 mm par défaut",
        "L'objectif se déploie tout seul",
        "La photo est prise mais floue",
      ],
      explanation:
        "Tant que le 18-55 rétractable est verrouillé, le boîtier affiche un message d'erreur et ne déclenche pas. Il faut tourner la bague de zoom pour le déployer.",
      keyword: "ne déclenche pas",
    },
    {
      id: "max-shutter",
      prompt: "Quelle est la vitesse d'obturation la plus rapide du D3500 ?",
      answer: "1/4000 s",
      distractors: ["1/8000 s", "1/2000 s", "1/200 s"],
      explanation:
        "Le D3500 monte à 1/4000 s. En plein soleil à grande ouverture, cette limite peut obliger à fermer un peu le diaphragme. Le 1/200 s est la vitesse de synchro flash.",
      keyword: "1/4000 s",
    },
    {
      id: "burst",
      prompt: "Combien d'images par seconde en rafale ?",
      answer: "5",
      distractors: ["3", "8", "11"],
      explanation: "La rafale du D3500 est de 5 images par seconde. 11, c'est le nombre de collimateurs AF.",
      keyword: "5 images par seconde",
    },
    {
      id: "af-modes",
      prompt: "Quel mode de mise au point pour un sujet fixe ? Et pour un sujet mobile ?",
      answer: "AF-S pour le sujet fixe, AF-C pour le sujet mobile",
      distractors: [
        "AF-C pour le sujet fixe, AF-S pour le sujet mobile",
        "AF-P pour le sujet fixe, AF-S pour le sujet mobile",
        "Mesure spot pour le sujet fixe, AF-A pour le sujet mobile",
      ],
      explanation:
        "AF-S verrouille le point une fois trouvé, idéal pour un sujet immobile. AF-C le recalcule en continu pour suivre un sujet qui bouge. AF-A choisit seul entre les deux.",
      keyword: "AF-S verrouille",
    },
    {
      id: "prime-switch",
      prompt: "À quoi sert le sélecteur M/A et M du 35 mm ?",
      answer: "M/A : autofocus avec reprise manuelle en tournant la bague. M : mise au point manuelle seule",
      distractors: [
        "M/A : mode manuel ou automatique du boîtier. M : mode M forcé",
        "M/A : mesure matricielle ou automatique. M : mesure manuelle",
        "Il active ou coupe la stabilisation",
      ],
      explanation:
        "En M/A, l'autofocus travaille et on peut retoucher le point à la bague à tout moment. En M, seule la bague fait la mise au point.",
      keyword: "retoucher le point à la bague",
    },
    {
      id: "micro-usb",
      prompt: "Le port micro USB permet-il de recharger la batterie ?",
      answer: "Non, il sert uniquement au transfert de données",
      distractors: [
        "Oui, avec n'importe quel chargeur de téléphone",
        "Oui, mais seulement boîtier éteint",
        "Oui, en activant l'option dans le menu Configuration",
      ],
      explanation:
        "La batterie du D3500 se charge uniquement dans son chargeur externe. Le micro USB ne transporte que des données.",
      keyword: "chargeur externe",
    },
    {
      id: "auto-flash",
      prompt: "Dans quels modes le flash intégré se lève-t-il automatiquement ?",
      answer: "AUTO et modes scène uniquement",
      distractors: ["Dans tous les modes", "P, S, A et M", "Uniquement en GUIDE"],
      explanation:
        "Le flash ne sort seul qu'en AUTO et dans les modes scène. En P, S, A, M et GUIDE, il faut appuyer sur le bouton du flash.",
      keyword: "AUTO et dans les modes scène",
    },
    {
      id: "focus-dot",
      prompt: "Que montre le point vert en bas à gauche du viseur ?",
      answer: "La mise au point est confirmée",
      distractors: ["La batterie est chargée", "L'exposition est correcte", "La stabilisation est active"],
      explanation:
        "Le point vert s'allume quand la mise au point est faite. On peut alors enfoncer le déclencheur à fond.",
      keyword: "mise au point est faite",
    },
    {
      id: "connectivity",
      prompt: "Comment le D3500 se connecte-t-il à un smartphone ?",
      answer: "En Bluetooth, via l'application SnapBridge",
      distractors: ["En Wi-Fi direct", "Par NFC uniquement", "Il ne peut pas se connecter à un smartphone"],
      explanation: "Le D3500 n'a pas de Wi-Fi : il utilise le Bluetooth basse consommation avec SnapBridge.",
      keyword: "pas de Wi-Fi",
    },
    {
      id: "af-d-lens",
      prompt: "Un vieil objectif Nikon AF-D se monte sur le D3500. Que se passe-t-il pour la mise au point ?",
      answer: "Elle se fait à la main : le boîtier n'a pas de moteur autofocus",
      distractors: [
        "Elle fonctionne normalement mais plus lentement",
        "Elle fonctionne seulement en AF-C",
        "L'objectif ne peut pas se monter",
      ],
      explanation:
        "Le D3500 n'a pas de moteur AF intégré. Seuls les objectifs AF-S et AF-P, qui ont leur propre moteur, font la mise au point automatique.",
      keyword: "pas de moteur AF intégré",
    },
    {
      id: "aperture-in-m",
      prompt: "En mode M, comment change-t-on l'ouverture ?",
      answer: "En maintenant +/- et en tournant la molette de commande",
      distractors: [
        "En tournant la molette de commande seule",
        "Par MENU > Prise de vue > Ouverture",
        "En tournant la bague de mise au point",
      ],
      explanation:
        "Le D3500 n'a qu'une molette. En M, elle règle la vitesse seule, et l'ouverture quand on maintient +/-.",
      keyword: "qu'une molette",
    },
    {
      id: "program-shift",
      prompt: "En mode P, que fait la molette de commande ?",
      answer: "Elle décale le couple vitesse/ouverture sans changer l'exposition",
      distractors: ["Elle change l'ISO", "Elle applique une correction d'exposition", "Rien, le mode P bloque tout"],
      explanation:
        "C'est le décalage du programme : l'appareil propose un couple, et la molette en choisit un autre équivalent, plus ouvert ou plus rapide. Un astérisque apparaît à côté du P.",
      keyword: "décalage du programme",
    },
    {
      id: "flash-sync",
      prompt: "Avec le flash intégré, quelle est la vitesse la plus rapide utilisable ?",
      answer: "1/200 s",
      distractors: ["1/4000 s", "1/60 s", "1/1000 s"],
      explanation:
        "La vitesse de synchronisation flash est de 1/200 s. Au-delà, le rideau de l'obturateur masquerait une partie de l'image pendant l'éclair.",
      keyword: "synchronisation flash",
    },
    {
      id: "center-weighted",
      prompt: "Sur le D3500, peut-on régler le diamètre de la zone de mesure pondérée centrale ?",
      answer: "Non, elle n'est pas paramétrable sur ce boîtier",
      distractors: [
        "Oui, dans MENU > Réglages perso > Zone pondérée centrale",
        "Oui, de 6 à 13 mm avec la molette",
        "Oui, mais uniquement en mode M",
      ],
      explanation:
        "Sur le D3500, la mesure pondérée centrale a une zone fixe. Le support du club laisse entendre le contraire : ce réglage n'existe que sur des boîtiers plus haut de gamme.",
      keyword: "zone fixe",
    },
    {
      id: "help-button",
      prompt: "Dans un menu, à quoi sert le bouton « ? » ?",
      answer: "Il affiche une aide sur l'option sélectionnée",
      distractors: ["Il réinitialise l'option", "Il revient au menu précédent", "Il protège la photo affichée"],
      explanation: "Le bouton ? affiche une courte aide contextuelle sur la ligne de menu en surbrillance.",
      keyword: "aide contextuelle",
    },
  ],
};
