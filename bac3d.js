// Animation du bac (bac-scene.js) : des plaquettes et des forets en carbure tombent dans le bac au logo Ain Recycling.
// Chaque <canvas data-bac="heros"> (haut de l'accueil) ou data-bac="section" a la sienne. Elle démarre une fois la page
// chargée, quand elle approche de l'écran (celle du haut de page démarre donc tout de suite), et se met en pause
// quand on ne la voit plus. Rien n'est téléchargé avant (ni le moteur physique), et rien du tout si le visiteur a demandé
// moins d'animations ou s'il économise ses données : l'image fixe reste alors affichée.
const calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const economie = navigator.connection && navigator.connection.saveData;
const REGLAGES = { heros: { nombre: 36, debit: 1.5 }, section: { nombre: 30, debit: 1 } }; // mêmes réglages que outils/bac.html

async function demarrer(canvas) {
  const cadrage = canvas.dataset.bac === 'heros' ? 'heros' : 'section';
  const THREE = await import('three');
  const { creerScene } = await import('./bac-scene.js');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) { return; } // pas de WebGL : l'image fixe reste
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  const r = REGLAGES[cadrage];
  const { scene, camera, avancer } = await creerScene(renderer, {
    cadrage, debit: r.debit, nombre: window.innerWidth < 700 ? Math.round(r.nombre * 0.75) : r.nombre,
  });

  function redimensionner() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  redimensionner();
  new ResizeObserver(redimensionner).observe(canvas);

  // quelques secondes de versage déjà calculées : des pièces sont en l'air dès la première image
  for (let i = 0; i < 150; i++) avancer(1 / 60);

  // haut de page : le bac pivote légèrement en suivant la souris
  const souris = { x: 0, y: 0 };
  if (cadrage === 'heros') {
    window.addEventListener('pointermove', e => {
      souris.x = e.clientX / window.innerWidth - 0.5;
      souris.y = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });
  }

  let visible = false;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(canvas);
  const horloge = new THREE.Clock();
  let premiere = true, somme = 0, images = 0;
  renderer.setAnimationLoop(() => {
    const dt = horloge.getDelta();
    if (!visible || document.hidden) return;
    avancer(dt);
    if (cadrage === 'heros') {
      scene.rotation.y += ((souris.x * 0.2) - scene.rotation.y) * 0.04;
      scene.rotation.x += ((souris.y * 0.05) - scene.rotation.x) * 0.04;
    }
    renderer.render(scene, camera);
    if (premiere) { premiere = false; canvas.parentElement.classList.add('vivant'); return; }
    // appareil lent (moins de 35 images par seconde) : on affiche moins de pixels pour rester fluide
    if (images < 90 && dt < 0.25) {
      somme += dt;
      if (++images === 90 && somme / images > 0.028 && renderer.getPixelRatio() > 1) {
        renderer.setPixelRatio(1);
        redimensionner();
      }
    }
  });
}

if (!calme && !economie && 'IntersectionObserver' in window) {
  document.querySelectorAll('canvas[data-bac]').forEach(canvas => {
    const approche = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      approche.disconnect();
      const lancer = () => ('requestIdleCallback' in window
        ? requestIdleCallback(() => demarrer(canvas), { timeout: 1500 })
        : setTimeout(() => demarrer(canvas), 300));
      if (document.readyState === 'complete') lancer(); else window.addEventListener('load', lancer, { once: true });
    }, { rootMargin: '400px 0px' });
    approche.observe(canvas);
  });
}
