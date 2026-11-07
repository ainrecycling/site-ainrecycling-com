// Page des demandes (réservée à Malik) : connexion par un code reçu par e-mail, puis les demandes d'envoi par colis de
// l'espace client, avec la pièce d'identité (visionneuse) et le RIB, et « ✓ Étiquette envoyée ». Serveur : /api/gestion/…
// (serveur/gestion.php). Tout ce qu'a écrit un client est affiché en texte (textContent), jamais en HTML.
(function () {
  'use strict';
  var ERREURS = {
    email: 'Indique une adresse e-mail valide.', trop: 'Trop de codes demandés : réessaie dans un quart d\'heure.',
    reseau: 'Pas de connexion internet : réessaie.', serveur: 'Service indisponible pour le moment : réessaie plus tard.',
    origine: 'Demande refusée : recharge la page.', illisible: 'Demande illisible : recharge la page.',
    code_faux: 'Ce code n\'est pas le bon : vérifie-le.', code_expire: 'Ce code n\'est plus valable : demandes-en un nouveau.',
    bloque: 'Trop d\'essais : demande un nouveau code.', code6: 'Le code a 6 chiffres.',
    connexion: 'Tu n\'es plus connecté : reconnecte-toi.', introuvable: 'Demande introuvable : actualise la liste.',
    absente: 'Photo introuvable.', copie: 'Copie impossible : sélectionne le texte à la main.'
  };
  var ouverture = Date.now(), etat = 'a_traiter';
  var kg = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
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

  // ---------- liste ----------
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
    $('[data-ref]', li).textContent = e.reference;
    if (e.bon_numero) { badge.textContent = 'Bon ' + e.bon_numero + ' fait'; badge.classList.add('bon'); }
    else if (e.traite_le) { badge.textContent = 'Étiquette envoyée le ' + jourCourt(e.traite_le); badge.classList.add('envoyee'); }
    else badge.textContent = 'Nouvelle';
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

    var traite = $('[data-traite]', li), remettre = $('[data-remettre]', li);
    traite.hidden = !!e.traite_le || !!e.bon_numero;
    remettre.hidden = !e.traite_le || !!e.bon_numero;
    var agir = function (action) {
      occupe(li, true);
      api('POST', 'demandes', { action: action, envoi: e.id }).then(function (r) {
        occupe(li, false);
        if (r.status === 401) return montrerConnexion();
        if (r.erreur) return dire(msgListe, r.erreur);
        charger();
      });
    };
    traite.addEventListener('click', function () { agir('traite'); });
    remettre.addEventListener('click', function () { agir('remettre'); });
    return li;
  }

  function charger() {
    $('[data-chargement]').hidden = false;
    api('GET', 'demandes?etat=' + etat).then(function (r) {
      $('[data-chargement]').hidden = true;
      if (r.status === 401) return montrerConnexion();
      cx.hidden = true; liste.hidden = false; deco.hidden = false;
      if (r.erreur) return dire(msgListe, r.erreur);
      dire(msgListe, '');
      ul.textContent = '';
      (r.envois || []).forEach(function (e) { ul.appendChild(carte(e)); });
      var vide = $('[data-vide]');
      vide.textContent = etat === 'a_traiter' ? 'Aucune demande à traiter.' : 'Aucune demande pour le moment.';
      vide.hidden = (r.envois || []).length > 0;
      if (etat === 'a_traiter') $('[data-etat="a_traiter"]').textContent = 'À traiter (' + (r.envois || []).length + ')';
    });
  }
  liste.querySelectorAll('.filtre').forEach(function (b) {
    b.addEventListener('click', function () {
      etat = b.getAttribute('data-etat');
      liste.querySelectorAll('.filtre').forEach(function (x) { x.classList.toggle('actif', x === b); x.setAttribute('aria-pressed', String(x === b)); });
      charger();
    });
  });
  $('[data-actualiser]').addEventListener('click', charger);

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

  charger();
})();
