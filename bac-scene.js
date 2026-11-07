// Section « Recyclage » : un bac en acier peint aux couleurs d'Ain Recycling, déjà plein de carbure (la photo filigranée),
// dans lequel on verse des plaquettes et des forets en 3D (formes de pieces3d.js).
// Les chutes et les rebonds sont calculés par le moteur physique cannon-es (licence MIT, vendor/cannon-es).
// Utilisé par bac3d.js (animation de la page) et par outils/bac.html (image fixe affichée avant l'animation).
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { matieres, modelesPlaquettes, plaquette, outil, studio } from './pieces3d.js';

// Bac : dimensions intérieures, épaisseur des parois, hauteur du tas de carbure
const LARG = 10, PROF = 7, HAUT = 5, EP = 0.22, TAS = 4.1;
const ECHELLE = 0.24;   // les pièces versées sont un peu agrandies pour qu'on les voie bien tomber
const hasard = (a, b) => a + Math.random() * (b - a);
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

// ---------- Pièces ----------
function prototypes(m) {
  const P = (modele, corps, face, poids = 1) => ({
    modele: modelesPlaquettes[modele], poids,
    fabriquer: () => plaquette({ ...modelesPlaquettes[modele], corps, face, detail: 0.2 }),
  });
  const O = (dims, matCoupe, poids = 1) => ({
    dims, poids, outil: true,
    fabriquer: () => outil({ ...dims, matCoupe, matQueue: m.acier, detail: 0.22 }),
  });
  // comme sur les photos : beaucoup de plaquettes dorées, grises ou noires, quelques forets et fraises
  return [
    P('losange-80', m.or, m.noir, 2),
    P('losange-80', m.carbure, m.anthracite, 1.5),
    P('carree', m.or, m.or, 2),
    P('carree', m.carbure, m.noir, 1.5),
    P('triangle', m.or, m.or, 1.5),
    P('triangle', m.carbure, m.carbure, 1.2),
    P('trigone', m.noir, m.noir, 1),
    P('losange-55', m.carbure, m.anthracite, 1),
    P('ronde', m.carbure, m.bronze, 0.6),
    P('fraisage', m.or, m.noir, 1),
    O({ rayon: 0.36, coupe: 3.6, queue: 2.8, n: 2, tours: 1.15, pointe: 0.32 }, m.foretNoir, 1.4),
    O({ rayon: 0.42, coupe: 2.4, queue: 3.0, n: 4, tours: 0.55, pointe: 0, profondeur: 0.3 }, m.anthracite, 1.2),
    O({ rayon: 0.32, coupe: 3.2, queue: 2.6, n: 2, tours: 1.0, pointe: 0.28 }, m.carbure, 1),
  ];
}

// Regroupe les morceaux d'une pièce par matière (2 ou 3 maillages au lieu d'une dizaine) : bien plus léger à afficher.
// Les minuscules picots du brise-copeaux sont laissés de côté : invisibles à cette taille.
function fusionner(objet) {
  objet.updateMatrixWorld(true);
  const parMatiere = new Map();
  objet.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh) return;
    const g = o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    if (!parMatiere.has(o.material)) parMatiere.set(o.material, []);
    parMatiere.get(o.material).push(g);
  });
  return [...parMatiere].map(([materiau, geos]) => {
    const total = geos.reduce((s, g) => s + g.attributes.position.count, 0);
    const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), idx = [];
    let k = 0;
    for (const g of geos) {
      const n = g.attributes.position.count;
      pos.set(g.attributes.position.array, k * 3);
      nor.set(g.attributes.normal.array, k * 3);
      if (g.index) for (const i of g.index.array) idx.push(i + k);
      else for (let i = 0; i < n; i++) idx.push(i + k);
      k += n;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setIndex(idx);
    geo.computeBoundingSphere();
    return { geo, materiau };
  });
}

