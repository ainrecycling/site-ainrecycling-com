<?php
declare(strict_types=1);

// /api/gestion/… : la page réservée à Malik (site/gestion/), pour voir les demandes d'envoi par colis, la pièce
// d'identité et le RIB, et cocher « étiquette envoyée ». Connexion par un code envoyé seulement aux adresses de la liste
// « admins » du fichier de réglages (écrite à l'installation, jamais dans le code) ; cookie « gestion » signé, 30 jours.

require __DIR__ . '/lib/espace.php';

const COOKIE_GESTION = 'gestion';
const GESTION_JOURS = 30;

function admins(): array
{
    return array_map('strtolower', (array) reglage('admins', []));
}

function cookie_gestion(string $email): string
{
    $charge = b64url((string) json_encode(['e' => $email, 'exp' => ms() + GESTION_JOURS * 86400000]));
    return COOKIE_GESTION . "=$charge." . signer('gestion|' . $charge) . '; Path=/; HttpOnly; ' . (https() || !mode_essai() ? 'Secure; ' : '')
        . 'SameSite=Strict; Max-Age=' . (GESTION_JOURS * 86400);
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
            if (!in_array($action, ['traite', 'remettre'], true)) refus('action');
            $e = marquer_envoi((string) ($b['envoi'] ?? ''), $action, 'Malik (site)');
            if (!$e) refus('introuvable', 404);
            repondre(['envoi' => $e]);

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
