<?php
declare(strict_types=1);

// Serveur du site chez OVH (décidé le 6 nov. 2026 : le site et son espace client, séparés de l'appli de bons).
// Outils communs : réglages (fichier gardé HORS du dossier www), base de données (MySQL chez OVH, SQLite pour les essais
// sur l'ordinateur), réponses JSON, signatures et chiffrement, journal des erreurs.
// Le dossier privé (prive-ain, à côté de www) garde : config.php (secrets, écrit une fois par serveur/installation.php),
// les photos des pièces d'identité (chiffrées), le journal. Rien de tout cela n'est jamais servi par le site.

const SCHEMA_VERSION = 1;

/** Dossier privé : à côté de www (jamais servi par le site). AIN_PRIVE le remplace pour les essais sur l'ordinateur. */
function prive(): string
{
    static $dossier = null;
    if ($dossier !== null) return $dossier;
    $env = getenv('AIN_PRIVE');
    if (is_string($env) && $env !== '') return $dossier = rtrim($env, '/\\');
    $racine = realpath((string) ($_SERVER['DOCUMENT_ROOT'] ?? '')) ?: dirname(__DIR__, 2);
    return $dossier = dirname($racine) . DIRECTORY_SEPARATOR . 'prive-ain';
}

function config(): array
{
    static $c = null;
    if ($c !== null) return $c;
    $f = prive() . '/config.php';
    if (!is_file($f)) throw new RuntimeException('configuration absente');
    $lu = require $f;
    if (!is_array($lu)) throw new RuntimeException('configuration illisible');
    return $c = $lu;
}

function reglage(string $nom, $defaut = null)
{
    return config()[$nom] ?? $defaut;
}

/** Essai sur l'ordinateur (AIN_ESSAI=1, posé par outils/ovh/routeur-local.php) : les e-mails vont dans le journal au
 *  lieu de partir, adresses localhost acceptées, cookies sans « Secure » (pas de HTTPS). Jamais chez OVH. */
function mode_essai(): bool
{
    return getenv('AIN_ESSAI') === '1' || (bool) reglage('essai', false);
}

