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
            if (!sous_la_limite('code:' . empreinte_ip(), 12)) refus('trop_jour', 429);

            $r = envoyer_code($email, langue_de($b['langue'] ?? null), 'espace', lire_creation($b['creation'] ?? null));
            if ($r !== 'ok') refus($r, 429);
            repondre(['ok' => true], 200, cookie_lien($email));


        case 'POST connexion':
            origine_refusee();
            $b = corps_json();
            $email = email_valide($b['email'] ?? null);
            if (!$b || !$email) refus('email');
            $code = (string) preg_replace('/\s/', '', (string) ($b['code'] ?? ''));
            $r = verifier_code($email, $code);
            if ($r !== 'ok') refus($r, $r === 'bloque' ? 429 : 400);


            $c = appliquer_creation(compte_par_email($email, langue_de($b['langue'] ?? null)), prendre_creation($email, $code));
            fermer_connexions_en_attente($email);
            repondre(['compte' => compte_visible($c), 'envois' => array_map('envoi_visible', envois_du($c['id']))], 200, cookie_session($c['id']));





        case 'POST lien':
            origine_refusee();
            $b = corps_json();
            $l = utiliser_lien((string) ($b['jeton'] ?? ''));
            if (isset($l['erreur'])) refus($l['erreur']);
            $email = $l['email'];
            $c = appliquer_creation(compte_par_email($email, langue_de($b['langue'] ?? null)), prendre_creation($email));
            fermer_connexions_en_attente($email);
            repondre(['compte' => compte_visible($c), 'envois' => array_map('envoi_visible', envois_du($c['id']))], 200, cookie_session($c['id']));



        case 'DELETE connexion':
            origine_refusee();
            $c = compte_connecte();
            if ($c) couper_sessions($c['id']);
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



        case 'POST depot':
            origine_refusee();
            $c = compte_connecte();
            if (!$c) refus('connexion', 401);
            $b = corps_json() ?? [];
            $e = envoi_du_compte($c, (string) ($b['reference'] ?? ''));
            $n = $e ? repondre_depot($e, (string) ($b['reponse'] ?? '')) : null;
            if (!$n) refus('introuvable', 404);
            repondre(['envoi' => envoi_visible($n)]);




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



            $reprises = $avant && $avant['type'] === $champs['type'] ? ['recto' => $avant['recto'], 'verso' => $avant['verso']] : ['recto' => null, 'verso' => null];
            if ($champs['type'] === 'Passeport') {
                $reprises['verso'] = null;
                unset($nouvelles['verso']);
            }
            if (!isset($nouvelles['recto']) && empty($reprises['recto'])) refus('recto');
            if ($champs['type'] !== 'Passeport' && !isset($nouvelles['verso']) && empty($reprises['verso'])) refus('verso');
            if (!place_pour_pieces(array_sum(array_map('strlen', $nouvelles)))) refus('place_pleine', 507);
            $piece = $champs + $reprises + ['depose_le' => iso()];
            foreach ($nouvelles as $face => $octets) $piece[$face] = garder_photo($c['id'], $face, $octets);
            place_pieces_ajouter(array_sum(array_map(fn ($o) => strlen($o) + 32, $nouvelles)));
            $n = ['piece' => $piece, 'maj_le' => $piece['depose_le']] + $c;
            enregistrer_compte($n);

            foreach (['recto', 'verso'] as $face) {
                if (!empty($avant[$face]) && $avant[$face] !== $piece[$face]) effacer_photo($c['id'], $avant[$face]);
            }
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
            $colis = lire_colis($b['colis'] ?? null);
            if (!$colis) refus('colis');
            $paiement = ($b['paiement'] ?? '') === 'Chèque' ? 'Chèque' : 'Virement';
            if ($paiement === 'Virement' && !$c['rib']) refus('rib');
            if (($b['attestation'] ?? null) !== true) refus('attestation');

            if (($b['conditions'] ?? null) !== true) refus('conditions');
            $hier = iso(ms() - 86400000);
            if (count(array_filter(envois_du($c['id']), fn ($e) => $e['cree_le'] > $hier)) >= ENVOIS_PAR_JOUR) refus('trop_jour', 429);


            $transport = ($b['transport'] ?? '') === 'vendeur' ? 'vendeur' : 'offert';
            $prix = prix_site();
            $e = [
                'id' => uuid(), 'reference' => reference_envoi(), 'compte' => $c['id'], 'cree_le' => iso(), 'colis' => $colis,
                'total' => round(array_sum(array_column($colis, 'poids')) * 10) / 10, 'paiement' => $paiement,
                'message' => coupe(trim(is_string($b['message'] ?? null) ? $b['message'] : ''), 600),
                'traite_le' => $transport === 'vendeur' ? iso() : null, 'traite_par' => $transport === 'vendeur' ? 'transport du vendeur' : '',
                'bon_numero' => null, 'bon_le' => null, 'transport' => $transport,

                'prix_kg' => $transport === 'vendeur' ? (float) ($prix['depot'] ?? ($prix['kg'] + 3)) : $prix['kg'], 'garanti_jusqu' => garanti_jusqu(jour_paris()),


                'cgv_version' => conditions_gardees($c), 'cgv_le' => iso(),

                'connu' => lire_connu($b['connu'] ?? null),
            ];
            creer_envoi($e);

            try {
                $e = lire_envoi($e['id']) ?? $e;
            } catch (Throwable $x) {
                journaliser('demande ' . $e['reference'] . ' enregistrée, relecture impossible : ' . resume_erreur($x));
            }



            $pourVendeur = mail_compte_permis($c);
            $pourMalik = mail_compte_permis($c);
            if ($pourMalik) apres_reponse(fn () => mail_nouvelle_demande($c, $e));
            if ($pourVendeur) apres_reponse(fn () => mail_envoi_recu($c, $e));

            if (!est_test($c)) apres_reponse(fn () => notifier('demande', $e['reference']));


            repondre(['envoi' => envoi_visible($e), 'mail' => $pourVendeur]);



        case 'PUT envoi':
            origine_refusee();
            $c = compte_connecte();
            if (!$c) refus('connexion', 401);
            if (!est_test($c)) refus('reserve', 403);
            $b = corps_json();
            if (!$b) refus('illisible');
            $e = envoi_du_compte($c, (string) ($b['reference'] ?? ''));
            if (!$e) refus('introuvable', 404);
            $colis = lire_colis($b['colis'] ?? null);
            if (!$colis) refus('colis');
            $paiement = ($b['paiement'] ?? '') === 'Chèque' ? 'Chèque' : 'Virement';
            if ($paiement === 'Virement' && !$c['rib']) refus('rib');
            $n = modifier_envoi($e, $colis, $paiement, coupe(trim(is_string($b['message'] ?? null) ? $b['message'] : ''), 600));
            if (!$n) refus('introuvable', 404);
            repondre(['envoi' => envoi_visible($n)]);


        case 'DELETE envoi':
            origine_refusee();
            $c = compte_connecte();
            if (!$c) refus('connexion', 401);
            if (!est_test($c)) refus('reserve', 403);
            $e = envoi_du_compte($c, (string) ($_GET['reference'] ?? ''));
            if (!$e) refus('introuvable', 404);
            supprimer_envoi($e);
            repondre(['ok' => true, 'envois' => array_map('envoi_visible', envois_du($c['id']))]);



        case 'POST suivi':
            origine_refusee();
            $c = compte_connecte();
            if (!$c) refus('connexion', 401);
            $b = corps_json();
            if (!$b) refus('illisible');
            $e = envoi_du_compte($c, (string) ($b['reference'] ?? ''));
            if (!$e) refus('introuvable', 404);
            if ($e['transport'] !== 'vendeur' || ($e['recu_le'] ?? null)) refus('transport', 403);
            $suivis = lire_suivis($b['suivis'] ?? null, max(1, count($e['colis'])));
            if ($suivis === null) refus('suivi');
            if (!sous_la_limite('suivi:' . substr(hash('sha256', $c['id']), 0, 24), SUIVIS_PAR_JOUR)) refus('trop_jour', 429);
            $premier = !$e['suivis'] && $suivis;
            $n = noter_suivis($e, $suivis);
            if (!$n) refus('introuvable', 404);


            $mail = $premier && !est_test($c) && mail_compte_permis($c);
            if ($mail) apres_reponse(fn () => mail_suivi($c, $n));
            repondre(['envoi' => envoi_visible($n), 'mail' => $mail]);




        case 'POST avis':
            origine_refusee();
            $c = compte_connecte();
            if (!$c) refus('connexion', 401);
            $b = corps_json();
            if (!$b) refus('illisible');
            $e = envoi_du_compte($c, (string) ($b['reference'] ?? ''));
            if (!$e) refus('introuvable', 404);
            if (!avis_possible($c, $e)) refus('pas_paye', 403);
            $a = lire_avis($b);
            if (!$a) refus('note');
            if (!sous_la_limite('avis:' . substr(hash('sha256', $c['id']), 0, 24), AVIS_PAR_JOUR)) refus('trop_jour', 429);
            $premier = !$e['avis'];
            $n = noter_avis($e, $a);
            if (!$n) refus('introuvable', 404);
            if ($premier && !est_test($c)) apres_reponse(fn () => mail_avis($c, $n));
            repondre(['envoi' => envoi_visible($n)]);


        case 'DELETE avis':
            origine_refusee();
            $c = compte_connecte();
            if (!$c) refus('connexion', 401);
            $e = envoi_du_compte($c, (string) ($_GET['reference'] ?? ''));
            if (!$e) refus('introuvable', 404);
            $n = noter_avis($e, null);
            if (!$n) refus('introuvable', 404);
            repondre(['envoi' => envoi_visible($n)]);


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