// Forme simplifiée pour le moteur physique : prisme qui suit le contour de la plaquette, ou cylindre pour un outil
function formePhysique(p) {
  if (p.outil) {
    const { rayon, coupe, queue } = p.dims;
    return {
      forme: new CANNON.Cylinder(rayon * ECHELLE, rayon * ECHELLE, (coupe + queue + 0.12) * ECHELLE, 10),
      orientation: new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2), // cylindre couché sur l'axe de l'outil
      demi: (coupe + queue) * ECHELLE / 2,
    };
  }
  const mo = p.modele;
  const pts = mo.cercle
    ? Array.from({ length: 12 }, (_, i) => [Math.cos(i / 12 * Math.PI * 2) * mo.cercle, Math.sin(i / 12 * Math.PI * 2) * mo.cercle])
    : mo.points;
  const h = ((mo.epaisseur ?? 0.5) / 2 + 0.05) * ECHELLE, n = pts.length;
  const vertices = [
    ...pts.map(([x, y]) => new CANNON.Vec3(x * ECHELLE, y * ECHELLE, -h)),
    ...pts.map(([x, y]) => new CANNON.Vec3(x * ECHELLE, y * ECHELLE, h)),
  ];
  const faces = [
    pts.map((_, i) => n + i),           // dessus
    pts.map((_, i) => n - 1 - i),       // dessous
    ...pts.map((_, i) => [i, (i + 1) % n, n + (i + 1) % n, n + i]),
  ];
  return { forme: new CANNON.ConvexPolyhedron({ vertices, faces }), demi: Math.max(...pts.map(([x, y]) => Math.hypot(x, y))) * ECHELLE };
}

// ---------- Bac ----------
async function image(chemin) {
  return createImageBitmap(await (await fetch(new URL(chemin, import.meta.url))).blob());
}

function construireBac(peinture, logo, acier) {
  const g = new THREE.Group();
  const boite = (l, h, p, x, y, z, mat = peinture, r = 0.05) => {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(l, h, p, 3, r), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true; // le bac porte son ombre au sol mais n'en reçoit pas : plus léger à afficher
    g.add(mesh);
    return mesh;
  };
  const hautParoi = HAUT + EP, lx = LARG + 2 * EP, pz = PROF + 2 * EP;
  boite(lx, EP, pz, 0, EP / 2, 0);                                        // fond
  boite(EP, hautParoi, pz, -(LARG + EP) / 2, hautParoi / 2, 0);           // côtés
  boite(EP, hautParoi, pz, (LARG + EP) / 2, hautParoi / 2, 0);
  boite(LARG, hautParoi, EP, 0, hautParoi / 2, -(PROF + EP) / 2);         // fond du bac et face avant
  boite(LARG, hautParoi, EP, 0, hautParoi / 2, (PROF + EP) / 2);
  // rebord replié en haut des parois
  const yr = hautParoi + 0.02;
  boite(lx + 0.24, 0.18, 0.46, 0, yr, (PROF + EP) / 2, peinture, 0.07);
  boite(lx + 0.24, 0.18, 0.46, 0, yr, -(PROF + EP) / 2, peinture, 0.07);
  boite(0.46, 0.18, pz, -(LARG + EP) / 2, yr, 0, peinture, 0.07);
  boite(0.46, 0.18, pz, (LARG + EP) / 2, yr, 0, peinture, 0.07);
  // nervures de renfort embouties sur les faces extérieures
  for (const y of [1.25, 3.75]) {
    boite(LARG - 0.3, 0.26, 0.12, 0, y, pz / 2 + 0.03);
    boite(LARG - 0.3, 0.26, 0.12, 0, y, -pz / 2 - 0.03);
    boite(0.12, 0.26, PROF - 0.3, lx / 2 + 0.03, y, 0);
    boite(0.12, 0.26, PROF - 0.3, -lx / 2 - 0.03, y, 0);
  }
  // montants d'angle qui servent aussi de pieds
  const pied = 0.6;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    boite(0.46, hautParoi + pied + 0.12, 0.46, sx * lx / 2, (hautParoi + 0.12 - pied) / 2, sz * pz / 2, peinture, 0.08);
  }
  // plaque au logo, rivetée sur la face avant
  const largeurPlaque = 4.3, hauteurPlaque = largeurPlaque * 189 / 900 + 0.34;
  const plaque = boite(largeurPlaque + 0.34, hauteurPlaque, 0.06, 0, 2.5, pz / 2 + 0.03, new THREE.MeshStandardMaterial({ color: 0xf3f5f8, roughness: 0.45, metalness: 0.1 }), 0.03);
  const toile = document.createElement('canvas'); // passer par une toile : une ImageBitmap ne se retourne pas dans WebGL
  toile.width = logo.width; toile.height = logo.height;
  toile.getContext('2d').drawImage(logo, 0, 0);
  const tex = new THREE.CanvasTexture(toile);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const logoMesh = new THREE.Mesh(new THREE.PlaneGeometry(largeurPlaque, largeurPlaque * 189 / 900), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0 }));
  logoMesh.position.set(0, 2.5, pz / 2 + 0.065);
  g.add(logoMesh);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), acier);
    rivet.position.set(sx * (largeurPlaque / 2 + 0.06), 2.5 + sy * (hauteurPlaque / 2 - 0.1), pz / 2 + 0.06);
    g.add(rivet);
  }
  plaque.castShadow = false;
  return g;
}

