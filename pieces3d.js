// Pièces carbure modélisées de zéro avec three.js : plaquettes, forets, fraises, et le « studio » qui les éclaire.
// Utilisé par le bac animé du haut de page (bac-scene.js) et par l'atelier qui fabrique les images du site (outils/atelier.html).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ---------- Matières ----------
export function matieres() {
  const d = THREE.DoubleSide; // les faces de coupe sont faites de surfaces fines, visibles des deux côtés
  return {
    carbure: new THREE.MeshPhysicalMaterial({ color: 0x8f959f, metalness: 1, roughness: 0.4 }),
    noir: new THREE.MeshPhysicalMaterial({ color: 0x24272e, metalness: 0.85, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.22, side: d }),
    anthracite: new THREE.MeshPhysicalMaterial({ color: 0x3c4049, metalness: 0.9, roughness: 0.34, clearcoat: 0.4, side: d }),
    or: new THREE.MeshPhysicalMaterial({ color: 0xc9a14c, metalness: 1, roughness: 0.3, clearcoat: 0.3 }),
    bleu: new THREE.MeshPhysicalMaterial({ color: 0x2a3a66, metalness: 0.9, roughness: 0.3, clearcoat: 0.5, iridescence: 0.4, iridescenceIOR: 1.5, side: d }),
    bronze: new THREE.MeshPhysicalMaterial({ color: 0x8c5b3b, metalness: 1, roughness: 0.32, clearcoat: 0.3, side: d }),
    acier: new THREE.MeshPhysicalMaterial({ color: 0xd6dbe2, metalness: 1, roughness: 0.17 }),
    foretNoir: new THREE.MeshPhysicalMaterial({ color: 0x2c3040, metalness: 0.9, roughness: 0.27, clearcoat: 0.5, iridescence: 0.35, iridescenceIOR: 1.6 }),
  };
}

// Surface qui relie deux contours à deux hauteurs (pente du brise-copeaux)
function liaison(formeA, zA, formeB, zB, mat, n = 160) {
  const a = formeA.getSpacedPoints(n), b = formeB.getSpacedPoints(n);
  const pos = [], idx = [];
  for (let i = 0; i <= n; i++) { pos.push(a[i].x, a[i].y, zA, b[i].x, b[i].y, zB); }
  for (let i = 0; i < n; i++) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

// ---------- Contours de plaquettes (centrés sur 0,0) ----------
const rad = THREE.MathUtils.degToRad;
export const contours = {
  losange: (angle, a) => { const b = a * Math.tan(rad(angle / 2)); return [[a, 0], [0, b], [-a, 0], [0, -b]]; },
  triangle: (r) => [90, 210, 330].map(d => [Math.cos(rad(d)) * r, Math.sin(rad(d)) * r]),
  trigone: (r) => [90, 150, 210, 270, 330, 30].map((d, i) => { const k = i % 2 ? 0.8 : 1; return [Math.cos(rad(d)) * r * k, Math.sin(rad(d)) * r * k]; }),
  carre: (c) => [[c, c], [-c, c], [-c, -c], [c, -c]],
  carreChanfreine: (c, ch) => [[c, c - ch], [c - ch, c], [-c + ch, c], [-c, c - ch], [-c, -c + ch], [-c + ch, -c], [c - ch, -c], [c, -c + ch]],
  gorge: () => [[1.9, -0.32], [1.9, 0.32], [0.5, 0.32], [0.32, 0.52], [-0.32, 0.52], [-0.5, 0.32], [-1.9, 0.32], [-1.9, -0.32]],
};

function formeArrondie(points, rayon, echelle = 1) {
  const pts = points.map(([x, y]) => new THREE.Vector2(x * echelle, y * echelle));
  const s = new THREE.Shape();
  pts.forEach((p, i) => {
    const prec = pts[(i + pts.length - 1) % pts.length], suiv = pts[(i + 1) % pts.length];
    const r = Math.min(rayon, prec.distanceTo(p) / 2.2, suiv.distanceTo(p) / 2.2);
    const debut = p.clone().add(prec.clone().sub(p).normalize().multiplyScalar(r));
    const fin = p.clone().add(suiv.clone().sub(p).normalize().multiplyScalar(r));
    if (i === 0) s.moveTo(debut.x, debut.y); else s.lineTo(debut.x, debut.y);
    s.quadraticCurveTo(p.x, p.y, fin.x, fin.y);
  });
  s.closePath();
  return s;
}
function disque(r) { const s = new THREE.Shape(); s.absarc(0, 0, r, 0, Math.PI * 2, false); return s; }
function trou(r) { const p = new THREE.Path(); p.absarc(0, 0, r, 0, Math.PI * 2, true); return p; }

// Petits bossages du brise-copeaux, posés en ligne le long du contour
function bossages(forme, z, mat) {
  const nombre = Math.max(12, Math.round(forme.getLength() / 0.17));
  const pts = forme.getSpacedPoints(nombre);
  const inst = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), mat, nombre);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), axe = new THREE.Vector3(0, 0, 1);
  for (let i = 0; i < nombre; i++) {
    const a = pts[i], b = pts[i + 1] || pts[0];
    q.setFromAxisAngle(axe, Math.atan2(b.y - a.y, b.x - a.x) + Math.PI / 2); // allongé vers l'intérieur
    m4.compose(new THREE.Vector3(a.x, a.y, z), q, new THREE.Vector3(0.075, 0.026, 0.024));
    inst.setMatrixAt(i, m4);
  }
  return inst;
}

