import type { Deepening } from "@/types";

/** "Learn more" blocks of chapter 1, shared by terms and course questions. */
export const details = {
  aperture: {
    illustration: "aperture",
    paragraphs: [
      "Le diaphragme est un ensemble de lamelles dans l'objectif, qui forment un trou plus ou moins grand. On le règle en nombre f : f/1,8, f/2,8, f/4, f/5,6, f/8, f/11, f/16, f/22.",
      "Le nombre f est un diviseur : le diamètre du trou vaut la focale divisée par ce nombre. Plus le nombre est petit, plus le trou est grand. On dit qu'on « ouvre » quand on va vers f/1,8, qu'on « ferme » quand on va vers f/22.",
      "L'ouverture agit sur deux choses à la fois : la quantité de lumière, et la profondeur de champ. Grande ouverture : beaucoup de lumière, fond flou. Petite ouverture : peu de lumière, tout net.",
      "Chaque valeur de l'échelle pleine (f/2,8, f/4, f/5,6...) laisse passer deux fois moins de lumière que la précédente. Le nombre est multiplié par 1,41 à chaque fois, la racine de 2.",
    ],
  },
  shutter: {
    illustration: "shutter",
    paragraphs: [
      "La vitesse d'obturation est la durée pendant laquelle le capteur reçoit la lumière. Elle s'écrit en fraction de seconde : 1/250 veut dire un deux-cent-cinquantième de seconde.",
      "1/30 est donc plus lent (plus long) que 1/250. Au-delà d'une seconde, on parle de pose longue : 1 s, 2 s, 30 s.",
      "La vitesse agit sur la lumière et sur le mouvement. Rapide : le mouvement est figé, mais peu de lumière. Lente : beaucoup de lumière, mais tout ce qui bouge devient flou, y compris l'appareil s'il est tenu à la main.",
      "Repères : 1/1000 pour figer un sport rapide, 1/250 pour une personne qui marche, 1/60 pour un sujet immobile à main levée, 1/30 à 1/15 pour un filé, 1 s et plus sur trépied.",
    ],
  },
  iso: {
    illustration: "iso",
    paragraphs: [
      "L'ISO règle l'amplification du signal du capteur. Monter l'ISO ne capte pas plus de lumière : il amplifie ce qui a été capté, comme on monte le volume d'un enregistrement faible.",
      "Comme le volume, l'amplification fait aussi monter le souffle : c'est le bruit numérique, un grain et des couleurs plus ternes, surtout dans les zones sombres.",
      "Doubler l'ISO (100, 200, 400, 800...) fait gagner un stop. On peut donc garder une vitesse rapide ou une petite ouverture dans le noir, au prix du bruit.",
      "Bon réflexe : choisir d'abord la vitesse et l'ouverture selon l'intention, puis monter l'ISO juste ce qu'il faut. Une photo nette et un peu bruitée vaut mieux qu'une photo propre et floue.",
    ],
  },
  triangle: {
    illustration: "triangle",
    paragraphs: [
      "L'exposition, c'est la quantité de lumière qui forme l'image. Trois réglages la contrôlent : l'ouverture, la vitesse et l'ISO.",
      "Chacun peut ajouter ou retirer de la lumière, mais chacun a un effet secondaire : l'ouverture change la profondeur de champ, la vitesse le flou de mouvement, l'ISO le bruit.",
      "Pour une même exposition, on peut donc échanger : ouvrir d'un stop et accélérer d'un stop donne la même luminosité, avec un fond plus flou et un mouvement mieux figé.",
      "La méthode : partir de l'intention (que veux-tu figer ? quelle zone nette ?), fixer les deux réglages qui la servent, et ajuster le troisième.",
    ],
  },
  stop: {
    illustration: "stops",
    paragraphs: [
      "Un stop (ou IL, indice de lumination) est l'unité de quantité de lumière en photo : un stop de plus, c'est deux fois plus de lumière. Un stop de moins, deux fois moins.",
      "Le même stop se retrouve sur les trois réglages : f/4 vers f/2,8, 1/250 vers 1/125, 200 ISO vers 400 ISO. C'est ce qui permet de les échanger entre eux.",
      "Les boîtiers proposent aussi des tiers de stop (f/3,2, f/3,5 entre f/2,8 et f/4) pour un réglage plus fin.",
    ],
  },
  depthOfField: {
    illustration: "depth-of-field",
    paragraphs: [
      "La profondeur de champ est l'étendue de la zone nette, devant et derrière le point de mise au point. Elle ne coupe pas net : la netteté diminue progressivement.",
      "Elle diminue quand on ouvre (petit nombre f), quand on se rapproche du sujet, et quand la focale augmente. Elle augmente dans les cas inverses.",
      "Pour un portrait au fond flou : ouvre, rapproche-toi, éloigne le sujet du fond. Pour un paysage net partout : ferme vers f/8 ou f/11.",
      "Ne confonds pas avec le bokeh : la profondeur de champ dit combien c'est flou, le bokeh dit à quoi ressemble ce flou.",
    ],
  },
  bokeh: {
    illustration: "bokeh",
    paragraphs: [
      "Tout flou de mise au point a un bokeh, joli ou non. Le mot vient du japonais « boke », le flou : il décrit l'aspect du flou, pas sa quantité. « Faire du bokeh » est un raccourci, on veut dire « avoir un fond flou et beau ».",
      "La quantité de flou, c'est la profondeur de champ : elle dépend de l'ouverture, de la focale, de ta distance au sujet et de la distance entre le sujet et le fond.",
      "La qualité du flou, c'est le bokeh : elle dépend de l'objectif. La forme des lamelles du diaphragme dessine les points lumineux (ronds à pleine ouverture, polygonaux quand on ferme). La formule optique rend le flou doux ou nerveux. Le vignetage écrase les disques en « œil de chat » dans les coins.",
      "Le flou de bougé et le flou de mouvement ne sont pas du bokeh : ils viennent du temps de pose, pas de la mise au point. En revanche, un premier plan flou a lui aussi un bokeh.",
    ],
  },
  metering: {
    illustration: "metering",
    paragraphs: [
      "La cellule de l'appareil mesure la lumière de la scène pour proposer une exposition. Elle vise une luminosité moyenne, un gris intermédiaire.",
      "Matricielle : toute l'image est découpée en zones analysées ensemble. C'est le bon choix par défaut.",
      "Pondérée centrale : toute l'image compte, mais le centre pèse beaucoup plus. Utile quand le sujet est au centre et le fond très différent.",
      "Spot : seul un petit point compte, environ 2 à 3 % de l'image. Idéal pour un visage à contre-jour ou une scène de spectacle, mais il faut viser juste.",
      "Toutes ces mesures se trompent sur les scènes très claires (neige) ou très sombres (nuit), car elles ramènent tout vers le gris moyen. D'où la correction d'exposition.",
    ],
  },
  autofocus: {
    illustration: "autofocus",
    paragraphs: [
      "Le mode de mise au point dit comment l'autofocus se comporte quand tu enfonces le déclencheur à mi-course.",
      "AF-S (ponctuel, « single ») : il trouve le point puis le verrouille. Tu peux recadrer sans perdre le point. Pour un sujet immobile.",
      "AF-C (continu) : il recalcule le point en permanence tant que tu gardes la mi-course. Pour un sujet qui bouge, surtout s'il avance ou recule.",
      "AF-A : l'appareil choisit seul entre les deux selon que le sujet bouge. Pratique, mais il peut hésiter.",
      "À ne pas confondre avec la zone AF (quel collimateur fait le point) ni avec la mesure spot (qui mesure la lumière, pas la netteté).",
    ],
  },
  afMotor: {
    illustration: "af-motor",
    paragraphs: [
      "Sur un objectif, AF-P et AF-S décrivent le moteur de mise au point intégré. AF-P : moteur pas à pas, très silencieux et rapide. AF-S : moteur ultrasonique.",
      "Les anciens objectifs AF ou AF-D n'ont pas de moteur : ils comptent sur un moteur dans le boîtier. Sur un boîtier qui n'en a pas, ils fonctionnent mais la mise au point se fait à la main.",
      "Piège classique : AF-S sur l'objectif (un moteur) et AF-S dans le menu du boîtier (un mode de mise au point) n'ont rien à voir.",
    ],
  },
  stabilization: {
    illustration: "stabilization",
    paragraphs: [
      "La stabilisation optique (VR chez Nikon, IS chez Canon, OSS chez Sony) déplace un groupe de lentilles pour compenser les petits mouvements de tes mains.",
      "Elle fait gagner environ 3 stops : là où il faudrait 1/30 s pour éviter le flou de bougé, 1/4 s devient possible sur un sujet immobile.",
      "Elle ne fige pas un sujet qui bouge : pour lui, seule la vitesse compte. Sur trépied, on la coupe souvent, car elle peut chercher à corriger un mouvement qui n'existe pas.",
      "Règle de sécurité sans stabilisation : vitesse au moins égale à 1 / (focale x facteur de recadrage). À 50 mm sur APS-C, environ 1/80.",
    ],
  },
  compensation: {
    illustration: "compensation",
    paragraphs: [
      "La correction d'exposition dit à l'appareil : « fais plus clair » ou « fais plus sombre » que ce que ta mesure propose. Elle se règle en stops, par tiers : -0,3, -0,7, -1...",
      "Elle sert quand la mesure se trompe : nuit grise et fade (corriger vers -0,7 ou -1), neige ou plage grises (corriger vers +1), contre-jour.",
      "Elle fonctionne en P, S et A. En M, c'est toi qui règles tout, elle ne sert qu'à décaler l'indicateur.",
      "Piège : elle reste mémorisée après extinction. Une correction oubliée à -1 rendra toutes les photos du lendemain trop sombres.",
    ],
  },
  panning: {
    illustration: "panning",
    paragraphs: [
      "Le filé consiste à suivre un sujet mobile avec l'appareil pendant une pose assez lente. Le sujet reste net, le décor défile en traînées horizontales : on ressent la vitesse.",
      "Vitesses de départ : 1/30 pour un cycliste, 1/60 pour une voiture rapide, 1/15 pour un piéton. Plus c'est lent, plus le fond file, mais plus c'est difficile.",
      "Technique : pieds stables, rotation depuis les hanches, suivre le sujet avant, pendant et après le déclic. AF-C et rafale aident beaucoup.",
    ],
  },
  sensor: {
    illustration: "sensor",
    paragraphs: [
      "Le plein format reprend la taille du film 24 x 36 mm. L'APS-C est plus petit, environ 23,5 x 15,6 mm, soit 1,5 fois moins large.",
      "Avec le même objectif, un capteur APS-C ne garde que le centre de l'image : le cadrage paraît plus serré, comme si la focale était multipliée par 1,5.",
      "À cadrage égal, un capteur APS-C donne un peu plus de profondeur de champ, et un peu plus de bruit à haut ISO, qu'un plein format.",
    ],
  },
  focalLength: {
    illustration: "focal-length",
    paragraphs: [
      "La focale, c'est le « niveau de zoom » de l'objectif. Imagine que tu regardes dehors par un tube en carton : un tube court te montre tout le paysage, un tube long n'en montre qu'un petit morceau, comme agrandi. Les millimètres, c'est exactement ça : la distance entre le centre optique de l'objectif et le capteur.",
      "Petite focale (18 mm) : grand-angle, environ 66° de champ. Pour le paysage, l'intérieur, l'architecture. Grande focale (55 mm) : environ 24° de champ, cadrage serré. Pour le portrait, un détail, un sujet un peu éloigné.",
      "Deux effets à connaître. Le bougé : plus la focale est longue, plus le moindre tremblement est grossi, d'où la règle vitesse ≥ 1 / (focale x 1,5) sur APS-C, soit 1/30 s à 18 mm mais plutôt 1/80 s à 55 mm. Le flou d'arrière-plan : à cadrage du sujet égal, une focale longue isole mieux le sujet de son fond.",
      "Sur un capteur APS-C, le cadrage équivaut à une focale 1,5 fois plus longue en plein format : 18-55 mm devient 27-82 mm, et 35 mm devient environ 52 mm, proche du champ de l'œil humain.",
      "Attention à un raccourci courant : ce n'est pas la focale qui « écrase » ou « étire » les plans, c'est la distance au sujet. Un grand-angle pousse à s'approcher (visages déformés de près), une longue focale à reculer (plans qui paraissent tassés).",
      "Exercice : reste au même endroit et photographie le même sujet à 18 puis à 55 mm. Ensuite, retrouve le cadrage du 55 mm à 18 mm en t'avançant : le fond change complètement, c'est l'effet de la distance.",
    ],
  },
  weatherSealed: {
    paragraphs: [
      "Un boîtier ou un objectif tropicalisé a des joints qui limitent l'entrée de poussière et d'humidité. Il supporte une pluie fine ou des embruns.",
      "Cela ne veut pas dire étanche : il ne va pas sous l'eau. Et la protection ne vaut que si tout est tropicalisé : boîtier et objectif.",
      "Les boîtiers d'entrée de gamme ne le sont généralement pas : sous la pluie, une simple housse ou un sac plastique fait l'affaire.",
    ],
  },
  exposureModes: {
    illustration: "exposure-modes",
    paragraphs: [
      "Les modes d'exposition répartissent les décisions entre toi et le boîtier. Plus tu descends vers M, plus tu as la main.",
      "S (priorité vitesse) : tu fixes la vitesse, pour figer ou filer un mouvement. A (priorité ouverture) : tu fixes l'ouverture, pour la profondeur de champ. Ce sont les deux modes les plus utilisés.",
      "M (manuel) : tu règles tout. Indispensable avec des flashs de studio, que la cellule ne voit pas, et pratique pour garder la même exposition sur une série.",
      "P : le boîtier choisit le couple vitesse/ouverture, mais tu peux le décaler à la molette et tu gardes la correction d'exposition. Le club conseille de l'oublier : c'est une position pédagogique, beaucoup de photographes de rue l'utilisent pour réagir vite.",
    ],
  },
} satisfies Record<string, Deepening>;
