<?php
declare(strict_types=1);








require __DIR__ . '/lib/espace.php';
require __DIR__ . '/lib/sauvegarde.php';
require __DIR__ . '/lib/google.php';


function reglages_pour_malik(): array
{
    $auj = jour_paris();
    return [
        'prix' => prix_site(), 'aujourdhui' => $auj, 'garanti_jusqu' => garanti_jusqu($auj),
        'limites' => ['bas' => PRIX_DOUTE_BAS, 'haut' => PRIX_DOUTE_HAUT, 'min' => PRIX_MIN, 'max' => PRIX_MAX],
        'annonces' => annonces_actives(),
        'abonnes' => nombre_abonnes(), 'alertes_en_attente' => alertes_en_attente(),
        'visites' => visites_resume(),
        'sauvegarde' => reglage_site('sauvegarde'), 'sauvegarde_zip' => zip_chiffre_possible(),

        'connexions' => array_values((array) (reglage_site('connexions') ?? [])), 'messages_a_repondre' => messages_a_repondre(),
        'google' => ['pret' => google_cle() !== null, 'client_id' => (string) ((reglage_site('google') ?? [])['client_id'] ?? ''), 'retour' => google_retour()],
    ];
}



function lire_deux_prix(array $b): array
{
    $depot = lire_prix($b['depot'] ?? null);
    if ($depot === null) refus('prix');
    $k = $b['kg'] ?? null;
    $kg = $k === null || $k === '' ? lire_prix($depot - ECART_DEPOT) : lire_prix($k);
    if ($kg === null) refus('prix');
    return [$kg, $depot];
}