/**
 * Plaquette amovible : corps en carbure + face de coupe revêtue avec brise-copeaux.
 * options : { points | cercle, coin, epaisseur, trou, corps, face, briseCopeaux, positive, detail }
 * detail (0 à 1) : moins de facettes pour les petites pièces vues de loin (bac de la section Recyclage).
 */
export function plaquette(o) {
  const ep = o.epaisseur ?? 0.5, coin = o.coin ?? 0.12;
  const d = o.detail ?? 1, cs = Math.max(8, Math.round(64 * d)), nl = Math.round(160 * d);
  const contour = (k) => (o.cercle ? disque(o.cercle * k) : formeArrondie(o.points, coin, k));
  const g = new THREE.Group();

  const corps = contour(1);
  if (o.trou) corps.holes.push(trou(o.trou));
  // avec brise-copeaux, le corps s'arrête un peu plus bas : la face revêtue (avec sa gorge en creux) vient par-dessus
  const profondeurCorps = o.briseCopeaux === false ? ep : ep - 0.05;
  const geoCorps = new THREE.ExtrudeGeometry(corps, { depth: profondeurCorps, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: d < 0.5 ? 1 : 3, curveSegments: cs });
  geoCorps.translate(0, 0, -ep / 2);
  if (o.positive) {
    // plaquette positive : flancs en dépouille (le dessous est plus petit que le dessus)
    const pos = geoCorps.attributes.position, haut = ep / 2 + 0.04, h = ep + 0.08;
    for (let i = 0; i < pos.count; i++) {
      const f = 1 - 0.09 * ((haut - pos.getZ(i)) / h);
      pos.setXY(i, pos.getX(i) * f, pos.getY(i) * f);
    }
    pos.needsUpdate = true;
    geoCorps.computeVertexNormals();
  }
  g.add(new THREE.Mesh(geoCorps, o.corps));

  const haut = ep / 2 + 0.04; // dessus du corps (biseau compris)
  if (o.briseCopeaux === false) {
    const face = contour(0.96);
    if (o.trou) face.holes.push(trou(o.trou + 0.05));
    const geo = new THREE.ExtrudeGeometry(face, { depth: 0.03, bevelEnabled: false, curveSegments: cs });
    geo.translate(0, 0, haut - 0.01);
    g.add(new THREE.Mesh(geo, o.face));
    return g;
  }
  // Face de coupe revêtue, comme sur une vraie plaquette :
  // listel plat le long de l'arête, gorge en pente qui descend puis remonte, plateau central en relief.
  const bas = haut - 0.05;                      // fond de la face revêtue (sous le dessus du corps)
  const listel = contour(0.985);
  listel.holes.push(contour(0.92));             // three.js remet le sens des trous tout seul
  const geoListel = new THREE.ExtrudeGeometry(listel, { depth: haut + 0.03 - bas, bevelEnabled: false, curveSegments: cs });
  geoListel.translate(0, 0, bas);
  g.add(new THREE.Mesh(geoListel, o.face));
  g.add(liaison(contour(0.92), haut + 0.03, contour(0.79), haut - 0.03, o.face, nl));  // pente de la gorge
  g.add(liaison(contour(0.79), haut - 0.03, contour(0.66), haut + 0.025, o.face, nl)); // remontée vers le plateau
  g.add(bossages(contour(0.855), haut + 0.005, o.face));                           // picots dans la gorge
  const plateauCentral = contour(0.66);
  if (o.trou) plateauCentral.holes.push(trou(o.trou + 0.03));
  const geoPlateauC = new THREE.ExtrudeGeometry(plateauCentral, { depth: haut + 0.025 - bas, bevelEnabled: false, curveSegments: cs });
  geoPlateauC.translate(0, 0, bas);
  g.add(new THREE.Mesh(geoPlateauC, o.face));
  // anneau autour du trou, chanfreiné si plaquette positive
  if (o.trou) {
    const plateau = new THREE.Shape(); plateau.absarc(0, 0, o.trou + 0.16, 0, Math.PI * 2, false);
    plateau.holes.push(trou(o.trou + 0.03));
    const geoPlateau = new THREE.ExtrudeGeometry(plateau, { depth: 0.035, bevelEnabled: false, curveSegments: cs });
    geoPlateau.translate(0, 0, haut + 0.02);
    g.add(new THREE.Mesh(geoPlateau, o.face));
    if (o.positive) {
      const fraisure = new THREE.Mesh(new THREE.CylinderGeometry(o.trou + 0.04, o.trou - 0.06, 0.16, cs, 1, true), o.carbureInterieur || o.corps);
      fraisure.rotation.x = Math.PI / 2;
      fraisure.position.z = haut - 0.04;
      g.add(fraisure);
    }
  }
  return g;
}

