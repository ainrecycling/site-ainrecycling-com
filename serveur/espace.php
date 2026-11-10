<?php
declare(strict_types=1);




require __DIR__ . '/lib/espace.php';
require __DIR__ . '/lib/google.php';

$chemin = trim((string) ($_GET['chemin'] ?? ''), '/');
$methode = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    menage_du_jour();
    switch ("$methode $chemin") {


        case 'POST code':
            origine_refusee();
            $b = corps_json();
            if (!$b) refus('illisible');
            if (robot($b)) repondre(['ok' => true]);
            $email = email_valide($b['email'] ?? null);
            if (!$email) refus('email');
            if (!sous_la_limite('code:' . empreinte_ip(), 12)) refus('trop', 429);
            if (envoyer_code($email, langue_de($b['langue'] ?? null), 'espace', lire_creation($b['creation'] ?? null)) === 'trop') refus('trop', 429);
            repondre(['ok' => true]);


        case 'POST connexion':
            origine_refusee();
            $b = corps_json();
            $email = email_valide($b['email'] ?? null);
            if (!$b || !$email) refus('email');
            $r = verifier_code($email, (string) preg_replace('/\s/', '', (string) ($b['code'] ?? '')));
            if ($r !== 'ok') refus($r, $r === 'bloque' ? 429 : 400);
            $c = appliquer_creation(compte_par_email($email, langue_de($b['langue'] ?? null)), prendre_creation($email));
            repondre(['compte' => compte_visible($c), 'envois' => array_map('envoi_visible', envois_du($c['id']))], 200, cookie_session($c['id']));



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


        case 'GET compte':
            $c = compte_connecte();
            if (!$c) repondre(['compte' => null]);
            repondre(['compte' => compte_visible($c), 'envois' => array_map('envoi_visible', envois_du($c['id']))]);


        case 'PUT compte':
            origine_refusee();
            $c = compte_connecte();
            if (!$c) refus('connexion', 401);
            $b = corps_json();
            if (!$b) refus('illisible');
            $section = (string) ($b['section'] ?? '');
            if ($section === 'prevenir') {

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


        case 'GET rib':
            $c = compte_connecte();
            if (!$c) refus('connexion', 401);
            header('Cache-Control: no-store');
            repondre(['iban' => $c['rib']['iban'] ?? null]);



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



        case 'DELETE compte':
            origine_refusee();
            $c = compte_connecte();
            if (!$c) refus('connexion', 401);
            $garde = a_vendu($c);
            supprimer_compte($c);
            repondre(['ok' => true, 'garde' => $garde], 200, cookie_efface());



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


        case 'GET piece':
            $c = compte_connecte();
            if (!$c) refus('connexion', 401);
            $face = (string) ($_GET['face'] ?? '');
            $octets = in_array($face, ['recto', 'verso'], true) ? lire_photo($c['id'], $c['piece'][$face] ?? null) : null;
            if ($octets === null) refus('absente', 404);
            servir_photo($octets);




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

            if (($b['conditions'] ?? null) !== true) refus('conditions');
            $hier = iso(ms() - 86400000);
            if (count(array_filter(envois_du($c['id']), fn ($e) => $e['cree_le'] > $hier)) >= ENVOIS_PAR_JOUR) refus('trop', 429);
            $e = [
                'id' => uuid(), 'reference' => reference_envoi(), 'compte' => $c['id'], 'cree_le' => iso(), 'colis' => $colis,
                'total' => round(array_sum(array_column($colis, 'poids')) * 10) / 10, 'paiement' => $paiement,
                'message' => coupe(trim(is_string($b['message'] ?? null) ? $b['message'] : ''), 600),
                'traite_le' => null, 'traite_par' => '', 'bon_numero' => null, 'bon_le' => null,

                'prix_kg' => prix_site()['kg'], 'garanti_jusqu' => garanti_jusqu(jour_paris()),
                'cgv_version' => CGV_VERSION, 'cgv_le' => iso(),
            ];
            creer_envoi($e);
            $e = lire_envoi($e['id']) ?? $e;
            apres_reponse(fn () => mail_nouvelle_demande($c, $e));
            apres_reponse(fn () => mail_envoi_recu($c, $e));
            repondre(['envoi' => envoi_visible($e)]);


        case 'GET google':
            google_depart(langue_de($_GET['langue'] ?? null));

        case 'GET google/retour':
            google_arrivee();

        default:
            refus('inconnu', 404);
    }
} catch (Throwable $e) {
    erreur_serveur($e);
}