// Dessus du tas : la photo (agrandie pour être à l'échelle des pièces versées), assombrie le long des parois
function texturePile(photo, renderer) {
  const lc = 1024, hc = Math.round(lc * PROF / LARG);
  const c = document.createElement('canvas');
  c.width = lc; c.height = hc;
  const x = c.getContext('2d');
  const part = 0.6, sw = photo.width * part, sh = sw * hc / lc;
  x.drawImage(photo, (photo.width - sw) / 2, (photo.height - sh) / 2, sw, sh, 0, 0, lc, hc);
  const ombre = (x0, y0, x1, y1) => {
    const d = x.createLinearGradient(x0, y0, x1, y1);
    d.addColorStop(0, 'rgba(8,12,20,.62)'); d.addColorStop(1, 'rgba(8,12,20,0)');
    return d;
  };
  const m = lc * 0.08;
  x.fillStyle = ombre(0, 0, m, 0); x.fillRect(0, 0, m, hc);
  x.fillStyle = ombre(lc, 0, lc - m, 0); x.fillRect(lc - m, 0, m, hc);
  x.fillStyle = ombre(0, 0, 0, m); x.fillRect(0, 0, lc, m);
  x.fillStyle = ombre(0, hc, 0, hc - m); x.fillRect(0, hc - m, lc, m);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}

// ---------- Cadrages ----------
// « section » : la vue d'origine (bac de face, vu d'assez haut, image 6:5), celle de la sauvegarde outils/sauvegardes/bac-v1.
// « heros » : le haut de l'accueil (image carrée) : bac vu de trois quarts, avec de la place au-dessus pour voir tomber les pièces.
const CADRAGES = {
  section: { aspect: 1.2, position: [0, 19.6, 16.5], cible: [0, 2.4, 0] },
  heros: { aspect: 1, position: [-9.0, 19.1, 24.6], cible: [0, 4.0, 0] },
};

