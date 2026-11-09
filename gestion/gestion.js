// Page des demandes (réservée à Malik) : connexion par un code reçu par e-mail, puis les demandes d'envoi par colis de
// l'espace client, avec la pièce d'identité (visionneuse) et le RIB, et « ✓ Étiquette envoyée ». Serveur : /api/gestion/…
// (serveur/gestion.php). Tout ce qu'a écrit un client est affiché en texte (textContent), jamais en HTML.
// Depuis le 8 nov. 2026 : 4 cases en haut pour piloter le site (prix, annonce, visites, sauvegarde), le prix garanti de
// chaque demande, et l'adresse /gestion/#COL-… (QR code du bordereau) qui ouvre directement la demande.
(function () {
  'use strict';
  var ERREURS = {
    email: 'Indique une adresse e-mail valide.', trop: 'Trop de codes demandés : réessaie dans un quart d\'heure.',
    reseau: 'Pas de connexion internet : réessaie.', serveur: 'Service indisponible pour le moment : réessaie plus tard.',
    origine: 'Demande refusée : recharge la page.', illisible: 'Demande illisible : recharge la page.',
    code_faux: 'Ce code n\'est pas le bon : vérifie-le.', code_expire: 'Ce code n\'est plus valable : demandes-en un nouveau.',
    bloque: 'Trop d\'essais : demande un nouveau code.', code6: 'Le code a 6 chiffres.',
    connexion: 'Tu n\'es plus connecté : reconnecte-toi.', introuvable: 'Demande introuvable : actualise la liste.',
    absente: 'Photo introuvable.', copie: 'Copie impossible : sélectionne le texte à la main.',
    prix: 'Écris un prix entre 5 et 300 €/kg (par exemple 47 ou 47,5).', meme_prix: 'C\'est déjà le prix du site.',
    type: 'Choisis la sorte d\'annonce.', dates: 'Indique la date de début (et la date de fin, si elle est différente).',
    passee: 'Cette date de fin est déjà passée.', longue: 'Une annonce dure deux mois au plus.', villes: 'Indique les villes de la tournée.',
    mot_de_passe: 'Le mot de passe doit avoir au moins 10 caractères.', mdp_differents: 'Les deux mots de passe ne sont pas pareils.'
  };
  var ouverture = Date.now(), etat = 'en_cours', reglages = null, cible = null;
  var tous = [], whatsappDe = {}, recherche = ''; // toutes les demandes (300 dernières), liens WhatsApp prêts, recherche
  var kg = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
  var euros = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
  var argent = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var entier = new Intl.NumberFormat('fr-FR');
  var $ = function (sel, dans) { return (dans || document).querySelector(sel); };

  var api = function (methode, chemin, corps) {
    var o = { method: methode, credentials: 'same-origin', headers: {} };
    if (corps) { o.headers['Content-Type'] = 'application/json'; o.body = JSON.stringify(corps); }
    return fetch('/api/gestion/' + chemin, o).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        j.status = r.status;
        if (!r.ok && !j.erreur) j.erreur = 'serveur';
        return j;
      });
    }, function () { return { erreur: 'reseau', status: 0 }; });
  };
  var dire = function (el, code, ok) {
    el.hidden = !code;
    el.textContent = code ? (ERREURS[code] || code) : '';
    el.classList.toggle('ok', !!ok);
  };
  var occupe = function (el, oui) { el.querySelectorAll('button').forEach(function (b) { b.disabled = oui; }); };

  // ---------- dates (le site compte en heure de Paris) ----------
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var aujourdhui = function () { return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' }); };
  var dateLongue = function (ymd) {
    var p = String(ymd || '').split('-');
    if (p.length !== 3) return ymd || '';
    var j = Number(p[2]);
    return (j === 1 ? '1er' : j) + ' ' + MOIS[Number(p[1]) - 1];
  };
  var dateIso = function (iso) { return iso ? new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' }) : ''; };

  // ---------- connexion ----------
  var cx = $('#connexion'), liste = $('#liste'), msgCx = $('.msg', cx), msgListe = $('.msg', liste);
  var email = $('#g-email'), code = $('#g-code'), deco = $('[data-deconnexion]');
  var etapeEmail = $('[data-etape="email"]', cx), etapeCode = $('[data-etape="code"]', cx);
  var montrerConnexion = function () {
    liste.hidden = true; deco.hidden = true; cx.hidden = false;
    etapeEmail.hidden = false; etapeCode.hidden = true;
    email.focus();
  };
  cx.addEventListener('submit', function (e) {
    e.preventDefault();
    var adresse = email.value.trim();
    if (etapeCode.hidden) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(adresse)) { dire(msgCx, 'email'); email.focus(); return; }
      occupe(cx, true);
      api('POST', 'code', { email: adresse, site: $('[name=site]', cx).value, duree: Date.now() - ouverture }).then(function (r) {
        occupe(cx, false);
        if (r.erreur) return dire(msgCx, r.erreur);
        dire(msgCx, '');
        $('[data-email]', cx).textContent = adresse;
        etapeEmail.hidden = true; etapeCode.hidden = false; code.value = ''; code.focus();
      });
      return;
    }
    var c = code.value.replace(/\s/g, '');
    if (!/^\d{6}$/.test(c)) { dire(msgCx, 'code6'); code.focus(); return; }
    occupe(cx, true);
    api('POST', 'connexion', { email: adresse, code: c }).then(function (r) {
      occupe(cx, false);
      if (r.erreur) { dire(msgCx, r.erreur); code.select(); return; }
      dire(msgCx, '');
      charger();
    });
  });
  $('[data-autre]', cx).addEventListener('click', function () { etapeCode.hidden = true; etapeEmail.hidden = false; dire(msgCx, ''); email.focus(); });
  deco.addEventListener('click', function () { api('DELETE', 'connexion').then(montrerConnexion); });

  // ---------- liste des demandes ----------
  var ul = $('[data-demandes]'), modele = $('#modele-demande');
  var jourHeure = function (iso) {
    var d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) + ' à ' + d.getHours() + 'h' + String(d.getMinutes()).padStart(2, '0');
  };
  var jourCourt = function (iso) { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }); };
  var dateFr = function (ymd) { return ymd ? ymd.split('-').reverse().join('/') : ''; };
  var ibanLisible = function (s) { return s.replace(/(.{4})(?=.)/g, '$1 '); };
  var telInternational = function (t) {
    var n = (t || '').replace(/[^\d+]/g, '');
    if (n.charAt(0) === '+') n = n.slice(1); else if (n.slice(0, 2) === '00') n = n.slice(2); else if (n.charAt(0) === '0') n = '33' + n.slice(1);
    return /^\d{8,15}$/.test(n) ? n : null;
  };
  var copier = function (bouton, texte) {
    var avant = bouton.textContent;
    (navigator.clipboard ? navigator.clipboard.writeText(texte) : Promise.reject()).then(function () {
      bouton.textContent = 'Copié ✓';
      setTimeout(function () { bouton.textContent = avant; }, 1500);
    }, function () { dire(msgListe, 'copie'); });
  };

  function carte(e) {
    var li = modele.content.firstElementChild.cloneNode(true), c = e.client;
    var personne = c.nom.toUpperCase() + ' ' + c.prenom;
    var badge = $('[data-etat-demande]', li);
    li.id = 'demande-' + e.reference;
    $('[data-ref]', li).textContent = e.reference;
    // où en est la demande (proposition 94) : étiquette, reçu, pesé, payé ; le bon fait dans l'appli en plus
    var n = e.paye_le ? 5 : e.pese_le ? 4 : e.recu_le ? 3 : e.traite_le ? 2 : 1;
    badge.textContent = e.paye_le ? 'Payé' + (e.montant ? ' : ' + argent.format(e.montant) + ' €' : '') : e.pese_le ? 'Pesé : ' + kg.format(e.poids_net) + ' kg net'
      : e.recu_le ? 'Colis reçu' : e.traite_le ? 'Étiquette envoyée' : 'Nouvelle';
    if (n > 1) badge.classList.add(['', 'envoyee', 'recu', 'pese', 'paye'][n - 1]);
    if (e.bon_numero) badge.textContent += ' · bon ' + e.bon_numero;
    var faites = [];
    if (e.traite_le) faites.push('étiquette le ' + jourCourt(e.traite_le));
    if (e.recu_le) faites.push('reçu le ' + jourCourt(e.recu_le));
    if (e.pese_le) faites.push('pesé le ' + jourCourt(e.pese_le) + ' : ' + kg.format(e.poids_net) + ' kg net' + (e.poids_brut ? ' (' + kg.format(e.poids_brut) + ' kg brut)' : ''));
    if (e.paye_le) faites.push('payé le ' + jourCourt(e.paye_le) + (e.montant ? ' : ' + argent.format(e.montant) + ' €' : '') + (e.paye_detail ? ' (' + e.paye_detail + ')' : ''));
    if (e.bon_redemande_le) faites.push('bon redemandé le ' + jourCourt(e.bon_redemande_le));
    if (faites.length) { $('[data-etapes]', li).textContent = 'Fait : ' + faites.join(' · '); $('[data-etapes]', li).hidden = false; }
    li.classList.toggle('traitee', !!e.traite_le);
    $('[data-quand]', li).textContent = 'Demandée le ' + jourHeure(e.cree_le);
    $('[data-nom]', li).textContent = c.profil === 'professionnel' ? c.entreprise + ' (' + personne + ')' : personne;
    var lignes = $('[data-colis]', li);
    e.colis.forEach(function (x, i) {
      var l = document.createElement('li');
      l.textContent = 'Colis ' + (i + 1) + ' : ' + x.matiere + ', ' + kg.format(x.poids) + ' kg';
      lignes.appendChild(l);
    });
    $('[data-total]', li).textContent = kg.format(e.total) + ' kg environ · ' + e.colis.length + ' colis · ' + (e.paiement === 'Chèque' ? 'chèque' : 'virement');
    if (e.message) { $('[data-message]', li).textContent = e.message; $('[data-message]', li).hidden = false; }
    // prix garanti de la demande (gardé avec elle depuis le 8 nov. 2026) : à payer si le colis est déposé au plus tard ce jour-là
    if (e.prix_kg && e.garanti_jusqu) {
      var g = $('[data-garantie]', li), fini = e.garanti_jusqu < aujourdhui();
      g.textContent = (fini ? 'Garantie finie le ' + dateLongue(e.garanti_jusqu) + ' : ' : 'Prix garanti : ') + euros.format(e.prix_kg) + ' €/kg'
        + (fini ? ' (pour un colis déposé avant cette date)' : ' jusqu\'au ' + dateLongue(e.garanti_jusqu) + ' (colis déposé au plus tard ce jour-là)');
      g.classList.toggle('finie', fini);
      g.hidden = false;
    }

    var adresse = [c.profil === 'professionnel' ? c.entreprise : '', personne, c.adresse, c.cp + ' ' + c.ville].filter(Boolean);
    $('[data-adresse]', li).textContent = c.adresse + ', ' + c.cp + ' ' + c.ville;
    $('[data-copier-adresse]', li).addEventListener('click', function () { copier(this, adresse.join('\n')); });
    var tel = telInternational(c.telephone), aTel = $('[data-tel]', li);
    if (tel) { aTel.href = 'tel:+' + tel; aTel.textContent = c.telephone; aTel.hidden = false; }
    var aMail = $('[data-mail]', li);
    aMail.href = 'mailto:' + c.email + '?subject=' + encodeURIComponent('Votre étiquette prépayée – ' + e.reference);
    aMail.textContent = c.email;

    var p = c.piece;
    if (p) {
      $('[data-piece]', li).textContent = p.type + ' n° ' + p.numero + (p.expiration ? ' · valable jusqu\'au ' + dateFr(p.expiration) : '');
      li.querySelectorAll('[data-voir]').forEach(function (b) {
        var face = b.getAttribute('data-voir');
        if (!p[face]) { b.hidden = true; return; }
        b.addEventListener('click', function () { voir(c.id, face, personne); });
      });
    } else {
      $('[data-piece]', li).textContent = c.profil === 'professionnel' ? 'Professionnel (SIRET ' + c.siret + ')' : 'Pas de pièce';
      $('.boutons-piece', li).hidden = true;
    }
    if (c.rib) {
      var masque = c.rib.iban.slice(0, 4) + ' •••• ' + c.rib.iban.slice(-4), rib = $('[data-rib]', li), voirIban = $('[data-afficher-iban]', li);
      rib.textContent = masque + ' · ' + c.rib.titulaire;
      rib.classList.add('iban');
      voirIban.addEventListener('click', function () {
        var cache = voirIban.textContent === 'Afficher';
        rib.textContent = (cache ? ibanLisible(c.rib.iban) : masque) + ' · ' + c.rib.titulaire;
        voirIban.textContent = cache ? 'Cacher' : 'Afficher';
      });
      $('[data-copier-iban]', li).addEventListener('click', function () { copier(this, c.rib.iban); });
    } else {
      $('[data-rib-titre]', li).hidden = true;
      $('[data-rib-ligne]', li).hidden = true;
    }

    // l'étape suivante en un appui (le client reçoit l'e-mail de l'étape, ou le lien WhatsApp déjà écrit apparaît ici)
    var actions = $('[data-actions]', li);
    var agir = function (action, valeurs) {
      occupe(li, true);
      api('POST', 'demandes', { action: action, envoi: e.id, valeurs: valeurs || {} }).then(function (r) {
        occupe(li, false);
        if (r.status === 401) return montrerConnexion();
        if (r.erreur) return dire(msgListe, r.erreur === 'poids' ? 'Indique le poids net en kilos, par exemple 18,2.' : r.erreur);
        if (r.whatsapp) whatsappDe[e.id] = r.whatsapp; else delete whatsappDe[e.id];
        charger();
      });
    };
    var bouton = function (texte, fantome, f) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'bouton' + (fantome ? ' fantome' : ''); b.textContent = texte;
      b.addEventListener('click', f);
      actions.appendChild(b);
    };
    var champ = function (etiquette, valeur, nombre) {
      var d = document.createElement('label'), s = document.createElement('span'), i = document.createElement('input');
      d.className = 'champ-etape'; s.textContent = etiquette; i.value = valeur || '';
      if (nombre) i.inputMode = 'decimal';
      d.appendChild(s); d.appendChild(i); actions.appendChild(d);
      return i;
    };
    var nombreLu = function (v) { var x = parseFloat(String(v).replace(/\s/g, '').replace(',', '.')); return isFinite(x) ? x : null; };
    if (!e.traite_le) bouton('✓ Étiquette envoyée', false, function () { agir('traite'); });
    else if (!e.recu_le) { bouton('✓ Colis reçu', false, function () { agir('recu'); }); bouton('Annuler : étiquette pas envoyée', true, function () { agir('remettre'); }); }
    else if (!e.pese_le) {
      var net = champ('Poids net, le carbure seul (kg)', '', true), brut = champ('Poids brut, colis fermé (kg, facultatif)', '', true);
      bouton('✓ Pesé', false, function () { agir('pese', { poids_net: nombreLu(net.value), poids_brut: nombreLu(brut.value) }); });
      bouton('Annuler : pas encore reçu', true, function () { agir('sans_recu'); });
    } else if (!e.paye_le) {
      var prevu = e.poids_net && e.prix_kg ? Math.round(e.poids_net * e.prix_kg * 100) / 100 : null;
      var montant = champ('Montant payé (€)' + (prevu ? ' : ' + kg.format(e.poids_net) + ' kg × ' + euros.format(e.prix_kg) + ' €' : ''), prevu ? argent.format(prevu).replace(/\s/g, '') : '', true);
      var detail = champ(e.paiement === 'Chèque' ? 'N° du chèque' : 'Détail du virement (facultatif)', '');
      bouton('✓ Payé', false, function () { agir('paye', { montant: nombreLu(montant.value), detail: detail.value }); });
      bouton('Annuler la pesée', true, function () { agir('sans_pese'); });
    } else bouton('Annuler le paiement', true, function () { agir('sans_paye'); });
    if (whatsappDe[e.id]) {
      var a = document.createElement('a');
      a.className = 'bouton vert'; a.href = whatsappDe[e.id]; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = 'Prévenir sur WhatsApp';
      actions.appendChild(a);
    }
    return li;
  }

  function choisirFiltre(nouveau) {
    etat = nouveau;
    liste.querySelectorAll('.filtre, .compteur').forEach(function (x) {
      var oui = x.getAttribute('data-etat') === nouveau;
      x.classList.toggle('actif', oui);
      x.setAttribute('aria-pressed', String(oui));
    });
  }
  // filtres par étape et recherche (propositions 100 et 101), faits ici sur les 300 dernières demandes
  var FILTRES = {
    en_cours: function (e) { return !e.paye_le; },
    nouvelles: function (e) { return !e.traite_le; },
    en_route: function (e) { return e.traite_le && !e.recu_le; },
    a_peser: function (e) { return e.recu_le && !e.pese_le; },
    a_payer: function (e) { return e.pese_le && !e.paye_le; },
    toutes: function () { return true; },
  };
  function afficherListe() {
    var q = recherche.trim().toLowerCase();
    var vues = tous.filter(FILTRES[etat] || FILTRES.en_cours).filter(function (e) {
      var c = e.client || {};
      return !q || [e.reference, c.nom, c.prenom, c.entreprise, c.ville, c.cp, c.email, c.telephone].join(' ').toLowerCase().indexOf(q) >= 0;
    });
    ul.textContent = '';
    vues.forEach(function (e) { ul.appendChild(carte(e)); });
    var vide = $('[data-vide]');
    vide.textContent = q ? 'Aucune demande ne correspond à « ' + recherche.trim() + ' ».' : 'Aucune demande ici.';
    vide.hidden = vues.length > 0;
    ['nouvelles', 'en_route', 'a_peser', 'a_payer'].forEach(function (k) {
      var n = tous.filter(FILTRES[k]).length;
      $('[data-n="' + k + '"]').textContent = n;
      $('.compteur[data-etat="' + k + '"]').classList.toggle('chaud', n > 0);
    });
    $('.filtre[data-etat="en_cours"]').textContent = 'En cours (' + tous.filter(FILTRES.en_cours).length + ')';
  }

  // QR code du bordereau : /gestion/#COL-261108-K7Q2 ouvre cette demande (cherchée dans « Toutes » si besoin)
  function lireCible() {
    var m = /^#(COL-\d{6}-[2-9A-HJ-NP-Z]{4})$/.exec(location.hash);
    cible = m ? m[1] : null;
  }
  function montrerCible(envois) {
    if (!cible) return;
    var ref = cible, li = document.getElementById('demande-' + ref);
    if (!li && etat !== 'toutes') { choisirFiltre('toutes'); afficherListe(); li = document.getElementById('demande-' + ref); }
    cible = null;
    history.replaceState(null, '', location.pathname);
    if (!li) { dire(msgListe, 'Demande ' + ref + ' introuvable (supprimée avec son compte ?).'); return; }
    li.classList.add('ciblee');
    li.scrollIntoView({ block: 'start' });
    li.tabIndex = -1;
    li.focus({ preventScroll: true });
    dire(msgListe, 'Demande ' + ref + ' : la voici.', true);
    setTimeout(function () { li.classList.remove('ciblee'); }, 6000);
  }

  function charger() {
    $('[data-chargement]').hidden = false;
    api('GET', 'demandes?etat=toutes').then(function (r) {
      $('[data-chargement]').hidden = true;
      if (r.status === 401) return montrerConnexion();
      cx.hidden = true; liste.hidden = false; deco.hidden = false;
      if (!reglages) chargerReglages();
      if (r.erreur) return dire(msgListe, r.erreur);
      dire(msgListe, '');
      tous = r.envois || [];
      afficherListe();
      montrerCible(tous);
    });
  }
  liste.querySelectorAll('.filtre, .compteur').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-etat');
      choisirFiltre(b.classList.contains('compteur') && etat === k ? 'en_cours' : k);
      afficherListe();
    });
  });
  $('[data-chercher]').addEventListener('input', function () { recherche = this.value; afficherListe(); });
  $('[data-actualiser]').addEventListener('click', function () { charger(); chargerReglages(); });
  window.addEventListener('hashchange', function () { lireCible(); if (cible && !liste.hidden) charger(); });

  // ---------- visionneuse de la pièce (photo chargée à la demande, jamais gardée) ----------
  var dlg = $('#visionneuse'), img = $('img', dlg);
  function voir(compte, face, personne) {
    fetch('/api/gestion/piece?compte=' + encodeURIComponent(compte) + '&face=' + face, { credentials: 'same-origin' }).then(function (r) {
      if (r.status === 401) { montrerConnexion(); return null; }
      if (!r.ok) { dire(msgListe, 'absente'); return null; }
      return r.blob();
    }, function () { dire(msgListe, 'reseau'); return null; }).then(function (b) {
      if (!b) return;
      img.src = URL.createObjectURL(b);
      img.alt = 'Pièce d\'identité de ' + personne + ' (' + face + ')';
      dlg.showModal();
    });
  }
  dlg.addEventListener('close', function () { if (img.src) URL.revokeObjectURL(img.src); img.removeAttribute('src'); });
  $('[data-fermer]', dlg).addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });

  // ---------- les 4 cases du haut et leurs feuilles ----------
  document.querySelectorAll('[data-ouvrir]').forEach(function (b) {
    b.addEventListener('click', function () { $('#' + b.getAttribute('data-ouvrir')).showModal(); });
  });
  document.querySelectorAll('dialog.feuille').forEach(function (d) {
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); }); // appui à côté : on ferme
  });

  var lirePrix = function (v) { var n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.').replace('€', '')); return isFinite(n) ? n : NaN; };

  function chargerReglages() {
    api('GET', 'reglages').then(function (r) {
      if (r.status === 401 || r.erreur) return;
      reglages = r;
      remplirReglages();
    });
  }

  var NOMS_ANNONCE = { conges: 'Congés', fermeture: 'Fermeture exceptionnelle', tournee: 'Tournée' };
  // le texte que verront les visiteurs (le même que site.js, en français)
  function texteAnnonce(a) {
    var meme = a.debut.slice(0, 7) === a.fin.slice(0, 7), j = Number(a.debut.slice(8));
    var du = meme ? (j === 1 ? '1er' : String(j)) : dateLongue(a.debut), au = dateLongue(a.fin), un = a.debut === a.fin;
    if (un) du = dateLongue(a.debut);
    if (a.type === 'tournee') return 'Tournée ' + a.villes + (un ? ' le ' + du : ' du ' + du + ' au ' + au) + ' : réservez votre passage.';
    var debut = a.type === 'conges' ? 'Fermé' : 'Fermé exceptionnellement';
    return debut + (un ? ' le ' + du : ' du ' + du + ' au ' + au) + '. Vos demandes seront traitées dès le ' + dateLongue(reprise(a.fin)) + '.';
  }
  // jour ouvré après la fin (ni samedi, ni dimanche, ni jour férié)
  function feries(an) {
    var a = an % 19, b = Math.floor(an / 100), c = an % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
      g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
      l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
      mois = Math.floor((h + l - 7 * m + 114) / 31), jour = ((h + l - 7 * m + 114) % 31) + 1;
    var paques = Date.UTC(an, mois - 1, jour), j = 86400000;
    var liste = ['01-01', '05-01', '05-08', '07-14', '08-15', '11-01', '11-11', '12-25'].map(function (x) { return an + '-' + x; });
    [1, 39, 50].forEach(function (n) { liste.push(new Date(paques + n * j).toISOString().slice(0, 10)); });
    return liste;
  }
  function reprise(fin) {
    var d = new Date(fin + 'T12:00:00Z');
    for (var n = 0; n < 15; n++) {
      d = new Date(d.getTime() + 86400000);
      var ymd = d.toISOString().slice(0, 10), jour = d.getUTCDay();
      if (jour !== 0 && jour !== 6 && feries(d.getUTCFullYear()).indexOf(ymd) < 0) return ymd;
    }
    return fin;
  }

  function remplirReglages() {
    var r = reglages, p = r.prix;
    // case Prix
    $('[data-t-prix]').textContent = euros.format(p.kg) + ' €/kg';
    $('[data-t-prix-detail]').textContent = 'garanti jusqu\'au ' + dateLongue(r.garanti_jusqu) + ' pour une demande du jour';
    $('[data-prix-actuel]').textContent = euros.format(p.kg);
    $('[data-prix-depuis]').textContent = (p.le ? 'Depuis le ' + dateLongue(dateIso(p.le)) + '. ' : 'C\'est le prix écrit dans les pages du site. ')
      + 'Une demande faite aujourd\'hui garde ce prix jusqu\'au ' + dateLongue(r.garanti_jusqu) + ' (7 jours, jamais après la fin du mois).';
    $('[data-prevenir-texte]').textContent = r.abonnes === 1 ? 'Prévenir l’abonné à l’alerte prix (seulement s’il monte)'
      : 'Prévenir les ' + entier.format(r.abonnes) + ' abonnés à l’alerte prix (seulement s’il monte)';
    $('[data-prevenir-ligne]').hidden = !r.abonnes;
    var h = $('[data-historique]');
    h.textContent = '';
    (p.historique || []).forEach(function (x) {
      var li = document.createElement('li');
      li.textContent = dateLongue(dateIso(x.le)) + ' : ' + euros.format(x.avant) + ' → ' + euros.format(x.kg) + ' €/kg';
      h.appendChild(li);
    });
    if (!(p.historique || []).length) { var li0 = document.createElement('li'); li0.textContent = 'Pas encore de changement.'; h.appendChild(li0); }

    // case Annonce
    var a = r.annonces || [];
    $('[data-t-annonce]').textContent = a.length ? NOMS_ANNONCE[a[0].type] : 'Aucune';
    var periode = function (x) {
      if (x.debut === x.fin) return 'le ' + dateLongue(x.debut);
      var j = Number(x.debut.slice(8));
      return 'du ' + (x.debut.slice(0, 7) === x.fin.slice(0, 7) ? (j === 1 ? '1er' : j) : dateLongue(x.debut)) + ' au ' + dateLongue(x.fin);
    };
    $('[data-t-annonce-detail]').textContent = a.length ? periode(a[0]) + (a.length > 1 ? ' (+' + (a.length - 1) + ')' : '') : 'congés, fermeture, tournée';
    var ula = $('[data-annonces]');
    ula.textContent = '';
    a.forEach(function (x) {
      var li = document.createElement('li'), t = document.createElement('p'), b = document.createElement('button');
      t.textContent = texteAnnonce(x);
      b.type = 'button'; b.className = 'mini'; b.textContent = 'Retirer';
      b.addEventListener('click', function () {
        occupe(ula, true);
        api('POST', 'annonces', { action: 'retirer', id: x.id }).then(function (rr) {
          occupe(ula, false);
          if (!rr.erreur) { reglages = rr; remplirReglages(); }
        });
      });
      li.appendChild(t); li.appendChild(b); ula.appendChild(li);
    });
    $('[data-aucune-annonce]').hidden = a.length > 0;

    // case Visites
    var v = r.visites, ce = v.ce_mois, avant = v.mois_dernier;
    var arrivees = function (m) { return m.total - (m.sources['dans le site'] || 0); };
    $('[data-t-visites]').textContent = entier.format(ce.total);
    $('[data-t-visites-detail]').textContent = 'pages vues ce mois-ci · Google : ' + entier.format(ce.sources.google || 0);
    var ch = $('[data-chiffres]');
    ch.textContent = '';
    [['Pages vues ce mois-ci', ce.total, avant.total], ['Arrivées sur le site', arrivees(ce), arrivees(avant)], ['Venus de Google', ce.sources.google || 0, avant.sources.google || 0],
      ['Demandes d\'envoi', v.demandes_ce_mois, v.demandes_mois_dernier], ['Abonnés à l\'alerte prix', r.abonnes, null]].forEach(function (x) {
      var d = document.createElement('div'), b = document.createElement('b'), s = document.createElement('span'), m = document.createElement('small');
      b.textContent = entier.format(x[1]); s.textContent = x[0];
      if (x[2] !== null) m.textContent = 'le mois dernier : ' + entier.format(x[2]);
      d.appendChild(b); d.appendChild(s); if (x[2] !== null) d.appendChild(m);
      ch.appendChild(d);
    });
    var barres = $('[data-barres]'), maxi = 1, jours = [];
    barres.textContent = '';
    for (var i = 29; i >= 0; i--) {
      var dj = new Date(Date.now() - i * 86400000).toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });
      jours.push([dj, v.entrees_par_jour[dj] || 0]);
    }
    jours.forEach(function (x) { maxi = Math.max(maxi, x[1]); });
    jours.forEach(function (x) {
      var s = document.createElement('span');
      s.style.height = Math.max(2, Math.round(x[1] / maxi * 100)) + '%';
      s.title = dateLongue(x[0]) + ' : ' + x[1];
      barres.appendChild(s);
    });
    var total30 = jours.reduce(function (t, x) { return t + x[1]; }, 0);
    $('[data-barres-texte]').textContent = entier.format(total30) + ' arrivées en 30 jours (le jour le plus fort : ' + entier.format(maxi === 1 && !total30 ? 0 : maxi) + ').';
    var NOMS_SOURCE = { google: 'Google', bing: 'Bing', direct: 'Adresse tapée ou lien direct', 'dans le site': 'Pages suivantes (dans le site)', autre: 'Autres sites',
      'qr-bac': 'QR code de l\'étiquette de bac', 'qr-bordereau': 'QR code du bordereau', 'qr-prospectus': 'QR code du prospectus', duckduckgo: 'DuckDuckGo', qwant: 'Qwant', ecosia: 'Ecosia',
      yahoo: 'Yahoo', facebook: 'Facebook', whatsapp: 'WhatsApp', leboncoin: 'Leboncoin', chatgpt: 'ChatGPT' };
    var remplirListe = function (el, objet, nommer) {
      el.textContent = '';
      var cles = Object.keys(objet);
      if (!cles.length) { var li = document.createElement('li'); li.textContent = 'Rien encore ce mois-ci.'; el.appendChild(li); return; }
      cles.forEach(function (k) {
        var li = document.createElement('li'), n = document.createElement('span'), b = document.createElement('b');
        n.textContent = nommer(k); b.textContent = entier.format(objet[k]);
        li.appendChild(n); li.appendChild(b); el.appendChild(li);
      });
    };
    remplirListe($('[data-sources]'), ce.sources, function (k) { return NOMS_SOURCE[k] || k; });
    remplirListe($('[data-pages]'), ce.pages, function (k) { return k === '/' ? 'Accueil' : k.replace(/^\/(de|en|it|es)\//, '$1 · ').replace(/^\//, '').replace(/\.html$/, '').replace(/^(de|en|it|es) · $/, '$1 · accueil'); });

    // case Sauvegarde
    var s = r.sauvegarde, le = s && s.le ? dateIso(s.le) : '';
    var vieille = !le || (Date.now() - new Date(s.le).getTime()) > 31 * 86400000;
    $('[data-t-sauvegarde]').textContent = le ? 'Le ' + dateLongue(le) : 'Jamais faite';
    $('[data-t-sauvegarde-detail]').textContent = vieille ? 'à faire' : 'à refaire dans un mois';
    $('.tuile[data-ouvrir="d-sauvegarde"]').classList.toggle('a-faire', vieille);
    // case Connexion Google (propositions 68 et 74)
    var g = r.google || {};
    $('[data-t-google]').textContent = g.pret ? 'Active' : 'Pas encore';
    $('[data-t-google-detail]').textContent = g.pret ? 'bouton visible sur Mon compte' : 'clé à créer chez Google';
    $('[data-google-retour]').textContent = g.retour || '';
    $('[data-etat-google]').textContent = g.pret ? 'Clé enregistrée : ' + g.client_id : 'Pas encore de clé : le bouton Google est caché.';
    $('#g-client').value = g.client_id || '';
    var es = $('[data-etat-sauvegarde]');
    es.textContent = le ? 'Dernière sauvegarde : ' + dateLongue(le) + (vieille ? ' · à refaire' : '') : 'Pas encore de sauvegarde.';
    es.classList.toggle('a-faire', vieille);
  }

  // prix : « Tu es sûr ? » quand le serveur trouve le prix bizarre (sous 30, au-dessus de 80, ou 25 % d'écart)
  var fPrix = $('#f-prix'), msgPrix = $('.msg', fPrix), boite = $('[data-confirmer]', fPrix);
  var envoyerPrix = function (confirme) {
    var v = lirePrix($('#g-prix').value);
    if (!(v >= 5 && v <= 300)) { dire(msgPrix, 'prix'); $('#g-prix').focus(); return; }
    occupe(fPrix, true);
    api('POST', 'prix', { kg: v, confirme: confirme === true, prevenir: $('#g-prevenir').checked }).then(function (r) {
      occupe(fPrix, false);
      if (r.status === 401) return montrerConnexion();
      if (r.erreur === 'confirmer') {
        $('[data-confirmer-texte]', boite).textContent = euros.format(v) + ' €/kg, alors que le prix est de ' + euros.format(reglages.prix.kg) + ' €/kg. Une faute de frappe est vite arrivée.';
        boite.hidden = false;
        $('[data-oui]', boite).focus();
        return;
      }
      boite.hidden = true;
      if (r.erreur) return dire(msgPrix, r.erreur);
      reglages = r;
      remplirReglages();
      $('#g-prix').value = '';
      dire(msgPrix, 'Enregistré : le site affiche maintenant ' + euros.format(r.prix.kg) + ' €/kg.' + (r.prevenus ? ' ' + r.prevenus + ' abonnés vont être prévenus (40 par jour au plus).' : ''), true);
    });
  };
  fPrix.addEventListener('submit', function (e) { e.preventDefault(); boite.hidden = true; envoyerPrix(false); });
  $('[data-oui]', boite).addEventListener('click', function () { envoyerPrix(true); });
  $('[data-non]', boite).addEventListener('click', function () { boite.hidden = true; $('#g-prix').select(); });

  // annonce : aperçu du texte pendant qu'on remplit
  var fAnn = $('#f-annonce'), msgAnn = $('.msg', fAnn);
  var lireAnnonce = function () {
    var type = $('[name=type]:checked', fAnn).value, debut = $('#g-debut').value, fin = $('#g-fin').value || debut;
    return { type: type, debut: debut, fin: fin, villes: $('#g-villes').value.trim() };
  };
  var majApercu = function () {
    var a = lireAnnonce();
    $('[data-villes-ligne]', fAnn).hidden = a.type !== 'tournee';
    $('[data-apercu]', fAnn).textContent = a.debut && (a.type !== 'tournee' || a.villes) && a.fin >= a.debut
      ? 'Les visiteurs verront : « ' + texteAnnonce({ type: a.type, debut: a.debut, fin: a.fin, villes: a.villes }) + ' »' : '';
  };
  fAnn.addEventListener('input', majApercu);
  fAnn.addEventListener('change', majApercu);
  fAnn.addEventListener('submit', function (e) {
    e.preventDefault();
    var a = lireAnnonce();
    if (!a.debut) { dire(msgAnn, 'dates'); $('#g-debut').focus(); return; }
    occupe(fAnn, true);
    api('POST', 'annonces', a).then(function (r) {
      occupe(fAnn, false);
      if (r.status === 401) return montrerConnexion();
      if (r.erreur) return dire(msgAnn, r.erreur);
      reglages = r;
      remplirReglages();
      fAnn.reset();
      majApercu();
      dire(msgAnn, 'Annonce ajoutée : elle est déjà en ligne.', true);
    });
  });
  $('#g-debut').min = aujourdhui();
  $('#g-fin').min = aujourdhui();

  // sauvegarde : le fichier arrive comme un téléchargement (rien n'est gardé par la page)
  var fSauve = $('#f-sauvegarde'), msgSauve = $('.msg', fSauve);
  fSauve.addEventListener('submit', function (e) {
    e.preventDefault();
    var m1 = $('#g-mdp').value, m2 = $('#g-mdp2').value;
    if (m1.length < 10) { dire(msgSauve, 'mot_de_passe'); $('#g-mdp').focus(); return; }
    if (m1 !== m2) { dire(msgSauve, 'mdp_differents'); $('#g-mdp2').focus(); return; }
    occupe(fSauve, true);
    dire(msgSauve, 'Préparation du fichier…', true);
    fetch('/api/gestion/sauvegarde', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mot_de_passe: m1 }) })
      .then(function (r) {
        if (r.status === 401) { montrerConnexion(); return null; }
        if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) { dire(msgSauve, j.erreur || 'serveur'); return null; });
        var nom = (/filename="([^"]+)"/.exec(r.headers.get('Content-Disposition') || '') || [])[1] || 'sauvegarde-site.zip';
        return r.blob().then(function (b) { return { b: b, nom: nom }; });
      }, function () { dire(msgSauve, 'reseau'); return null; })
      .then(function (x) {
        occupe(fSauve, false);
        if (!x) return;
        var a = document.createElement('a');
        a.href = URL.createObjectURL(x.b);
        a.download = x.nom;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
        fSauve.reset();
        dire(msgSauve, 'Fichier « ' + x.nom + ' » prêt : range-le en lieu sûr.', true);
        chargerReglages();
      });
  });

  lireCible();
  charger();

  // clé Google : enregistrée (chiffrée) ou retirée
  var fg = $('#f-google'), msgG = $('.msg', fg);
  var envoyerCle = function (corps) {
    api('POST', 'google', corps).then(function (r) {
      if (r.status === 401) return montrerConnexion();
      if (r.erreur) return dire(msgG, r.erreur === 'client_id' ? 'Cet ID client ne ressemble pas à celui de Google.' : r.erreur === 'secret' ? 'Ce code secret ne ressemble pas à celui de Google.' : r.erreur);
      dire(msgG, r.google && r.google.pret ? 'Clé enregistrée : le bouton Google est visible sur Mon compte.' : 'Clé retirée : le bouton Google est caché.', true);
      $('#g-secret').value = '';
      chargerReglages();
    });
  };
  fg.addEventListener('submit', function (ev) { ev.preventDefault(); envoyerCle({ client_id: $('#g-client').value.trim(), secret: $('#g-secret').value.trim() }); });
  $('[data-retirer-google]').addEventListener('click', function () { envoyerCle({ client_id: '', secret: '' }); });
  $('[data-copier-retour]').addEventListener('click', function () { copier(this, $('[data-google-retour]').textContent); });
})();
