export interface PhotoCredit {
  /** What the photo shows in the game. */
  usage: string;
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
  /** Changes made for the game, required by CC BY and CC BY-SA. */
  changes: string;
}

const CUTOUT = "Sujet détouré, recadré et redimensionné.";
const BG = "Recadré au format 3:2 et redimensionné.";
const BG_SA = `${BG} Version modifiée diffusée sous la même licence.`;
const LAYER = "Zones claires extraites de la photo d'origine, même cadrage.";
const LAYER_SA = `${LAYER} Version modifiée diffusée sous la même licence.`;
const CC0 = { license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/deed.fr" };

/** Every photo shipped in /public/photos, keyed by its file name. */
export const photoCredits: Readonly<Record<string, PhotoCredit>> = {
  "subject-cyclist.webp": {
    usage: "Cycliste",
    author: "Yogendra Joshi",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/deed.fr",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Zoom..._(Explored_1st_July_%5E_10)_-_Flickr_-_Yogendra174.jpg",
    changes: CUTOUT,
  },
  "subject-golfer.webp": {
    usage: "Golfeur",
    author: "kallerna",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Golfer_in_Golf_Links_1.jpg",
    changes: `${CUTOUT} Version modifiée diffusée sous la même licence.`,
  },
  "subject-portrait.webp": {
    usage: "Portrait",
    author: "Foto Sushi",
    ...CC0,
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Gray-haired_man_portrait_(Unsplash).jpg",
    changes: CUTOUT,
  },
  "subject-child.webp": {
    usage: "Enfant qui court",
    author: "Gafelap87",
    ...CC0,
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Child_running_on_hillside.jpg",
    changes: CUTOUT,
  },
  "subject-player.webp": {
    usage: "Footballeur",
    author: "Dominic Nelson",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Kidsgrove_Athletic_v_Crewe_Alexandra_-_5_July_2025_-_Fin_Roberts_2.jpg",
    changes: `${CUTOUT} Version modifiée diffusée sous la même licence.`,
  },
  "subject-walkers.webp": {
    usage: "Passant",
    author: "Daniel Tseng",
    ...CC0,
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Walking_Alone_(Unsplash).jpg",
    changes: CUTOUT,
  },
  "subject-statue.webp": {
    usage: "Statue (Hercule jeune, Metropolitan Museum of Art)",
    author: "The Metropolitan Museum of Art",
    ...CC0,
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Marble_statue_of_a_youthful_Hercules_MET_DP156215.jpg",
    changes: CUTOUT,
  },
  "subject-standing-person.webp": {
    usage: "Silhouette",
    author: "Arnaud Mesureur",
    ...CC0,
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Man_standing_beach_silhouette_(Unsplash).jpg",
    changes: CUTOUT,
  },
  "bg-golf-course.webp": {
    usage: "Parcours de golf",
    author: "PattayaPatrol",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:DZ6_2466_Sunny_morning_stroll_down_the_fairway_-_calm_greens_clear_skies_and_a_perfect_day_on_the_course.jpg",
    changes: BG_SA,
  },
  "bg-dusk-boulevard.webp": {
    usage: "Boulevard au crépuscule",
    author: "PattayaPatrol",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:DZ6_2576_Streetlight_wrapped_in_colorful_LED_strands_glows_at_dusk_along_a_busy_city_avenue.jpg",
    changes: BG_SA,
  },
  "bg-shaded-hedge.webp": {
    usage: "Haie et jardin à l'ombre",
    author: "Acabashi",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:A_hedge_and_tree_bordered_lawn_Gibberd_Garden_Essex_England.JPG",
    changes: BG_SA,
  },
  "bg-city-rooftops.webp": {
    usage: "Toits de Lisbonne",
    author: "Jorge Franganillo",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/deed.fr",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Lisboa_-_Miradouro_de_Santa_Catarina_(53897765512).jpg",
    changes: BG,
  },
  "bg-blue-hour-mural.webp": {
    usage: "Fresque à l'heure bleue",
    author: "Chris English",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Kooky_Kraft_Shop_South_Wall_Evening_Picture,_2012_-_panoramio.jpg",
    changes: BG_SA,
  },
  "bg-night-intersection.webp": {
    usage: "Avenue de nuit",
    author: "Smartaportyelui",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:HK_CWB_Causeway_Road_night_%E4%BF%A1%E5%BE%B7%E8%A1%97_Shelter_Street_concrete_covered_footbridge_view_Nov-2013_Road_bridge_n_Park_Towers.JPG",
    changes: BG_SA,
  },
  "lights-night-intersection.webp": {
    usage: "Phares extraits de l'avenue de nuit",
    author: "Smartaportyelui",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:HK_CWB_Causeway_Road_night_%E4%BF%A1%E5%BE%B7%E8%A1%97_Shelter_Street_concrete_covered_footbridge_view_Nov-2013_Road_bridge_n_Park_Towers.JPG",
    changes: LAYER_SA,
  },
  "bg-dusk-sky-seawall.webp": {
    usage: "Jetée au coucher du soleil",
    author: "Rémih",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Jetty_Saint-Gilles_les_Bains_sunset_03.jpg",
    changes: BG_SA,
  },
  "bg-living-room-lamp.webp": {
    usage: "Salon le soir",
    author: "larsjuh",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/deed.fr",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Filipijnen_248_Living_room_at_night_(7103573883).jpg",
    changes: BG,
  },
  "bg-forest-waterfall.webp": {
    usage: "Cascade en sous-bois",
    author: "Noah Feldman",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/deed.fr",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Small_frothy_waterfall_(Unsplash).jpg",
    changes: BG,
  },
  "water-forest-waterfall.webp": {
    usage: "Eau extraite de la cascade",
    author: "Noah Feldman",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/deed.fr",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Small_frothy_waterfall_(Unsplash).jpg",
    changes: LAYER,
  },
  "bg-football-field-overcast.webp": {
    usage: "Terrain de football par temps couvert",
    author: "David P Howard",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/deed.fr",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Football_pitch_on_the_Recreation_Ground_-_geograph.org.uk_-_3698654.jpg",
    changes: BG_SA,
  },
  "bg-sunny-foliage-wall.webp": {
    usage: "Haie en plein soleil",
    author: "Acabashi",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Beer_garden_mixed_hedge_The_Cock_Inn_Henham_Essex_England_02.jpg",
    changes: BG_SA,
  },
  "bg-night-shopping-street.webp": {
    usage: "Rue commerçante de nuit",
    author: "そらみみ",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Tsutenkaku-Hondori_Shopping_Street_at_night_2.jpg",
    changes: BG_SA,
  },
  "bg-museum-hall.webp": {
    usage: "Salle de musée",
    author: "Oursana",
    ...CC0,
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Gem%C3%A4ldegalerie_Berlin_Room_XVIII_2025_3.jpg",
    changes: BG,
  },
};