// ---------- Scène complète ----------
// debit : multiplie le rythme auquel on verse les pièces (1 = rythme de la version d'origine)
export async function creerScene(renderer, { nombre = 30, cadrage = 'section', debit = 1 } = {}) {
  const [photo, logo] = await Promise.all([image('./images/photos/texture-bac.webp'), image('./logo.png')]);
  const scene = new THREE.Scene();
  const { cle } = studio(renderer, scene, { solY: -0.6, opacite: 0.26, zone: 10 });
  // ombres plus simples qu'en haut de page (beaucoup de petites pièces) : l'animation reste fluide sur téléphone
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  cle.shadow.mapSize.set(1024, 1024);
  // mêmes teintes que les pièces du haut de page, sans vernis ni reflets irisés (invisibles à cette taille)
  const m = Object.fromEntries(Object.entries(matieres()).map(([nom, p]) => [nom, new THREE.MeshStandardMaterial({ color: p.color, metalness: p.metalness, roughness: p.roughness, side: p.side })]));

  const peinture = new THREE.MeshStandardMaterial({ color: 0x0a2459, metalness: 0.3, roughness: 0.4, envMapIntensity: 0.8 }); // bleu marine du logo
  scene.add(construireBac(peinture, logo, m.acier));

  // la photo s'affiche telle quelle ; un calque transparent par-dessus reçoit les ombres des pièces
  const pile = new THREE.Mesh(new THREE.PlaneGeometry(LARG, PROF), new THREE.MeshBasicMaterial({ map: texturePile(photo, renderer), color: 0xe6e6e6, toneMapped: false }));
  pile.rotation.x = -Math.PI / 2;
  pile.position.y = TAS;
  scene.add(pile);
  const ombresPile = new THREE.Mesh(new THREE.PlaneGeometry(LARG, PROF), new THREE.ShadowMaterial({ opacity: 0.38 }));
  ombresPile.rotation.x = -Math.PI / 2;
  ombresPile.position.y = TAS + 0.004;
  ombresPile.receiveShadow = true;
  scene.add(ombresPile);

  // ---- moteur physique : le dessus du tas, des parois un peu plus hautes que le bac ----
  const monde = new CANNON.World({ gravity: new CANNON.Vec3(0, -26, 0), allowSleep: true });
  monde.broadphase = new CANNON.SAPBroadphase(monde);
  monde.defaultContactMaterial.friction = 0.42;
  monde.defaultContactMaterial.restitution = 0.16;
  const sol = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
  sol.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  sol.position.set(0, TAS, 0);
  monde.addBody(sol);
  const hp = 4.2, yp = TAS + hp / 2 - 0.4;
  for (const [x, z, dx, dz] of [[-(LARG / 2 + 0.5), 0, 0.5, PROF / 2 + 1], [LARG / 2 + 0.5, 0, 0.5, PROF / 2 + 1], [0, -(PROF / 2 + 0.5), LARG / 2 + 1, 0.5], [0, PROF / 2 + 0.5, LARG / 2 + 1, 0.5]]) {
    const paroi = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(dx, hp / 2, dz)) });
    paroi.position.set(x, yp, z);
    monde.addBody(paroi);
  }

  // ---- modèles de pièces, préparés une seule fois ----
  const protos = prototypes(m).map(p => ({ ...p, morceaux: fusionner(p.fabriquer()), physique: formePhysique(p) }));
  const poidsTotal = protos.reduce((s, p) => s + p.poids, 0);
  const tirer = () => { let r = Math.random() * poidsTotal; for (const p of protos) { r -= p.poids; if (r <= 0) return p; } return protos[0]; };
  const habiller = (p) => {
    const objet = new THREE.Group();
    for (const { geo, materiau } of p.morceaux) {
      const mesh = new THREE.Mesh(geo, materiau);
      mesh.castShadow = true;
      objet.add(mesh);
    }
    objet.scale.setScalar(ECHELLE);
    scene.add(objet);
    return objet;
  };
  const corpsPour = (p, masse) => {
    const corps = new CANNON.Body({ mass: masse, linearDamping: 0.04, angularDamping: 0.1, sleepSpeedLimit: 0.3, sleepTimeLimit: 0.35 });
    corps.addShape(p.physique.forme, new CANNON.Vec3(), p.physique.orientation);
    return corps;
  };

  // ---- quelques pièces déjà posées sur le tas, à moitié enfoncées : le dessus paraît en relief ----
  const aPlat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
  const q = new THREE.Quaternion(), qa = new THREE.Quaternion(), e = new THREE.Euler();
  for (let i = 0; i < 24; i++) {
    const p = tirer();
    const objet = habiller(p);
    e.set(hasard(-0.22, 0.22), hasard(0, Math.PI * 2), hasard(-0.22, 0.22), 'YXZ');
    q.setFromEuler(e);
    if (p.outil) qa.setFromAxisAngle(new THREE.Vector3(0, 0, 1), hasard(0, Math.PI * 2)); else qa.copy(aPlat);
    objet.quaternion.copy(q).multiply(qa);
    objet.position.set(hasard(-LARG / 2 + 0.7, LARG / 2 - 0.7), TAS + hasard(-0.05, 0.03), hasard(-PROF / 2 + 0.7, PROF / 2 - 0.7));
    const corps = corpsPour(p, 0);
    corps.position.copy(objet.position);
    corps.quaternion.copy(objet.quaternion);
    monde.addBody(corps);
  }

  // ---- pièces versées : une réserve qui tourne (versée, posée, puis enfouie dans le tas) ----
  const pieces = Array.from({ length: nombre }, () => {
    const p = tirer();
    const objet = habiller(p);
    objet.visible = false;
    return { objet, corps: corpsPour(p, 1), demi: p.physique.demi, etat: 'attente', t: 0, calme: 0 };
  });

  function verser(piece) {
    const c = piece.corps;
    // le seau est penché en haut à gauche : les pièces partent vers la droite en tombant
    c.position.set(-2.6 + gauss() * 0.75, TAS + hasard(8.4, 9.8), -0.5 + gauss() * 0.8);
    c.quaternion.setFromEuler(hasard(0, 6.3), hasard(0, 6.3), hasard(0, 6.3));
    c.velocity.set(hasard(2, 3.4), hasard(-2.2, -0.4), hasard(-0.7, 0.7));
    c.angularVelocity.set(hasard(-8, 8), hasard(-8, 8), hasard(-8, 8));
    c.wakeUp();
    monde.addBody(c);
    Object.assign(piece, { etat: 'chute', t: 0, calme: 0 });
    piece.objet.visible = true;
  }

  let reserve = 0, temps = 0;
  function avancer(dt) {
    dt = Math.min(dt, 1 / 20);
    temps += dt;
    // on verse par à-coups, comme à la main
    reserve += (1.6 + 4.6 * Math.max(0, Math.sin(temps * 0.85))) * debit * dt;
    while (reserve >= 1) {
      reserve -= 1;
      const libre = pieces.find(p => p.etat === 'attente');
      if (!libre) { reserve = 0; break; }
      verser(libre);
    }
    monde.step(1 / 120, dt, 6);
    for (const p of pieces) {
      if (p.etat === 'chute') {
        p.t += dt;
        p.objet.position.copy(p.corps.position);
        p.objet.quaternion.copy(p.corps.quaternion);
        const lent = p.corps.velocity.lengthSquared() < 0.3 && p.corps.angularVelocity.lengthSquared() < 1.5;
        p.calme = lent ? p.calme + dt : 0;
        if (p.calme > 1.3 || p.t > 7 || p.corps.position.y < TAS - 1) {
          monde.removeBody(p.corps);
          p.etat = 'enfouie'; p.t = 0;
          p.depart = p.objet.position.y;
          p.profondeur = Math.max(0, p.depart - TAS) + p.demi + 0.15;
        }
      } else if (p.etat === 'enfouie') {
        p.t += dt;
        const k = Math.min(1, p.t / 1.8);
        p.objet.position.y = p.depart - p.profondeur * k * k; // la pièce s'enfonce doucement dans le tas
        if (k >= 1) { p.etat = 'attente'; p.objet.visible = false; }
      }
    }
  }

  // vue plongeante : on voit le tas, les pièces qui tombent et la face avant avec le logo
  const c = CADRAGES[cadrage] || CADRAGES.section;
  const camera = new THREE.PerspectiveCamera(30, c.aspect, 0.1, 100);
  camera.position.set(...c.position);
  camera.lookAt(...c.cible);
  // nombre de pièces en l'air (au-dessus du tas) : sert à choisir le bon moment pour l'image fixe
  const enVol = () => pieces.filter(p => p.etat === 'chute' && p.corps.position.y > TAS + 1.5).length;
  return { scene, camera, avancer, enVol };
}
