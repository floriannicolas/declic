import type { Chapter } from "@/types";

export const chapter1: Chapter = {
  id: "chapter-1",
  number: 1,
  title: "Les bases de l'exposition et la mise au point",
  summary: "Triangle d'exposition, stops, modes P, S, A, M, mesure de la lumière et autofocus.",

  scenarios: [
    {
      id: "panning-cyclist",
      title: "Filé sur un cycliste",
      situation:
        "Un cycliste passe devant toi sur un boulevard. Il fait encore jour, mais le soleil est couché.",
      intent: "Tu veux un filé : le cycliste net, le fond qui file.",
      lens: { role: "standard-zoom", focalLength: 24 },
      ev: 10,
      support: "handheld",
      constraints: [
        {
          setting: "shutter",
          slowest: 1 / 15,
          fastest: 1 / 40,
          message:
            "Pour un filé, la vitesse doit rester entre 1/40 et 1/15 s. Plus rapide, le fond ne file pas. Plus lente, le cycliste devient flou lui aussi.",
        },
        {
          setting: "iso",
          max: 1600,
          message: "Inutile de dépasser 1600 ISO : avec une vitesse aussi lente, la lumière ne manque pas.",
        },
      ],
      preview: {
        ambience: "dusk",
        subject: "cyclist",
        motion: { type: "panning", slowest: 1 / 15, fastest: 1 / 40 },
      },
      explanation:
        "On suit le cycliste avec l'appareil pendant toute la pose : il reste immobile par rapport au capteur pendant que le décor défile. C'est la vitesse lente qui fait filer le fond.",
      keyword: "vitesse lente qui fait filer le fond",
    },
    {
      id: "golf-swing",
      title: "Figer un swing de golf",
      situation: "Un matin ensoleillé sur un parcours, un golfeur prépare son swing à quelques mètres.",
      intent: "Tu veux figer le club en plein mouvement, sans aucun flou.",
      lens: { role: "standard-zoom", focalLength: 55 },
      ev: 14,
      support: "handheld",
      constraints: [
        {
          setting: "shutter",
          slowest: 1 / 1000,
          message: "Un swing est très rapide : sous 1/1000 s, la tête du club laisse une traînée.",
        },
      ],
      preview: {
        ambience: "daylight",
        subject: "golfer",
        motion: { type: "subject", freezeAt: 1 / 1000, direction: "horizontal" },
      },
      explanation:
        "Un mouvement rapide demande une vitesse courte. À 55 mm, le {lens} ouvre au mieux à f/{maxAperture} : la lumière du matin permet 1/1000 s en relevant à peine l'ISO, vers 200.",
      keyword: "vitesse courte",
    },
    {
      id: "portrait-blur",
      title: "Portrait avec fond flou",
      situation: "Ton amie pose à l'ombre d'un arbre, devant une haie à une dizaine de mètres.",
      intent: "Tu veux son visage net et le fond bien flou.",
      lens: { role: "fast-prime", focalLength: 35 },
      ev: 11,
      support: "handheld",
      constraints: [
        {
          setting: "aperture",
          widest: 1.8,
          narrowest: 2.8,
          message: "Pour un fond flou, il faut ouvrir grand : entre f/1,8 et f/2,8.",
        },
        {
          setting: "shutter",
          slowest: 1 / 60,
          message: "En dessous de 1/60 s, le moindre mouvement du modèle ou de tes mains se verra.",
        },
      ],
      preview: { ambience: "overcast", subject: "portrait", motion: { type: "none" } },
      explanation:
        "Une grande ouverture réduit la profondeur de champ. Mais l'ouverture ne suffit pas : éloigne le sujet du fond et rapproche-toi de lui, c'est ce qui creuse vraiment l'écart de netteté.",
      keyword: "réduit la profondeur de champ",
    },
    {
      id: "city-landscape",
      title: "Paysage urbain net partout",
      situation: "Du haut d'un parking, la ville s'étend sous un plein soleil de midi.",
      intent: "Tu veux que tout soit net, du garde-corps au premier plan jusqu'aux toits au loin.",
      lens: { role: "standard-zoom", focalLength: 18 },
      ev: 15,
      support: "handheld",
      constraints: [
        {
          setting: "aperture",
          widest: 8,
          narrowest: 11,
          message: "Pour une grande profondeur de champ, ferme entre f/8 et f/11.",
        },
        {
          setting: "iso",
          max: 100,
          message: "Avec autant de lumière, reste à 100 ISO : aucun bruit, dynamique maximale.",
        },
      ],
      preview: { ambience: "daylight", subject: "buildings", motion: { type: "none" } },
      explanation:
        "Fermer le diaphragme agrandit la zone de netteté. Entre f/8 et f/11, l'objectif donne aussi son meilleur piqué : au-delà, la diffraction commence à adoucir l'image.",
      keyword: "meilleur piqué",
    },
    {
      id: "blue-hour-mural",
      title: "Fresque de rue à l'heure bleue",
      situation: "Le soleil vient de disparaître, une grande fresque murale est encore lisible. Pas de flash.",
      intent: "Tu veux la fresque nette, à main levée, avec le bleu du ciel.",
      lens: { role: "standard-zoom", focalLength: 18 },
      ev: 8,
      support: "handheld",
      constraints: [
        {
          setting: "shutter",
          slowest: 1 / 30,
          message: "À main levée, ne descends pas sous 1/30 s.",
        },
        {
          setting: "iso",
          max: 3200,
          message: "Au-delà de 3200 ISO, le bruit devient vraiment gênant sur ce capteur.",
        },
      ],
      preview: { ambience: "blue-hour", subject: "mural", motion: { type: "none" } },
      explanation:
        "À f/{maxAperture}, c'est jouable : la {stabilization} aide, et s'appuyer contre un mur ou un poteau stabilise encore plus. Monte l'ISO juste ce qu'il faut.",
      keyword: "s'appuyer contre un mur",
    },
    {
      id: "light-trails",
      title: "Traînées lumineuses de voitures",
      situation: "La nuit, au-dessus d'un carrefour, l'appareil est posé sur la rambarde d'un pont.",
      intent: "Tu veux que les phares deviennent de longues traînées de lumière.",
      lens: { role: "standard-zoom", focalLength: 18 },
      ev: 6,
      support: "tripod",
      constraints: [
        {
          setting: "shutter",
          slowest: 4,
          fastest: 1,
          message: "Pour des traînées, il faut une pose longue, entre 1 et 4 s.",
        },
        {
          setting: "iso",
          max: 100,
          message: "Sur support stable, garde 100 ISO : la pose longue s'occupe de la lumière, sans bruit.",
        },
        {
          setting: "aperture",
          widest: 8,
          message: "Ferme au moins à f/8 : c'est ce qui allonge la pose et dessine des étoiles sur les lampadaires.",
        },
      ],
      preview: {
        ambience: "night",
        subject: "cars",
        motion: { type: "subject", freezeAt: 1 / 250, direction: "horizontal" },
      },
      explanation:
        "Pose longue sur support stable, ISO au plus bas pour éviter le bruit, diaphragme fermé pour obtenir les étoiles sur les lampadaires. Les voitures disparaissent, seuls leurs phares restent.",
      keyword: "Pose longue sur support stable",
    },
    {
      id: "dusk-silhouette",
      title: "Silhouette devant un ciel de crépuscule",
      situation: "Une personne se tient sur une digue, à contre-jour d'un ciel orange et violet.",
      intent: "Tu veux une silhouette noire découpée sur un ciel riche en couleurs.",
      lens: { role: "standard-zoom", focalLength: 35 },
      ev: 9,
      exposureBias: -1,
      support: "handheld",
      constraints: [],
      preview: { ambience: "dusk", subject: "silhouette", motion: { type: "none" } },
      explanation:
        "On expose pour le ciel, pas pour la personne : il faut sous-exposer d'environ 1 stop par rapport à la mesure moyenne. Le sujet reste noir, c'est le parti pris.",
      keyword: "sous-exposer d'environ 1 stop",
    },
    {
      id: "indoor-child",
      title: "Intérieur sombre, enfant qui bouge",
      situation: "Dans un salon éclairé par une lampe, un enfant joue et ne tient pas en place.",
      intent: "Tu veux une photo nette de l'enfant en mouvement.",
      lens: { role: "fast-prime", focalLength: 35 },
      ev: 7,
      support: "handheld",
      constraints: [
        {
          setting: "shutter",
          slowest: 1 / 125,
          message: "Un enfant qui bouge demande au moins 1/125 s.",
        },
        {
          setting: "aperture",
          widest: 1.8,
          narrowest: 2.8,
          message: "Ouvre en grand, entre f/1,8 et f/2,8 : chaque stop compte en intérieur.",
        },
      ],
      preview: {
        ambience: "indoor",
        subject: "child",
        motion: { type: "subject", freezeAt: 1 / 125, direction: "horizontal" },
      },
      explanation:
        "Vitesse et ouverture sont imposées par l'intention, donc c'est l'ISO qui s'ajuste. Une photo bruitée mais nette vaut mieux qu'une photo propre et floue.",
      keyword: "bruitée mais nette",
    },
    {
      id: "silky-waterfall",
      title: "Cascade en effet soie",
      situation: "Au fond d'un sous-bois ombragé, un petit torrent dévale des rochers. L'appareil est sur trépied.",
      intent: "Tu veux une eau lisse et vaporeuse, comme de la soie.",
      lens: { role: "standard-zoom", focalLength: 35 },
      ev: 11,
      support: "tripod",
      constraints: [
        {
          setting: "shutter",
          fastest: 1 / 4,
          message: "Pour lisser l'eau, il faut poser au moins 1/4 s.",
        },
        {
          setting: "iso",
          max: 100,
          message: "Reste à 100 ISO : monter l'ISO raccourcirait la pose, c'est l'inverse de ce que tu cherches.",
        },
      ],
      preview: {
        ambience: "overcast",
        subject: "waterfall",
        motion: { type: "subject", freezeAt: 1 / 500, direction: "vertical" },
      },
      explanation:
        "Pour allonger la pose en plein jour, on ferme au maximum et on reste à l'ISO minimal. À f/22 la diffraction adoucit un peu l'image : en pratique, un filtre ND permettrait de rester vers f/11.",
      keyword: "filtre ND",
    },
    {
      id: "overcast-football",
      title: "Match de foot sous un ciel couvert",
      situation: "Un match de jeunes, en bord de terrain, sous un ciel gris et uniforme.",
      intent: "Tu veux figer un joueur en pleine course.",
      lens: { role: "standard-zoom", focalLength: 55 },
      ev: 12,
      support: "handheld",
      constraints: [
        {
          setting: "shutter",
          slowest: 1 / 500,
          message: "Pour figer une course, vise 1/500 s ou plus rapide.",
        },
        {
          setting: "iso",
          max: 1600,
          message: "Pas besoin de plus de 1600 ISO avec ce ciel, même couvert.",
        },
      ],
      preview: {
        ambience: "overcast",
        subject: "player",
        motion: { type: "subject", freezeAt: 1 / 500, direction: "horizontal" },
      },
      explanation:
        "Le ciel couvert coûte trois stops par rapport au plein soleil. À 55 mm le zoom n'ouvre qu'à f/{maxAperture} : pour tenir 1/500 s, il faut monter l'ISO vers 400. Pense aussi à l'AF-C et à la rafale.",
      keyword: "monter l'ISO vers 400",
    },
    {
      id: "sunny-portrait",
      title: "Portrait fond flou en plein soleil",
      situation: "En plein midi, ton frère pose devant un mur de verdure ensoleillé.",
      intent: "Tu veux le fond le plus flou possible, sans surexposer.",
      lens: { role: "fast-prime", focalLength: 35 },
      ev: 15,
      support: "handheld",
      constraints: [
        {
          setting: "aperture",
          widest: 1.8,
          narrowest: 2.8,
          message: "Pour le fond flou, reste entre f/1,8 et f/2,8.",
        },
        {
          setting: "iso",
          max: 100,
          message: "En plein soleil, l'ISO doit rester au minimum.",
        },
      ],
      preview: { ambience: "daylight", subject: "portrait", motion: { type: "none" } },
      explanation:
        "À f/1,8 en plein soleil, il faudrait environ 1/10 000 s, mais le boîtier plafonne à {maxShutter}. On ferme donc vers f/2,8 pour rester dans ses limites, ou on visse un filtre ND.",
      keyword: "plafonne à {maxShutter}",
    },
    {
      id: "night-street",
      title: "Photo de rue de nuit",
      situation: "Une rue commerçante éclairée par les vitrines, des passants marchent devant toi.",
      intent: "Tu veux les passants nets et assez de profondeur de champ pour ne pas rater le point.",
      lens: { role: "fast-prime", focalLength: 35 },
      ev: 6,
      support: "handheld",
      constraints: [
        {
          setting: "shutter",
          slowest: 1 / 125,
          message: "Des passants qui marchent demandent au moins 1/125 s.",
        },
        {
          setting: "aperture",
          widest: 4,
          narrowest: 8,
          message: "Entre f/4 et f/8, la zone nette couvre une bonne partie de la rue : tu réagis sans viser au millimètre.",
        },
        {
          setting: "iso",
          max: 6400,
          message: "Au-delà de 6400 ISO, l'image se dégrade trop.",
        },
      ],
      preview: {
        ambience: "night",
        subject: "walker",
        motion: { type: "subject", freezeAt: 1 / 125, direction: "horizontal" },
      },
      explanation:
        "En photo de rue, la profondeur de champ est une sécurité. Vitesse et ouverture sont fixées par l'intention : l'ISO monte vers 3200, et c'est un choix assumé.",
      keyword: "l'ISO monte vers 3200",
    },
    {
      id: "museum-statue",
      title: "Statue dans un musée, sans flash",
      situation: "Une salle de musée faiblement éclairée, une statue de marbre, flash interdit.",
      intent: "Tu veux une image nette et propre, avec le moins de bruit possible.",
      lens: { role: "standard-zoom", focalLength: 18 },
      ev: 7,
      support: "handheld",
      constraints: [
        {
          setting: "shutter",
          slowest: 1 / 8,
          message: "Même stabilisé, ne descends pas sous 1/8 s à main levée.",
        },
        {
          setting: "iso",
          max: 800,
          message: "Le sujet est immobile : garde l'ISO sous 800 et profite de la vitesse lente.",
        },
      ],
      preview: { ambience: "indoor", subject: "statue", motion: { type: "none" } },
      explanation:
        "Pour un sujet immobile, la {stabilization} fait gagner environ 3 stops : là où il faudrait 1/30 s sans elle, 1/8 s passe. Elle compense tes mains, pas les mouvements du sujet.",
      keyword: "pas les mouvements du sujet",
    },
  ],

  stops: {
    apertures: [1, 1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22, 32],
    shutterSpeeds: [
      "1/4000", "1/2000", "1/1000", "1/500", "1/250", "1/125", "1/60", "1/30", "1/15", "1/8", "1/4",
      "1/2", "1 s", "2 s", "4 s", "8 s", "15 s", "30 s",
    ],
    isos: [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600],
  },

  vocabulary: [
    {
      id: "aperture",
      term: "Ouverture (diaphragme)",
      definition: "Taille du trou qui laisse passer la lumière, notée f/. Petit chiffre = grande ouverture.",
      pitfall: "Beaucoup croient que f/22 est « plus ouvert » que f/2,8. C'est l'inverse.",
    },
    {
      id: "shutter-speed",
      term: "Vitesse d'obturation",
      definition: "Durée pendant laquelle l'obturateur reste ouvert.",
      pitfall: "1/30 est plus lent que 1/250 : c'est une fraction de seconde.",
    },
    {
      id: "iso",
      term: "ISO (sensibilité)",
      definition:
        "Amplification du signal du capteur. Monter l'ISO permet de photographier dans le noir mais ajoute du bruit.",
      pitfall: "L'ISO n'est pas un choix créatif, c'est une variable d'ajustement.",
    },
    {
      id: "exposure-triangle",
      term: "Triangle d'exposition",
      definition: "Ouverture, vitesse et ISO, liés entre eux : bouger l'un oblige à compenser sur les autres.",
    },
    {
      id: "stop",
      term: "Stop (ou IL)",
      definition: "Unité qui double ou divise par deux la quantité de lumière.",
    },
    {
      id: "depth-of-field",
      term: "Profondeur de champ",
      definition: "Étendue de la zone nette dans la photo.",
    },
    {
      id: "bokeh",
      term: "Bokeh",
      definition: "Qualité esthétique du flou d'arrière-plan, la façon dont les points lumineux se dessinent.",
      pitfall:
        "Ce n'est PAS un synonyme de profondeur de champ. Le support du club fait la confusion : le bokeh décrit l'aspect du flou, pas l'étendue de la zone nette.",
    },
    {
      id: "matrix-metering",
      term: "Mesure matricielle",
      definition: "Mesure de la lumière sur toute l'image, moyennée.",
    },
    {
      id: "center-weighted",
      term: "Mesure pondérée centrale",
      definition: "Mesure sur une zone centrale élargie.",
      pitfall: "Sur le D3500 elle n'est pas paramétrable, contrairement à ce que dit le support du club.",
    },
    {
      id: "spot-metering",
      term: "Mesure spot (ponctuelle)",
      definition: "Mesure de la lumière sur un point précis.",
    },
    {
      id: "af-s",
      term: "AF-S",
      definition:
        "Autofocus ponctuel (« single ») : la mise au point se verrouille et ne bouge plus. Pour un sujet fixe.",
      pitfall:
        "Ne pas confondre avec la mesure spot ni avec la zone AF. Le support du club écrit « AF-S : SPOT », ce qui mélange le mode de mise au point et la zone.",
    },
    {
      id: "af-c",
      term: "AF-C",
      definition: "Autofocus continu : la mise au point suit un sujet mobile.",
    },
    {
      id: "af-a",
      term: "AF-A",
      definition: "Mode automatique qui bascule entre AF-S et AF-C selon que le sujet bouge.",
      pitfall: "Absent du support du club, mais c'est le réglage par défaut du D3500.",
    },
    {
      id: "af-p",
      term: "AF-P",
      definition: "Type de moteur d'objectif (moteur pas à pas, silencieux et rapide).",
      pitfall: "Ce n'est pas un mode de mise au point, malgré la ressemblance avec AF-S et AF-C. Sigle piégeux.",
    },
    {
      id: "vr",
      term: "VR",
      definition: "Réduction de vibration, la stabilisation optique. Gagne environ 3 stops.",
    },
    {
      id: "exposure-compensation",
      term: "Correction d'exposition",
      definition: "Réglage qui éclaircit ou assombrit l'image par rapport au calcul de l'appareil.",
      pitfall: "Elle reste mémorisée même après extinction du boîtier.",
    },
    {
      id: "panning",
      term: "Filé",
      definition: "Technique où l'on suit un sujet mobile à vitesse lente : sujet net, fond flou horizontal.",
    },
    {
      id: "aps-c",
      term: "APS-C",
      definition: "Format de capteur environ 1,5 fois plus petit que le plein format 24x36.",
    },
    {
      id: "focal-length",
      term: "Focale",
      definition: "Distance en mm qui détermine l'angle de champ. 18 mm = grand angle, 55 mm = plus serré.",
    },
    {
      id: "weather-sealed",
      term: "Tropicalisé",
      definition: "Objectif ou boîtier protégé contre la poussière et les projections d'eau.",
    },
    {
      id: "mode-auto",
      term: "Mode AUTO (vert)",
      definition:
        "L'appareil choisit tout, et verrouille le flash, la balance des blancs et la correction d'exposition.",
    },
    {
      id: "mode-p",
      term: "Mode P (auto programmé)",
      definition:
        "L'appareil choisit le couple vitesse/ouverture, décalable à la molette. Le photographe garde la correction d'exposition, le flash, l'ISO.",
    },
    {
      id: "mode-s",
      term: "Mode S (priorité vitesse)",
      definition: "Le photographe choisit la vitesse, l'appareil choisit l'ouverture.",
    },
    {
      id: "mode-a",
      term: "Mode A (priorité ouverture)",
      definition: "Le photographe choisit l'ouverture, l'appareil choisit la vitesse.",
    },
    {
      id: "mode-m",
      term: "Mode M (manuel)",
      definition: "Le photographe choisit tout, l'appareil ne choisit rien.",
    },
  ],

  questions: [
    {
      id: "sqrt2",
      prompt: "Entre deux ouvertures pleines (f/2 puis f/2,8), par quel coefficient multiplie-t-on le nombre f ?",
      answer: "1,41, c'est-à-dire racine de 2",
      distractors: ["1,44", "2", "1,5"],
      explanation:
        "Le coefficient est racine de 2, soit 1,41 : 2 x 1,41 = 2,83, arrondi à 2,8. Le support du club écrit 1,44, c'est une erreur. Pourquoi racine de 2 ? La surface du trou varie comme le carré du diamètre : diviser la surface par 2, c'est diviser le diamètre par 1,41.",
      keyword: "racine de 2, soit 1,41",
    },
    {
      id: "bokeh-vs-dof",
      prompt: "Le bokeh et la profondeur de champ, c'est la même chose ?",
      answer: "Non : le bokeh est la qualité du flou, la profondeur de champ l'étendue de la zone nette",
      distractors: [
        "Oui, ce sont deux noms pour la même notion",
        "Oui, mais bokeh s'emploie seulement en portrait",
        "Non : le bokeh désigne la zone nette, la profondeur de champ le flou",
      ],
      explanation:
        "Deux objectifs réglés à la même profondeur de champ peuvent avoir des bokehs très différents : ronds et doux, ou agités et anguleux. Le support du club confond les deux.",
      keyword: "qualité du flou",
    },
    {
      id: "af-s-not-spot",
      prompt: "Le support du club écrit « AF-S : SPOT ». Que signifie vraiment AF-S ?",
      answer: "Autofocus ponctuel : le point se verrouille une fois trouvé",
      distractors: [
        "Autofocus sur un seul point au centre de l'image",
        "Mesure de la lumière sur un point précis",
        "Autofocus silencieux grâce à un moteur pas à pas",
      ],
      explanation:
        "AF-S est un mode de mise au point (single, ponctuel). Spot désigne un mode de mesure de la lumière, et le choix du collimateur relève de la zone AF. Trois réglages différents.",
      keyword: "mode de mise au point",
    },
    {
      id: "moving-subject-mode",
      prompt: "Sujet en mouvement : quel mode d'exposition choisir en priorité ?",
      answer: "S, priorité vitesse",
      distractors: ["A, priorité ouverture", "AUTO", "P, auto programmé"],
      explanation: "En S, tu fixes la vitesse qui fige (ou fait filer) le sujet, et l'appareil adapte l'ouverture.",
      keyword: "tu fixes la vitesse",
    },
    {
      id: "portrait-mode",
      prompt: "Portrait ou paysage, quand on veut gérer la profondeur de champ : quel mode ?",
      answer: "A, priorité ouverture",
      distractors: ["S, priorité vitesse", "AUTO", "GUIDE"],
      explanation: "La profondeur de champ dépend surtout de l'ouverture : en A, tu la choisis, l'appareil calcule la vitesse.",
      keyword: "dépend surtout de l'ouverture",
    },
    {
      id: "studio-mode",
      prompt: "En studio avec des flashs, quel mode d'exposition ?",
      answer: "M, manuel",
      distractors: ["A, priorité ouverture", "P, auto programmé", "AUTO"],
      explanation:
        "La cellule de l'appareil ne voit pas l'éclair des flashs de studio : elle se tromperait. On règle tout à la main.",
      keyword: "ne voit pas l'éclair",
    },
    {
      id: "auto-locks",
      prompt: "En mode AUTO (vert), que peut-on régler soi-même ?",
      answer: "Rien : flash, balance des blancs et correction d'exposition sont verrouillés",
      distractors: [
        "La correction d'exposition seulement",
        "L'ISO et la balance des blancs",
        "Le couple vitesse/ouverture, à la molette",
      ],
      explanation: "AUTO décide de tout et verrouille même la correction d'exposition. Le mode P, lui, rend ces réglages.",
      keyword: "verrouille même la correction d'exposition",
    },
    {
      id: "forget-p",
      prompt: "Le support du club conseille d'« oublier » le mode P. Qu'en penser ?",
      answer: "C'est une position pédagogique : P reste utile pour réagir vite en gardant la correction d'exposition",
      distractors: [
        "C'est vrai : le mode P donne de moins bonnes photos",
        "C'est vrai : en P, on ne peut rien régler",
        "C'est faux : il faut toujours photographier en P",
      ],
      explanation:
        "Beaucoup de photographes de rue travaillent en P : l'appareil gère le couple vitesse/ouverture, eux gardent la main sur la correction d'exposition. Le conseil du club est une position pédagogique, pas une vérité technique.",
      keyword: "position pédagogique",
    },
    {
      id: "s-mode-aperture",
      prompt: "En mode S, qui choisit l'ouverture ?",
      answer: "L'appareil",
      distractors: ["Le photographe, à la molette", "Personne, elle reste à f/5,6", "Le photographe, avec +/-"],
      explanation: "S = priorité vitesse : tu fixes la vitesse, l'appareil choisit l'ouverture qui donne la bonne exposition.",
      keyword: "l'appareil choisit l'ouverture",
    },
    {
      id: "which-wider",
      prompt: "Quelle ouverture laisse passer le plus de lumière ?",
      answer: "f/2,8",
      distractors: ["f/22", "f/8", "f/11"],
      explanation:
        "Le nombre f est un diviseur : f/2,8 signifie un trou de diamètre focale ÷ 2,8, bien plus grand que focale ÷ 22. Petit chiffre, grande ouverture.",
      keyword: "Petit chiffre, grande ouverture",
    },
    {
      id: "which-slower",
      prompt: "Quelle vitesse est la plus lente ?",
      answer: "1/30 s",
      distractors: ["1/250 s", "1/125 s", "1/1000 s"],
      explanation: "1/30 de seconde dure plus longtemps que 1/250 : l'obturateur reste ouvert plus longtemps.",
      keyword: "dure plus longtemps",
    },
    {
      id: "iso-role",
      prompt: "Quel est le bon réflexe avec l'ISO ?",
      answer: "Le régler en dernier, comme variable d'ajustement",
      distractors: [
        "Le choisir en premier selon l'ambiance voulue",
        "Le laisser toujours à 100",
        "Le monter pour augmenter la netteté",
      ],
      explanation:
        "L'intention fixe la vitesse (mouvement) et l'ouverture (profondeur de champ). L'ISO vient ensuite compenser le manque de lumière, au prix du bruit.",
      keyword: "compenser le manque de lumière",
    },
    {
      id: "compensation-memory",
      prompt: "Tu as appliqué -1 de correction d'exposition hier soir. Ce matin, après avoir rallumé le boîtier :",
      answer: "La correction est toujours à -1",
      distractors: [
        "Elle est revenue à 0 à l'extinction",
        "Elle est revenue à 0 au changement de mode",
        "Elle s'est transformée en -1 ISO",
      ],
      explanation:
        "La correction d'exposition reste mémorisée après extinction. Vérifie-la en début de séance, sinon toutes tes photos seront sombres.",
      keyword: "reste mémorisée",
    },
    {
      id: "af-p-meaning",
      prompt: "Sur l'objectif, « AF-P » désigne :",
      answer: "Un type de moteur autofocus, pas à pas et silencieux",
      distractors: [
        "Un mode de mise au point pour les portraits",
        "Un mode de mise au point prédictif",
        "La présence d'un stabilisateur",
      ],
      explanation:
        "AF-P décrit le moteur de l'objectif. Les modes de mise au point du boîtier sont AF-S, AF-C et AF-A : la ressemblance des sigles est un piège.",
      keyword: "décrit le moteur de l'objectif",
    },
  ],

  diagnoses: [
    {
      id: "grey-night",
      symptom: "Photo de nuit grise et fade, sans noirs profonds.",
      cause: "L'appareil cherche une luminosité moyenne et surexpose les scènes sombres",
      wrongCauses: [
        "L'ISO est trop bas",
        "La balance des blancs est en automatique",
        "L'objectif est sale",
      ],
      fix: "Appliquer une correction d'exposition à -0,7 ou -1.",
    },
    {
      id: "shaken-long-exposure",
      symptom: "Toute la scène est floue sur une pose de 2 secondes, bâtiments compris.",
      cause: "L'appareil a bougé pendant la pose",
      wrongCauses: [
        "La profondeur de champ était trop faible",
        "Les bâtiments étaient trop loin pour l'autofocus",
        "L'ISO était trop élevé",
      ],
      fix: "Poser l'appareil sur un trépied ou un appui solide, et déclencher avec le retardateur 2 secondes.",
    },
    {
      id: "panning-too-sharp",
      symptom: "Sur un filé, tout est net : le sujet et le fond.",
      cause: "La vitesse était trop rapide",
      wrongCauses: [
        "L'ouverture était trop grande",
        "La mise au point était en AF-S",
        "La stabilisation était activée",
      ],
      fix: "Descendre à 1/30, 1/20, voire 1/15 s.",
    },
    {
      id: "panning-subject-blurred",
      symptom: "Sur un filé, le sujet est flou lui aussi.",
      cause: "Suivi pas assez fluide, ou mouvement arrêté au moment du déclenchement",
      wrongCauses: ["L'ISO était trop bas", "L'ouverture était trop fermée", "La mesure était en spot"],
      fix: "Pivoter depuis les hanches et continuer d'accompagner le mouvement après le déclic.",
    },
    {
      id: "burst-first-frames",
      symptom: "Les premières images d'une rafale de filé sont moins nettes que les dernières.",
      cause: "La rotation n'avait pas encore trouvé son rythme",
      wrongCauses: [
        "L'autofocus a mis plusieurs images à accrocher",
        "La mémoire tampon ralentit les premières images",
        "L'exposition s'ajuste au début de la rafale",
      ],
      fix: "Accrocher le sujet et le suivre une seconde avant de déclencher.",
    },
    {
      id: "dark-photo",
      symptom: "Photo trop sombre alors que tout semble bien réglé.",
      cause: "La correction d'exposition est restée en négatif depuis la séance précédente",
      wrongCauses: ["Le capteur est usé", "La mesure matricielle est défaillante", "La batterie est faible"],
      fix: "Remettre la correction d'exposition à 0,0, et prendre le réflexe de la vérifier en début de séance.",
    },
    {
      id: "no-background-blur",
      symptom: "Pas de flou d'arrière-plan malgré f/1,8.",
      cause: "Le fond est trop proche du sujet, ou le photographe est trop loin",
      wrongCauses: [
        "La vitesse était trop rapide",
        "L'ISO était trop élevé",
        "Le mode de mise au point était en AF-C",
      ],
      fix: "Éloigner le sujet du fond, se rapprocher du sujet, cadrer plus serré.",
    },
    {
      id: "eyes-blurred",
      symptom: "Sur un portrait à f/1,8, les yeux sont flous mais le nez est net.",
      cause: "La zone de netteté ne fait que quelques centimètres",
      wrongCauses: [
        "La vitesse était trop lente",
        "L'objectif a un défaut de mise au point",
        "La stabilisation était coupée",
      ],
      fix: "Faire le point sur l'œil le plus proche, ou fermer à f/2,8.",
    },
    {
      id: "converging-verticals",
      symptom: "Le bâtiment semble basculer en arrière.",
      cause: "Convergence des verticales, due à l'appareil incliné vers le haut",
      wrongCauses: [
        "Distorsion due à une ouverture trop grande",
        "Défaut de la stabilisation",
        "Focale trop longue",
      ],
      fix: "Reculer et cadrer plus large, prendre de la hauteur, ou corriger en post-traitement.",
    },
    {
      id: "shutter-press",
      symptom: "Photos légèrement floues en lumière faible, sans raison apparente.",
      cause: "Bougé au moment d'écraser le déclencheur d'un seul coup",
      wrongCauses: [
        "L'autofocus ne fonctionne pas en lumière faible",
        "L'ISO automatique a lissé les détails",
        "L'objectif n'est pas compatible",
      ],
      fix: "Appuyer en deux temps : à mi-course, attendre le point vert, puis enfoncer doucement.",
    },
    {
      id: "grainy-daylight",
      symptom: "Image granuleuse en plein jour.",
      cause: "L'ISO est resté bloqué trop haut",
      wrongCauses: ["La vitesse était trop rapide", "L'ouverture était trop grande", "La mesure était en spot"],
      fix: "Revenir à 100 ISO, ou activer le contrôle automatique de la sensibilité.",
    },
    {
      id: "flash-not-popping",
      symptom: "Le flash ne se lève pas tout seul.",
      cause: "C'est le comportement normal en P, S, A, M et GUIDE",
      wrongCauses: [
        "Le flash est en panne",
        "La batterie est trop faible pour le flash",
        "La scène est jugée assez lumineuse en mode M",
      ],
      fix: "Appuyer sur le bouton du flash, ou passer en AUTO.",
    },
  ],
};
