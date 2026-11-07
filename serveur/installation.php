<?php
declare(strict_types=1);

// /api/installation : écrit une fois le fichier de réglages (secrets) dans le dossier privé, à côté de www, sans FTP ni
// mot de passe OVH. Seul celui qui connaît le jeton d'installation (gardé sur l'ordinateur de Malik, dans
// site-vitrine/outils/ovh, jamais mis en ligne) peut s'en servir : le site ne garde que son empreinte. Sans le bon
// jeton, l'adresse répond « inconnu » comme si elle n'existait pas.
// action « diagnostic » : ce que permet l'hébergement (PHP, extensions, dossier privé) ; « installer » : premier réglage
// (base de données, clé Resend…), crée les clés et les tables ; « modifier » : change un réglage (Malik est prévenu).

require __DIR__ . '/lib/espace.php';
require __DIR__ . '/lib/installation-jeton.php';

const REGLAGES_MODIFIABLES = ['bd', 'resend_cle', 'admins', 'mail_admin', 'origines', 'adresse_site', 'expediteur'];

function ecrire_config(array $c): void
{
    $f = prive() . '/config.php';
    $texte = "<?php\n// Réglages secrets du site (écrits par serveur/installation.php). Ne jamais copier ce fichier ailleurs.\nreturn "
        . var_export($c, true) . ";\n";
    if (file_put_contents($f, $texte, LOCK_EX) === false) throw new RuntimeException('réglages non écrits');
    @chmod($f, 0600);
    if (function_exists('opcache_invalidate')) @opcache_invalidate($f, true);
}

function preparer_dossier_prive(): void
{
    $d = prive();
    foreach (['', '/pieces', '/journal'] as $s) {
        if (!is_dir($d . $s) && !mkdir($d . $s, 0700, true) && !is_dir($d . $s)) throw new RuntimeException("dossier $d$s impossible à créer");
    }
    // au cas où le dossier serait un jour servi par erreur : rien n'y est lisible
    @file_put_contents("$d/.htaccess", "Require all denied\n");
}

function tester_bd(array $bd): void
{
    new PDO((string) $bd['dsn'], $bd['utilisateur'] ?? null, $bd['mot_de_passe'] ?? null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
}

function liste_textes($x): array
{
    return array_values(array_filter(array_map(fn ($s) => is_string($s) ? trim($s) : '', (array) $x)));
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') refus('inconnu', 404);
$b = corps_json() ?? [];
if (!hash_equals(JETON_INSTALLATION_SHA256, hash('sha256', (string) ($b['jeton'] ?? '')))) refus('inconnu', 404);
$installe = is_file(prive() . '/config.php');

try {
    switch ((string) ($b['action'] ?? '')) {
        case 'diagnostic':
            $parent = dirname(prive());
            repondre([
                'php' => PHP_VERSION, 'installe' => $installe, 'prive' => prive(),
                'prive_existe' => is_dir(prive()), 'parent_ecrivable' => is_writable($parent),
                'extensions' => array_combine($x = ['pdo_mysql', 'pdo_sqlite', 'openssl', 'curl', 'mbstring', 'json', 'fileinfo'], array_map('extension_loaded', $x)),
                'upload_max_filesize' => ini_get('upload_max_filesize'), 'post_max_size' => ini_get('post_max_size'),
                'memory_limit' => ini_get('memory_limit'), 'https' => https(), 'document_root' => (string) ($_SERVER['DOCUMENT_ROOT'] ?? ''),
                'fastcgi_finish_request' => function_exists('fastcgi_finish_request'),
            ]);

        case 'installer':
            if ($installe) refus('deja_installe', 409);
            $bdr = is_array($b['bd'] ?? null) ? $b['bd'] : null;
            if (!$bdr || !is_string($bdr['dsn'] ?? null)) refus('bd');
            $resend = (string) ($b['resend_cle'] ?? '');
            if (!preg_match('/^re_[A-Za-z0-9_]{10,}$/', $resend)) refus('resend_cle');
            // L'adresse de Malik n'est écrite nulle part dans le code (dépôt GitHub public) : elle arrive avec l'installation.
            $mail_admin = strtolower(trim((string) ($b['mail_admin'] ?? '')));
            if (!filter_var($mail_admin, FILTER_VALIDATE_EMAIL)) refus('mail_admin');
            preparer_dossier_prive();
            try {
                tester_bd($bdr);
            } catch (Throwable $x) {
                refus('bd_inaccessible');
            }
            $cle_appli = b64url(random_bytes(32));
            ecrire_config([
                'bd' => ['dsn' => $bdr['dsn'], 'utilisateur' => $bdr['utilisateur'] ?? null, 'mot_de_passe' => $bdr['mot_de_passe'] ?? null],
                'resend_cle' => $resend,
                'expediteur' => (string) ($b['expediteur'] ?? 'Ain Recycling <contact@ainrecycling.com>'),
                'mail_admin' => $mail_admin,
                'admins' => liste_textes($b['admins'] ?? [$mail_admin]),
                'origines' => liste_textes($b['origines'] ?? ['https://ainrecycling.com', 'https://www.ainrecycling.com']),
                'adresse_site' => (string) ($b['adresse_site'] ?? 'https://ainrecycling.com'),
                'secret' => base64_encode(random_bytes(32)),
                'cle_chiffrement' => base64_encode(random_bytes(32)),
                'cle_appli' => $cle_appli,
                'installe_le' => iso(),
            ]);
            bd(); // crée les tables
            repondre(['ok' => true, 'cle_appli' => $cle_appli]);

        case 'modifier':
            if (!$installe) refus('pas_installe', 409);
            $c = config();
            $changes = [];
            foreach (REGLAGES_MODIFIABLES as $k) {
                if (!array_key_exists($k, $b)) continue;
                if ($k === 'bd') {
                    if (!is_array($b['bd']) || !is_string($b['bd']['dsn'] ?? null)) refus('bd');
                    try {
                        tester_bd($b['bd']);
                    } catch (Throwable $x) {
                        refus('bd_inaccessible');
                    }
                }
                $c[$k] = in_array($k, ['admins', 'origines'], true) ? liste_textes($b[$k]) : $b[$k];
                $changes[] = $k;
            }
            if (!$changes) refus('rien');
            ecrire_config($c);
            $a = (string) ($c['mail_admin'] ?? '');
            if ($a !== '' && !mode_essai()) {
                apres_reponse(fn () => envoyer_mail($a, 'Réglages du site modifiés', '<p>Les réglages du site ont été modifiés : '
                    . echapper(implode(', ', $changes)) . '.</p><p>Si ce n\'est pas toi (ou Claude à ta demande), préviens-le tout de suite.</p>',
                    'Les réglages du site ont été modifiés : ' . implode(', ', $changes) . ". Si ce n'est pas toi (ou Claude à ta demande), préviens-le tout de suite."));
            }
            repondre(['ok' => true, 'modifies' => $changes]);

        default:
            refus('action');
    }
} catch (Throwable $e) {
    erreur_serveur($e);
}