// ---------- base de données ----------
function bd(): PDO
{
    static $bd = null;
    if ($bd !== null) return $bd;
    $c = config()['bd'] ?? null;
    if (!is_array($c) || empty($c['dsn'])) throw new RuntimeException('base de données non réglée');
    $bd = new PDO((string) $c['dsn'], $c['utilisateur'] ?? null, $c['mot_de_passe'] ?? null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    if (est_sqlite($bd)) $bd->exec('PRAGMA busy_timeout = 5000');
    migrer($bd);
    return $bd;
}

function est_sqlite(PDO $bd): bool
{
    return $bd->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite';
}

/** Ligne lue « pour la modifier » : verrouillée jusqu'à la fin de la transaction (MySQL ; SQLite verrouille tout). */
function pour_maj(): string
{
    return est_sqlite(bd()) ? '' : ' FOR UPDATE';
}

/** Une suite de lectures et d'écritures faite d'un bloc (deux demandes en même temps ne se marchent pas dessus). */
function transaction(callable $f)
{
    $bd = bd();
    $sqlite = est_sqlite($bd);
    if ($sqlite) $bd->exec('BEGIN IMMEDIATE');
    else $bd->beginTransaction();
    try {
        $r = $f($bd);
        if ($sqlite) $bd->exec('COMMIT');
        else $bd->commit();
        return $r;
    } catch (Throwable $e) {
        if ($sqlite) $bd->exec('ROLLBACK');
        elseif ($bd->inTransaction()) $bd->rollBack();
        throw $e;
    }
}

/** Tables de l'espace client, créées au premier usage (le même texte marche avec MySQL et SQLite). */
function migrer(PDO $bd): void
{
    $drapeau = prive() . '/schema-v' . SCHEMA_VERSION . '.ok';
    if (is_file($drapeau)) return;
    $mysql = !est_sqlite($bd);
    $fin = $mysql ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' : '';
    $bd->exec("CREATE TABLE IF NOT EXISTS espace_comptes (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        email VARCHAR(160) NOT NULL UNIQUE,
        cree_le VARCHAR(30) NOT NULL, vu_le VARCHAR(30) NOT NULL, maj_le VARCHAR(30) NOT NULL,
        profil VARCHAR(20) NOT NULL DEFAULT 'particulier',
        nom VARCHAR(100) NOT NULL DEFAULT '', prenom VARCHAR(100) NOT NULL DEFAULT '',
        entreprise VARCHAR(140) NOT NULL DEFAULT '', siret VARCHAR(20) NOT NULL DEFAULT '',
        telephone VARCHAR(40) NOT NULL DEFAULT '', adresse VARCHAR(180) NOT NULL DEFAULT '',
        cp VARCHAR(10) NOT NULL DEFAULT '', ville VARCHAR(100) NOT NULL DEFAULT '',
        piece_type VARCHAR(40) NULL, piece_numero TEXT NULL, piece_expiration VARCHAR(10) NULL,
        piece_recto VARCHAR(80) NULL, piece_verso VARCHAR(80) NULL, piece_depose_le VARCHAR(30) NULL,
        rib_titulaire VARCHAR(100) NULL, rib_iban TEXT NULL,
        langue VARCHAR(2) NOT NULL DEFAULT 'fr', vendeur_id VARCHAR(36) NULL
    )$fin");
    $bd->exec("CREATE TABLE IF NOT EXISTS espace_codes (
        cle CHAR(64) NOT NULL PRIMARY KEY,
        h VARCHAR(64) NOT NULL DEFAULT '', exp BIGINT NOT NULL DEFAULT 0, essais INTEGER NOT NULL DEFAULT 0,
        envois TEXT NOT NULL
    )$fin");
    $bd->exec("CREATE TABLE IF NOT EXISTS espace_compteurs (
        nom VARCHAR(40) NOT NULL PRIMARY KEY, jour VARCHAR(10) NOT NULL, n INTEGER NOT NULL DEFAULT 0
    )$fin");
    $bd->exec("CREATE TABLE IF NOT EXISTS espace_envois (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        reference VARCHAR(20) NOT NULL UNIQUE,
        compte VARCHAR(36) NOT NULL,
        cree_le VARCHAR(30) NOT NULL,
        colis TEXT NOT NULL, total DOUBLE NOT NULL, paiement VARCHAR(10) NOT NULL, message TEXT NOT NULL,
        traite_le VARCHAR(30) NULL, traite_par VARCHAR(60) NOT NULL DEFAULT '',
        bon_numero VARCHAR(20) NULL, bon_le VARCHAR(30) NULL" . ($mysql ? ', INDEX espace_envois_compte (compte)' : '') . "
    )$fin");
    if (!$mysql) $bd->exec('CREATE INDEX IF NOT EXISTS espace_envois_compte ON espace_envois (compte)');
    @file_put_contents($drapeau, gmdate('c'));
}

// ---------- réponses ----------
/** Envoie la réponse JSON (jamais gardée en cache), puis fait ce qui a été mis « après la réponse » (e-mails). */
function repondre($corps, int $status = 200, ?string $cookie = null): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    if ($cookie !== null) header('Set-Cookie: ' . $cookie, false);
    $json = json_encode($corps, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    header('Content-Length: ' . strlen((string) $json));
    echo $json;
    terminer();
}

function refus(string $code, int $status = 400): void
{
    repondre(['erreur' => $code], $status);
}

/** Travail à faire une fois la réponse partie (le navigateur n'attend pas les e-mails). */
function apres_reponse(callable $f): void
{
    $GLOBALS['ain_apres'][] = $f;
}

function terminer(): void
{
    $apres = $GLOBALS['ain_apres'] ?? [];
    $GLOBALS['ain_apres'] = [];
    if ($apres) {
        ignore_user_abort(true);
        if (function_exists('fastcgi_finish_request')) fastcgi_finish_request();
        else flush();
        foreach ($apres as $f) {
            try {
                $f();
            } catch (Throwable $e) {
                journaliser('après la réponse : ' . resume_erreur($e));
            }
        }
    }
    exit;
}

/** Corps JSON de la demande (100 Ko au plus), ou null. */
function corps_json(): ?array
{
    $brut = file_get_contents('php://input', false, null, 0, 100000);
    if (!is_string($brut) || $brut === '') return null;
    $j = json_decode($brut, true);
    return is_array($j) ? $j : null;
}

function https(): bool
{
    return (($_SERVER['HTTPS'] ?? '') !== '' && ($_SERVER['HTTPS'] ?? '') !== 'off')
        || strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https';
}

/** Une demande qui modifie quelque chose doit venir du site (ou d'aucun navigateur) : pas d'envoi depuis une autre page. */
function origine_refusee(): void
{
    $o = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($o === '') return;
    $origines = (array) reglage('origines', ['https://ainrecycling.com', 'https://www.ainrecycling.com']);
    $locale = mode_essai() && preg_match('#^http://(localhost|127\.0\.0\.1)(:\d+)?$#', $o);
    if (!in_array($o, $origines, true) && !$locale) refus('origine', 403);
}

// ---------- temps ----------
function ms(): int
{
    return (int) floor(microtime(true) * 1000);
}

/** « 2026-11-06T10:14:04.303Z » (même écriture que l'appli et le navigateur, heure de Londres) */
function iso(?int $ms = null): string
{
    $ms ??= ms();
    return gmdate('Y-m-d\TH:i:s', intdiv($ms, 1000)) . sprintf('.%03dZ', $ms % 1000);
}

function aujourdhui(): string
{
    return gmdate('Y-m-d');
}

// ---------- textes ----------
/** Texte d'un formulaire : espaces en trop retirés, coupé à $max caractères. */
function texte($x, int $max = 120): string
{
    if (!is_string($x)) return '';
    $s = trim((string) preg_replace('/\s+/u', ' ', $x));
    return coupe($s, $max);
}

function coupe(string $s, int $max): string
{
    if (!preg_match('/^.{0,' . $max . '}/su', $s, $m)) return substr($s, 0, $max);
    return $m[0];
}

function majuscules(string $s): string
{
    return function_exists('mb_strtoupper') ? mb_strtoupper($s, 'UTF-8') : strtoupper($s);
}

function uuid(): string
{
    $b = random_bytes(16);
    $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
    $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($b), 4));
}

