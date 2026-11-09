<?php
declare(strict_types=1);

// /api/gestion/… : la page réservée à Malik (site/gestion/), pour voir les demandes d'envoi par colis, la pièce
// d'identité et le RIB, et cocher « étiquette envoyée ». Connexion par un code envoyé seulement aux adresses de la liste
// « admins » du fichier de réglages (écrite à l'installation, jamais dans le code) ; cookie « gestion » signé, 30 jours.

// Depuis le 8 nov. 2026 (propositions 54, 55, 57 et 65) : aussi le prix du site, les annonces, les pages vues et la
// sauvegarde de l'espace client.

require __DIR__ . '/lib/espace.php';
require __DIR__ . '/lib/sauvegarde.php';
require __DIR__ . '/lib/google.php'; // aussi admins() et cookie_gestion() (lib/admins.php)

/** Ce que montre la page de gestion en haut : prix, annonces, alerte prix, pages vues, sauvegarde. */
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
        // connexion avec Google (propositions 68 et 74) : prête ou non, et l'adresse de retour à déclarer chez Google
        'google' => ['pret' => google_cle() !== null, 'client_id' => (string) ((reglage_site('google') ?? [])['client_id'] ?? ''), 'retour' => google_retour()],
    ];
}

/** L'adresse de Malik connecté (toujours dans la liste), sinon refus. */
function exiger_admin(): string
{
    $s = lire_cookie_signe(COOKIE_GESTION, 'gestion');
    $email = is_string($s['e'] ?? null) ? $s['e'] : '';
    if ($email === '' || !in_array($email, admins(), true)) refus('connexion', 401);
    return $email;
}

$chemin = trim((string) ($_GET['chemin'] ?? ''), '/');
$methode = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    menage_du_jour();
    switch ("$methode $chemin") {
        // Code à 6 chiffres, envoyé seulement si l'adresse est dans la liste (sinon « ok » sans rien envoyer).
        case 'POST code':
            origine_refusee();
            $b = corps_json();
            if (!$b) refus('illisible');
            if (robot($b)) repondre(['ok' => true]);
            $email = email_valide($b['email'] ?? null);
            if (!$email) refus('email');
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
            repondre(['email' => $email], 200, cookie_gestion($email));

        case 'DELETE connexion':
            origine_refusee();
            repondre(['ok' => true], 200, cookie_efface(COOKIE_GESTION, 'Strict'));

        // Les demandes : « a_traiter » (étiquette pas encore envoyée) ou « toutes ».
        case 'GET demandes':
            $email = exiger_admin();
            $etat = ($_GET['etat'] ?? '') === 'toutes' ? 'toutes' : 'a_traiter';
            repondre(['email' => $email, 'envois' => demandes_pour_malik($etat)]);

        // ✓ Étiquette envoyée, ou Annuler.
        case 'POST demandes':
            origine_refusee();
            exiger_admin();
            $b = corps_json();
            $action = (string) ($b['action'] ?? '');
            if (!in_array($action, ['traite', 'remettre', 'recu', 'sans_recu', 'pese', 'sans_pese', 'paye', 'sans_paye'], true)) refus('action');
            $e = marquer_envoi((string) ($b['envoi'] ?? ''), $action, 'Malik (site)', '', is_array($b['valeurs'] ?? null) ? $b['valeurs'] : []);
            if (!$e) refus($action === 'pese' ? 'poids' : 'introuvable', $action === 'pese' ? 400 : 404);
            repondre(['envoi' => $e, 'whatsapp' => prevenir_etape($e, $action)]);

        // Les réglages du site (8 nov. 2026) : prix et son historique, annonces, abonnés à l'alerte prix, pages vues,
        // dernière sauvegarde.
        case 'GET reglages':
            exiger_admin();
            repondre(reglages_pour_malik());

        // Nouveau prix par colis : « Tu es sûr ? » (réponse « confirmer ») sous 30 €/kg, au-dessus de 80 €/kg ou pour un
        // écart de plus de 25 % ; s'il monte, les abonnés à l'alerte prix sont prévenus (sauf si Malik décoche).
        case 'POST prix':
            origine_refusee();
            $email = exiger_admin();
            $b = corps_json() ?? [];
            $kg = lire_prix($b['kg'] ?? null);
            if ($kg === null) refus('prix');
            $avant = prix_site()['kg'];
            if (abs($kg - $avant) < 0.001) refus('meme_prix');
            $doute = $kg < PRIX_DOUTE_BAS || $kg > PRIX_DOUTE_HAUT || abs($kg - $avant) / max($avant, 1) > 0.25;
            if ($doute && ($b['confirme'] ?? null) !== true) refus('confirmer', 409);
            [$ancien] = changer_prix($kg, $email);
            $prevenus = 0;
            if ($kg > $ancien['kg'] && ($b['prevenir'] ?? true) !== false) $prevenus = programmer_alertes($kg);
            elseif ($kg < $ancien['kg']) annuler_alertes();
            repondre(reglages_pour_malik() + ['prevenus' => $prevenus]);

        // Annonce en haut du site : ajouter { type, debut, fin, villes } ou retirer { action: "retirer", id }.
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

        // La clé Google collée par Malik (identifiant et code secret du client OAuth), gardée chiffrée ; vide = retirée.
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

        // Sauvegarde de l'espace client, fermée par le mot de passe choisi par Malik (10 caractères au moins).
        case 'POST sauvegarde':
            origine_refusee();
            $email = exiger_admin();
            $b = corps_json() ?? [];
            $mdp = (string) ($b['mot_de_passe'] ?? '');
            if (mb_strlen($mdp) < 10 || mb_strlen($mdp) > 200) refus('mot_de_passe');
            servir_sauvegarde($mdp, $email);

        // Photo de la pièce d'un compte, déchiffrée, jamais gardée en cache.
        case 'GET piece':
            exiger_admin();
            $c = lire_compte((string) ($_GET['compte'] ?? ''));
            $face = (string) ($_GET['face'] ?? '');
            $octets = $c && in_array($face, ['recto', 'verso'], true) ? lire_photo($c['id'], $c['piece'][$face] ?? null) : null;
            if ($octets === null) refus('absente', 404);
            servir_photo($octets);

        default:
            refus('inconnu', 404);
    }
} catch (Throwable $e) {
    erreur_serveur($e);
}