// ---------- Outils rotatifs ----------
// Partie à goujures hélicoïdales (n goujures), avec pointe conique, bout plat ou bout hémisphérique.
// Profil d'une dent : goujure creuse, puis dos légèrement dégagé, puis listel au diamètre (la fine bande brillante)
const lisse = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function profilDent(phase, profondeur, sortie) {
  const partGoujure = 0.56;
  if (phase < partGoujure) return 1 - profondeur * sortie * Math.pow(Math.sin(Math.PI * phase / partGoujure), 0.85);
  const u = (phase - partGoujure) / (1 - partGoujure);
  return 0.962 + 0.038 * lisse(0.72, 0.84, u);   // dépouille puis listel
}

function partieGoujures({ rayon, longueur, n, tours, pointe = 0, profondeur = 0.42, boule = false, detail = 1 }) {
  const segT = Math.round((48 * n + 96) * detail), segL = Math.round(260 * detail);
  const pos = [], idx = [];
  for (let j = 0; j <= segL; j++) {
    const v = j / segL, z = v * longueur;
    const torsion = v * tours * Math.PI * 2;
    const sortie = lisse(0, 0.5, z);   // les goujures « sortent » progressivement côté queue
    const reste = longueur - z;
    let k = 1;
    if (pointe && reste < pointe) k = Math.max(0.02, reste / pointe);
    if (boule && reste < rayon) k = Math.max(0.02, Math.sqrt(1 - Math.pow((rayon - reste) / rayon, 2)));
    for (let i = 0; i <= segT; i++) {
      const t = (i / segT) * Math.PI * 2;
      const tour = n * (t - torsion) / (Math.PI * 2);
      const phase = tour - Math.floor(tour);
      const r = rayon * profilDent(phase, profondeur, sortie) * k;
      pos.push(Math.cos(t) * r, Math.sin(t) * r, z);
    }
  }
  for (let j = 0; j < segL; j++) for (let i = 0; i < segT; i++) {
    const a = j * (segT + 1) + i, b = a + segT + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  // bout fermé (éventail depuis le centre)
  const centre = pos.length / 3;
  pos.push(0, 0, longueur);
  const dernier = segL * (segT + 1);
  for (let i = 0; i < segT; i++) idx.push(dernier + i, centre, dernier + i + 1);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Outil monobloc (foret ou fraise), axe = z, pointe vers +z, centré sur sa longueur. */
export function outil({ rayon = 0.36, coupe = 3.6, queue = 2.8, n = 2, tours = 1.15, pointe = 0.32, profondeur, boule = false, matCoupe, matQueue, detail = 1 }) {
  const g = new THREE.Group(), cs = Math.max(12, Math.round(64 * detail));
  g.add(new THREE.Mesh(partieGoujures({ rayon, longueur: coupe, n, tours, pointe, profondeur, boule, detail }), matCoupe));
  const q = new THREE.Mesh(new THREE.CylinderGeometry(rayon, rayon, queue, cs, 1), matQueue);
  q.rotation.x = Math.PI / 2; q.position.z = -queue / 2;
  g.add(q);
  const chanfrein = new THREE.Mesh(new THREE.CylinderGeometry(rayon, rayon * 0.82, 0.12, cs), matQueue);
  chanfrein.rotation.x = -Math.PI / 2; chanfrein.position.z = -queue - 0.06;
  g.add(chanfrein);
  const bout = new THREE.Mesh(new THREE.CircleGeometry(rayon * 0.82, cs), matQueue);
  bout.rotation.y = Math.PI; bout.position.z = -queue - 0.12;
  g.add(bout);
  g.position.z = (queue - coupe) / 2; // recentre
  const pivot = new THREE.Group();
  pivot.add(g);
  pivot.userData.outil = g;
  return pivot;
}

// ---------- Formes de plaquettes (sans les matières) ----------
export const modelesPlaquettes = {
  'losange-80': { points: contours.losange(80, 1.5), trou: 0.36 },
  'losange-55': { points: contours.losange(55, 1.75), trou: 0.33 },
  'losange-35': { points: contours.losange(35, 1.95), trou: 0.24, epaisseur: 0.42, positive: true },
  'triangle': { points: contours.triangle(1.75), trou: 0.33 },
  'trigone': { points: contours.trigone(1.6), trou: 0.36 },
  'carree': { points: contours.carre(1.2), trou: 0.38 },
  'ronde': { cercle: 1.3, trou: 0.4 },
  'fraisage': { points: contours.carreChanfreine(1.15, 0.32), trou: 0.3, epaisseur: 0.55, positive: true },
  'gorge': { points: contours.gorge(), coin: 0.05, epaisseur: 0.6, briseCopeaux: false },
};

// ---------- Catalogue des pièces affichées sur le site ----------
export function catalogue(m) {
  const P = (type, corps, face) => () => plaquette({ ...modelesPlaquettes[type], corps, face });
  return {
    'plaquette-losange-80': P('losange-80', m.or, m.noir),
    'plaquette-losange-55': P('losange-55', m.carbure, m.anthracite),
    'plaquette-losange-35': P('losange-35', m.carbure, m.bleu),
    'plaquette-triangle': P('triangle', m.carbure, m.noir),
    'plaquette-trigone': P('trigone', m.or, m.noir),
    'plaquette-carree': P('carree', m.carbure, m.noir),
    'plaquette-ronde': P('ronde', m.carbure, m.bronze),
    'plaquette-fraisage': P('fraisage', m.carbure, m.bleu),
    'plaquette-gorge': P('gorge', m.carbure, m.noir),
    'foret-revetu': () => outil({ rayon: 0.36, coupe: 3.6, queue: 2.8, n: 2, tours: 1.15, pointe: 0.32, matCoupe: m.foretNoir, matQueue: m.acier }),
    'foret-brut': () => outil({ rayon: 0.32, coupe: 3.2, queue: 2.6, n: 2, tours: 1.0, pointe: 0.28, matCoupe: m.carbure, matQueue: m.acier }),
    'fraise-4-dents': () => outil({ rayon: 0.42, coupe: 2.4, queue: 3.0, n: 4, tours: 0.55, pointe: 0, profondeur: 0.3, matCoupe: m.anthracite, matQueue: m.acier }),
    'fraise-hemispherique': () => outil({ rayon: 0.38, coupe: 2.2, queue: 2.8, n: 2, tours: 0.5, pointe: 0, profondeur: 0.36, boule: true, matCoupe: m.carbure, matQueue: m.acier }),
  };
}

export function ombres(objet) {
  objet.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } });
  return objet;
}