// ---------- signatures et chiffrement ----------
function b64url(string $octets): string
{
    return rtrim(strtr(base64_encode($octets), '+/', '-_'), '=');
}

function deb64url(string $s)
{
    $s = strtr($s, '-_', '+/');
    if (strlen($s) % 4) $s .= str_repeat('=', 4 - strlen($s) % 4);
    return base64_decode($s, true);
}

function cle_binaire(string $nom): string
{
    $k = base64_decode((string) reglage($nom, ''), true);
    if (!is_string($k) || strlen($k) < 32) throw new RuntimeException("clé $nom absente");
    return $k;
}

/** Signature (HMAC-SHA256) avec la clé du serveur : sessions, codes de connexion. */
function signer(string $texte): string
{
    return b64url(hash_hmac('sha256', $texte, cle_binaire('secret'), true));
}

/** Chiffrement AES-256-GCM (clé du dossier privé) : n° de pièce, IBAN, photos des pièces. */
function chiffrer_octets(string $clair): string
{
    $iv = random_bytes(12);
    $tag = '';
    $ct = openssl_encrypt($clair, 'aes-256-gcm', cle_binaire('cle_chiffrement'), OPENSSL_RAW_DATA, $iv, $tag, '', 16);
    if ($ct === false) throw new RuntimeException('chiffrement impossible');
    return 'AIN1' . $iv . $tag . $ct;
}

function dechiffrer_octets(string $s): ?string
{
    if (strlen($s) < 32 || substr($s, 0, 4) !== 'AIN1') return null;
    $r = openssl_decrypt(substr($s, 32), 'aes-256-gcm', cle_binaire('cle_chiffrement'), OPENSSL_RAW_DATA, substr($s, 4, 12), substr($s, 16, 16));
    return $r === false ? null : $r;
}

function chiffrer(string $clair): string
{
    return 'v1:' . base64_encode(chiffrer_octets($clair));
}

function dechiffrer(?string $s): ?string
{
    if ($s === null || strncmp($s, 'v1:', 3) !== 0) return null;
    $b = base64_decode(substr($s, 3), true);
    return is_string($b) ? dechiffrer_octets($b) : null;
}

// ---------- journal ----------
function journaliser(string $quoi): void
{
    $d = prive() . '/journal';
    if (!is_dir($d)) @mkdir($d, 0700, true);
    @file_put_contents("$d/erreurs.log", gmdate('c') . ' ' . $quoi . "\n", FILE_APPEND | LOCK_EX);
}

function resume_erreur(Throwable $e): string
{
    return get_class($e) . ' : ' . $e->getMessage() . ' (' . basename($e->getFile()) . ':' . $e->getLine() . ')';
}

/** Erreur imprévue : notée dans le journal (sans données personnelles), réponse « serveur ». */
function erreur_serveur(Throwable $e): void
{
    journaliser(($_SERVER['REQUEST_METHOD'] ?? '?') . ' ' . ($_GET['chemin'] ?? '') . ' : ' . resume_erreur($e));
    refus('serveur', 503);
}
