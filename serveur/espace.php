<?php
declare(strict_types=1);

// /api/espace/… (redirigé ici par .htaccess) : l'espace client du site, mêmes adresses et mêmes réponses que la première
// version faite dans l'appli. code → connexion → compte (coordonnées, RIB), piece (pièce d'identité), envoi (colis).

require __DIR__ . '/lib/espace.php';

$chemin = trim((string) ($_GET['chemin'] ?? ''), '/');
$methode = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    menage_du_jour();
    switch ("$methode $chemin") {
        // 1er pas de la connexion : un code à 6 chiffres envoyé à l'adresse e-mail. Même réponse que le compte existe ou
        // non (il est créé à la première connexion). Un robot reçoit « ok » sans que rien parte.
        case 'POST code':
            origine_refusee();
            $b = corps_json();
            if (!$b) refus('illisible');
            if (robot($b)) repondre(['ok' => true]);
            $email = email_valide($b['email'] ?? null);
            if (!$email) refus('email');
            if (envoyer_code($email, langue_de($b['langue'] ?? null), 'espace', lire_creation($b['creation'] ?? null)) === 'trop') refus('trop', 429);
            repondre(['ok' => true]);

        // 2e pas : le code reçu. Bon code → le compte (créé à la première connexion) et le cookie de session (60 jours).
        case 'POST connexion':
            origine_refusee();
            $b = corps_json();
            $email = email_valide($b['email'] ?? null);
            if (!$b || !$email) refus('email');
            $r = verifier_code($email, (string) preg_replace('/\s/', '', (string) ($b['code'] ?? '')));
            if ($r !== 'ok') refus($r, $r === 'bloque' ? 429 : 400);
            $c = appliquer_creation(compte_par_email($email, langue_de($b['langue'] ?? null)), prendre_creation($email));
            repondre(['compte' => compte_visible($c), 'envois' => array_map('envoi_visible', envois_du($c['id']))], 200, cookie_session($c['id']));

        // Connexion par le bouton « Me connecter » de l'e-mail (proposition 72) : la page ouverte par le lien envoie le jeton
        // (un logiciel qui ouvre les liens des e-mails tout seul ne connecte donc personne).
        case 'POST lien':
            origine_refusee();
            $b = corps_json();
            $email = utiliser_lien((string) ($b['jeton'] ?? ''));
            if (!$email) refus('lien_expire');
            $c = appliquer_creation(compte_par_email($email, langue_de($b['langue'] ?? null)), prendre_creation($email));
            repondre(['compte' => compte_visible($c), 'envois' => array_map('envoi_visible', envois_du($c['id']))], 200, cookie_session($c['id']));

        case 'DELETE connexion':
            origine_refusee();
            repondre(['ok' => true], 200, cookie_efface());

        // Le compte de la personne connectée et ses demandes (compte vide si personne n'est connecté).
        case 'GET compte':
            $c = compte_connecte();
            if (!$c) repondre(['compte' => null]);
            repondre(['compte' => compte_visible($c), 'envois' => array_map('envoi_visible', envois_du($c['id']))]);

        // Ses coordonnées (section « coordonnees ») ou son RIB (section « rib »).
        case 'PUT compte':
            origine_refusee();
            $c = compte_connecte();
            if (!$c) refus('connexion', 401);
            $b = corps_json();
            if (!$b) refus('illisible');
            $section = (string) ($b['section'] ?? '');
            if ($section === 'prevenir') {
                // être prévenu des étapes par e-mail (au départ), WhatsApp ou les deux (proposition 95)
                $p = (string) ($b['prevenir'] ?? '');
                if (!in_array($p, PREVENIR, true)) refus('prevenir');
                if ($p !== 'email' && !numero_international($c['telephone'])) refus('telephone_whatsapp');
                $n = ['prevenir' => $p, 'maj_le' => iso()] + $c;
                enregistrer_compte($n);
                repondre(['compte' => compte_visible($n)]);
            }
            $n = $section === 'rib' ? lire_rib($b, $c) : lire_coordonnees($b, $c);
            if (is_string($n)) refus($n);
            enregistrer_compte($n);
            repondre(['compte' => compte_visible($n)]);

        // Le RIB en entier, pour la personne elle-même (bouton « Voir », proposition 82) ; jamais gardé en cache.
        case 'GET rib':
            $c = compte_connecte();
            if (!$c) refus('connexion', 401);
            header('Cache-Control: no-store');
            repondre(['iban' => $c['rib']['iban'] ?? null]);

        // Le bon d'achat redemandé (proposition 98, version de Malik : le numéro et un bouton) : Malik reçoit un e-mail et le
        // renvoie lui-même ; une fois par jour au plus pour un même bon.
        case 'POST bon':
            origine_refusee();
            $c = compte_connecte();
            if (!$c) refus('connexion', 401);
            $b = corps_json();
            $e = envoi_du_compte($c, (string) ($b['reference'] ?? ''));
            if (!$e || !$e['bon_numero']) refus('introuvable', 404);
            if ($e['bon_redemande_le'] && $e['bon_redemande_le'] > iso(ms() - 86400000)) refus('deja', 429);
            bd()->prepare('UPDATE espace_envois SET bon_redemande_le = ? WHERE id = ?')->execute([iso(), $e['id']]);
            apres_reponse(fn () => mail_bon_redemande($c, $e));
            repondre(['ok' => true]);

        // Suppression du compte : effacé avec ses photos et ses demandes ; si la personne a vendu, fermé seulement, sa pièce
        // d'identité restant pour justifier l'achat (proposition 86).
        case 'DELETE compte':
            origine_refusee();
            $c = compte_connecte();
            if (!$c) refus('connexion', 401);
            $garde = a_vendu($c);
            supprimer_compte($c);
            repondre(['ok' => true, 'garde' => $garde], 200, cookie_efface());

        // La pièce d'identité, déposée une seule fois : type, numéro, date de fin et photos recto / verso (réduites par le
        // téléphone en JPEG de 4 Mo au plus ; une nouvelle photo remplace l'ancienne, le passeport n'a pas de verso).
        case 'POST piece':
            origine_refusee();
            $c = compte_connecte();
            if (!$c) refus('connexion', 401);
            if (!$_POST && !$_FILES) refus((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0 ? 'photo_lourde' : 'illisible');
            $champs = lire_piece($_POST);
            if (is_string($champs)) refus($champs);
            $nouvelles = [];
            foreach (['recto', 'verso'] as $face) {
                $f = $_FILES[$face] ?? null;
                if (!is_array($f) || ($f['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) continue;
                if (in_array($f['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) || (int) $f['size'] > PHOTO_MAX) refus('photo_lourde');
                if ($f['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) refus('photo');
                if (!(int) $f['size']) continue;
                $octets = (string) file_get_contents($f['tmp_name']);
                if (!est_jpeg($octets)) refus('photo');
                $nouvelles[$face] = $octets;
            }
            $avant = $c['piece'];
            if (!isset($nouvelles['recto']) && empty($avant['recto'])) refus('recto');
            if ($champs['type'] !== 'Passeport' && !isset($nouvelles['verso']) && empty($avant['verso'])) refus('verso');
            $piece = $champs + ['recto' => $avant['recto'] ?? null, 'verso' => $avant['verso'] ?? null, 'depose_le' => iso()];
            $anciennes = [];
            foreach ($nouvelles as $face => $octets) {
                if ($piece[$face]) $anciennes[] = $piece[$face];
                $piece[$face] = garder_photo($c['id'], $face, $octets);
            }
            $n = ['piece' => $piece, 'maj_le' => $piece['depose_le']] + $c;
            enregistrer_compte($n);
            foreach ($anciennes as $nom) effacer_photo($c['id'], $nom);
            repondre(['compte' => compte_visible($n)]);

        // La photo, pour la personne connectée seulement, jamais gardée en cache.
        case 'GET piece':
            $c = compte_connecte();
            if (!$c) refus('connexion', 401);
            $face = (string) ($_GET['face'] ?? '');
            $octets = in_array($face, ['recto', 'verso'], true) ? lire_photo($c['id'], $c['piece'][$face] ?? null) : null;
            if ($octets === null) refus('absente', 404);
            servir_photo($octets);

        // Demande d'envoi par colis (compte complet) : 1 à 5 colis de 20 kg au plus, virement (RIB du compte) ou chèque,
        // attestation sur l'honneur ; 3 demandes par jour au plus. Malik reçoit un e-mail, la personne sa référence et son
        // prix garanti.
        case 'POST envoi':
            origine_refusee();
            $c = compte_connecte();
            if (!$c) refus('connexion', 401);
            if (manques($c)) refus('incomplet');
            $b = corps_json();
            if (!$b) refus('illisible');
            $brut = is_array($b['colis'] ?? null) ? array_slice(array_values($b['colis']), 0, COLIS_MAX + 1) : [];
            $colis = array_map(fn ($x) => [
                'matiere' => is_array($x) && in_array($x['matiere'] ?? null, MATIERES, true) ? $x['matiere'] : '',
                'poids' => is_array($x) && is_numeric($x['poids'] ?? null) ? round((float) $x['poids'] * 10) / 10 : 0.0,
            ], $brut);
            if (!$colis || count($colis) > COLIS_MAX) refus('colis');
            foreach ($colis as $x) if ($x['matiere'] === '' || !($x['poids'] > 0) || $x['poids'] > KG_PAR_COLIS) refus('colis');
            $paiement = ($b['paiement'] ?? '') === 'Chèque' ? 'Chèque' : 'Virement';
            if ($paiement === 'Virement' && !$c['rib']) refus('rib');
            if (($b['attestation'] ?? null) !== true) refus('attestation');
            $hier = iso(ms() - 86400000);
            if (count(array_filter(envois_du($c['id']), fn ($e) => $e['cree_le'] > $hier)) >= ENVOIS_PAR_JOUR) refus('trop', 429);
            $e = [
                'id' => uuid(), 'reference' => reference_envoi(), 'compte' => $c['id'], 'cree_le' => iso(), 'colis' => $colis,
                'total' => round(array_sum(array_column($colis, 'poids')) * 10) / 10, 'paiement' => $paiement,
                'message' => coupe(trim(is_string($b['message'] ?? null) ? $b['message'] : ''), 600),
                'traite_le' => null, 'traite_par' => '', 'bon_numero' => null, 'bon_le' => null,
                // prix du jour et fin de sa garantie (7 jours, jamais après la fin du mois), gardés avec la demande (proposition 50)
                'prix_kg' => prix_site()['kg'], 'garanti_jusqu' => garanti_jusqu(jour_paris()),
            ];
            creer_envoi($e);
            $e = lire_envoi($e['id']) ?? $e;
            apres_reponse(fn () => mail_nouvelle_demande($c, $e));
            apres_reponse(fn () => mail_envoi_recu($c, $e));
            repondre(['envoi' => envoi_visible($e)]);

        default:
            refus('inconnu', 404);
    }
} catch (Throwable $e) {
    erreur_serveur($e);
}