function exiger_admin(): string
{
    $s = lire_cookie_signe(COOKIE_GESTION, 'gestion');
    $email = is_string($s['e'] ?? null) ? $s['e'] : '';

    $emis = (int) ($s['exp'] ?? 0) - GESTION_JOURS * 86400000;
    if ($email === '' || !in_array($email, admins(), true) || $emis < (int) (reglage_site('gestion_epoch') ?? 0)) refus('connexion', 401);
    return $email;
}

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
            if (!sous_la_limite('codeg:' . empreinte_ip(), 12)) refus('trop', 429);
            if (in_array($email, admins(), true) && envoyer_code($email, 'fr', 'gestion') === 'trop') refus('trop', 429);
            repondre(['ok' => true]);

        case 'POST connexion':
            origine_refusee();
            $b = corps_json();
            $email = email_valide($b['email'] ?? null);
            if (!$b || !$email) refus('email');
            if (!in_array($email, admins(), true)) refus('code_expire');
            $r = verifier_code($email, (string) preg_replace('/\s/', '', (string) ($b['code'] ?? '')), 'gestion');
            if ($r !== 'ok') refus($r, $r === 'bloque' ? 429 : 400);
            noter_connexion_gestion($email);
            repondre(['email' => $email], 200, cookie_gestion($email));

        case 'DELETE connexion':
            origine_refusee();
            repondre(['ok' => true], 200, cookie_efface(COOKIE_GESTION, 'Strict'));


        case 'GET demandes':
            $email = exiger_admin();
            $etat = ($_GET['etat'] ?? '') === 'toutes' ? 'toutes' : 'a_traiter';
            repondre(['email' => $email, 'envois' => demandes_pour_malik($etat)]);


        case 'POST demandes':
            origine_refusee();
            exiger_admin();
            $b = corps_json();
            $action = (string) ($b['action'] ?? '');

            if (!in_array($action, ['traite', 'remettre', 'recu', 'sans_recu', 'pese', 'sans_pese', 'accord', 'sans_accord', 'paye', 'sans_paye', 'retard'], true)) refus('action');
            $e = marquer_envoi((string) ($b['envoi'] ?? ''), $action, 'Malik (site)', '', is_array($b['valeurs'] ?? null) ? $b['valeurs'] : []);
            if (!$e) refus($action === 'pese' ? 'poids' : 'introuvable', $action === 'pese' ? 400 : 404);
            repondre(['envoi' => $e, 'whatsapp' => prevenir_etape($e, $action)]);



        case 'GET reglages':
            exiger_admin();
            repondre(reglages_pour_malik());



        case 'POST prix':
            origine_refusee();
            $email = exiger_admin();
            $b = corps_json() ?? [];

            [$kg, $depot] = lire_deux_prix($b);
            $p0 = prix_site();
            $avant = $p0['kg'];
            if (abs($kg - $avant) < 0.001 && abs($depot - $p0['depot']) < 0.001) refus('meme_prix');
            $doute = $kg < PRIX_DOUTE_BAS || $kg > PRIX_DOUTE_HAUT || abs($kg - $avant) / max($avant, 1) > 0.25;
            if ($doute && ($b['confirme'] ?? null) !== true) refus('confirmer', 409);
            [$ancien] = changer_prix($kg, $email, $depot);
            $prevenus = 0;
            if ($kg > $ancien['kg'] && ($b['prevenir'] ?? true) !== false) $prevenus = programmer_alertes($kg);
            elseif ($kg < $ancien['kg']) annuler_alertes();
            repondre(reglages_pour_malik() + ['prevenus' => $prevenus]);



        case 'POST prix-programme':
            origine_refusee();
            $email = exiger_admin();
            $b = corps_json() ?? [];
            if (($b['action'] ?? '') === 'annuler') {
                programmer_prix(null, $email);
                repondre(reglages_pour_malik());
            }
            [$kg, $depot] = lire_deux_prix($b);
            $jour = jour_valide($b['jour'] ?? null);
            if (!$jour || $jour <= jour_paris() || $jour > plus_jours(jour_paris(), 366)) refus('jour');
            programmer_prix(['kg' => $kg, 'depot' => $depot, 'jour' => $jour, 'prevenir' => ($b['prevenir'] ?? true) !== false], $email);
            repondre(reglages_pour_malik());


        case 'POST annonces':
            origine_refusee();
            $email = exiger_admin();
            $b = corps_json() ?? [];
            if (($b['action'] ?? '') === 'retirer') {
                if (!retirer_annonce((string) ($b['id'] ?? ''), $email)) refus('introuvable', 404);
            } else {
                $a = lire_annonce($b);
                if (is_string($a)) refus($a);
                ajouter_annonce($a, $email);
            }
            repondre(reglages_pour_malik());


        case 'POST google':
            origine_refusee();
            $email = exiger_admin();
            $b = corps_json() ?? [];
            $id = trim((string) ($b['client_id'] ?? ''));
            $secret = trim((string) ($b['secret'] ?? ''));
            if ($id === '' && $secret === '') { ecrire_reglage_site('google', null, $email); repondre(['google' => ['pret' => false]]); }
            if (!preg_match('/^[0-9]{6,}-[a-z0-9]{10,}\.apps\.googleusercontent\.com$/', $id)) refus('client_id');
            if (!preg_match('/^[A-Za-z0-9_-]{20,80}$/', $secret)) refus('secret');
            ecrire_reglage_site('google', ['client_id' => $id, 'secret' => chiffrer($secret)], $email);
            repondre(['google' => ['pret' => true, 'client_id' => $id, 'retour' => google_retour()]]);


        case 'POST sauvegarde':
            origine_refusee();
            $email = exiger_admin();
            $b = corps_json() ?? [];
            $mdp = (string) ($b['mot_de_passe'] ?? '');
            if (mb_strlen($mdp) < 10 || mb_strlen($mdp) > 200) refus('mot_de_passe');
            servir_sauvegarde($mdp, $email);


        case 'GET piece':
            exiger_admin();
            $c = lire_compte((string) ($_GET['compte'] ?? ''));
            $face = (string) ($_GET['face'] ?? '');
            $octets = $c && in_array($face, ['recto', 'verso'], true) ? lire_photo($c['id'], $c['piece'][$face] ?? null) : null;
            if ($octets === null) refus('absente', 404);
            servir_photo($octets);


        case 'GET messages':
            exiger_admin();
            repondre(['messages' => messages_pour_malik()]);

        case 'POST messages':
            origine_refusee();
            exiger_admin();
            $b = corps_json() ?? [];
            $action = (string) ($b['action'] ?? '');
            if (!in_array($action, ['repondu', 'a_repondre', 'supprimer'], true)) refus('action');
            if (!marquer_message((string) ($b['id'] ?? ''), $action)) refus('introuvable', 404);
            repondre(['messages' => messages_pour_malik()]);

        case 'GET message-photo':
            exiger_admin();
            $octets = photo_message((string) ($_GET['id'] ?? ''), (int) ($_GET['n'] ?? 0));
            if ($octets === null) refus('absente', 404);
            servir_image($octets);


        case 'GET visites':
            exiger_admin();
            repondre(visites_detail());


        case 'POST deconnecter-tout':
            origine_refusee();
            $email = exiger_admin();
            ecrire_reglage_site('gestion_epoch', ms(), $email);
            usleep(3000);
            repondre(['ok' => true], 200, cookie_gestion($email));

        default:
            refus('inconnu', 404);
    }
} catch (Throwable $e) {
    erreur_serveur($e);
}