// ---------- Studio photo : reflets, lumières et sol qui ne garde que l'ombre ----------
export function studio(renderer, scene, { solY = -2.2, opacite = 0.2, zone = 8 } = {}) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const cle = new THREE.DirectionalLight(0xffffff, 2.1);
  cle.position.set(-3, 10, 4);
  cle.castShadow = true;
  cle.shadow.mapSize.set(2048, 2048);
  Object.assign(cle.shadow.camera, { left: -zone, right: zone, top: zone, bottom: -zone, near: 0.5, far: 40 });
  cle.shadow.radius = 14;
  cle.shadow.blurSamples = 20;
  cle.shadow.bias = -0.0005;
  scene.add(cle);
  const remplissage = new THREE.DirectionalLight(0xe4ecff, 0.8);
  remplissage.position.set(6, 3, 5);
  scene.add(remplissage);
  const contre = new THREE.DirectionalLight(0xb9ccff, 0.9);
  contre.position.set(-4, 3, -6);
  scene.add(contre);

  const sol = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: opacite }));
  sol.rotation.x = -Math.PI / 2;
  sol.position.y = solY;
  sol.receiveShadow = true;
  scene.add(sol);
  return { cle, sol };
}

// ---------- Ancien haut de page : plaquette + foret (servait à hero3d.js, sauvegardé dans outils/sauvegardes ; encore utilisé par l'atelier) ----------
export function sceneAccueil(scene, pieces) {
  const groupePlaquette = new THREE.Group();
  const plaquetteHero = ombres(pieces['plaquette-losange-80']());
  plaquetteHero.rotation.x = -Math.PI / 2 + 0.5;  // posée presque à plat, inclinée vers nous
  plaquetteHero.scale.setScalar(1.2);
  groupePlaquette.add(plaquetteHero);
  groupePlaquette.position.set(-1.8, -0.95, 0.7);
  scene.add(groupePlaquette);

  const foret = ombres(pieces['foret-revetu']());
  foret.rotation.set(-Math.PI / 2, 0, 0);            // axe vertical, pointe en haut
  foret.scale.setScalar(0.92);
  const inclinaison = new THREE.Group();
  inclinaison.add(foret);
  inclinaison.rotation.set(0.25, 0, -0.36);          // penché vers nous et vers la droite
  inclinaison.position.set(1.95, 0.7, -0.5);         // bien à l'écart de la plaquette
  scene.add(inclinaison);

  return function animer(t) {
    groupePlaquette.rotation.y = 0.35 + t * 0.35;
    groupePlaquette.position.y = -0.95 + Math.sin(t * 1.05) * 0.14;
    foret.userData.outil.rotation.z = -t * 0.9; // le foret tourne sur son axe
    inclinaison.position.y = 0.7 + Math.sin(t * 0.85 + 1.4) * 0.16;
  };
}

export function cameraAccueil(aspect = 1) {
  const camera = new THREE.PerspectiveCamera(30, aspect, 0.1, 100);
  camera.position.set(0, 3.3, 16);
  camera.lookAt(0, 0.25, 0);
  return camera;
}
