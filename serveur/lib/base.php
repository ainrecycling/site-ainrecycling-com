<?php
declare(strict_types=1);







const SCHEMA_VERSION = 6;


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



function mode_essai(): bool
{
    return getenv('AIN_ESSAI') === '1' || (bool) reglage('essai', false);
}


if (function_exists('header_remove')) header_remove('X-Powered-By');


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


function pour_maj(): string
{
    return est_sqlite(bd()) ? '' : ' FOR UPDATE';
}


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



    ajouter_colonnes($bd, 'espace_envois', ['prix_kg' => 'DOUBLE NULL', 'garanti_jusqu' => 'VARCHAR(10) NULL']);
    $bd->exec("CREATE TABLE IF NOT EXISTS site_reglages (
        cle VARCHAR(40) NOT NULL PRIMARY KEY, valeur TEXT NOT NULL, maj_le VARCHAR(30) NOT NULL, maj_par VARCHAR(60) NOT NULL DEFAULT ''
    )$fin");
    $bd->exec("CREATE TABLE IF NOT EXISTS site_alertes (
        email VARCHAR(160) NOT NULL PRIMARY KEY, jeton CHAR(32) NOT NULL UNIQUE, langue VARCHAR(2) NOT NULL DEFAULT 'fr',
        cree_le VARCHAR(30) NOT NULL, confirme_le VARCHAR(30) NULL, demande_le VARCHAR(30) NOT NULL,
        prevenir DOUBLE NULL, prevenu_le VARCHAR(30) NULL
    )$fin");
    $bd->exec("CREATE TABLE IF NOT EXISTS site_visites (
        jour VARCHAR(10) NOT NULL, page VARCHAR(120) NOT NULL, source VARCHAR(30) NOT NULL, n INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (jour, page, source)
    )$fin");




    ajouter_colonnes($bd, 'espace_envois', ['recu_le' => 'VARCHAR(30) NULL', 'pese_le' => 'VARCHAR(30) NULL', 'poids_brut' => 'DOUBLE NULL',
        'poids_net' => 'DOUBLE NULL', 'paye_le' => 'VARCHAR(30) NULL', 'montant' => 'DOUBLE NULL', 'paye_detail' => 'VARCHAR(60) NULL',
        'bon_redemande_le' => 'VARCHAR(30) NULL']);
    ajouter_colonnes($bd, 'espace_comptes', ['prevenir' => 'VARCHAR(12) NULL', 'archive_le' => 'VARCHAR(30) NULL', 'rappel_piece' => 'VARCHAR(10) NULL']);
    ajouter_colonnes($bd, 'espace_codes', ['creation' => 'TEXT NULL']);
    ajouter_colonnes($bd, 'espace_envois', ['rappel_garantie' => 'VARCHAR(30) NULL']);
    $bd->exec("CREATE TABLE IF NOT EXISTS espace_liens (
        h CHAR(64) NOT NULL PRIMARY KEY, email TEXT NOT NULL, exp BIGINT NOT NULL
    )$fin");


    ajouter_colonnes($bd, 'espace_envois', ['cgv_version' => 'VARCHAR(12) NULL', 'cgv_le' => 'VARCHAR(30) NULL']);
    ajouter_colonnes($bd, 'espace_comptes', ['rib_maj_le' => 'VARCHAR(30) NULL']);
    $bd->exec("CREATE TABLE IF NOT EXISTS site_messages (
        id VARCHAR(36) NOT NULL PRIMARY KEY, cree_le VARCHAR(30) NOT NULL, sujet VARCHAR(160) NOT NULL, texte TEXT NOT NULL,
        retour VARCHAR(120) NOT NULL DEFAULT '', photos TEXT NULL, repondu_le VARCHAR(30) NULL
    )$fin");



    ajouter_colonnes($bd, 'espace_envois', ['accord_le' => 'VARCHAR(30) NULL', 'accord_par' => 'VARCHAR(20) NULL',
        'depot_reponse' => 'VARCHAR(12) NULL', 'depot_repondu_le' => 'VARCHAR(30) NULL', 'retard' => 'TEXT NULL']);
    $bd->exec("CREATE TABLE IF NOT EXISTS site_mails (
        id VARCHAR(36) NOT NULL PRIMARY KEY, envoi VARCHAR(36) NOT NULL, le VARCHAR(30) NOT NULL, objet VARCHAR(200) NOT NULL"
        . ($mysql ? ', INDEX site_mails_envoi (envoi)' : '') . "
    )$fin");
    if (!$mysql) $bd->exec('CREATE INDEX IF NOT EXISTS site_mails_envoi ON site_mails (envoi)');
    @file_put_contents($drapeau, gmdate('c'));
}


function ajouter_colonnes(PDO $bd, string $table, array $colonnes): void
{
    foreach ($colonnes as $col => $type) {
        if (colonne_existe($bd, $table, $col)) continue;
        try {
            $bd->exec("ALTER TABLE $table ADD COLUMN $col $type");
        } catch (PDOException $e) {
            if (!colonne_existe($bd, $table, $col)) throw $e;
        }
    }
}

function colonne_existe(PDO $bd, string $table, string $colonne): bool
{
    if (est_sqlite($bd)) {
        foreach ($bd->query("PRAGMA table_info($table)")->fetchAll() as $c) if (($c['name'] ?? '') === $colonne) return true;
        return false;
    }
    $q = $bd->prepare('SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?');
    $q->execute([$table, $colonne]);
    return (int) $q->fetchColumn() > 0;
}



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


function origine_refusee(): void
{
    $o = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($o === '') return;
    $origines = (array) reglage('origines', ['https://ainrecycling.com', 'https://www.ainrecycling.com']);
    $locale = mode_essai() && preg_match('#^http://(localhost|127\.0\.0\.1)(:\d+)?$#', $o);
    if (!in_array($o, $origines, true) && !$locale) refus('origine', 403);
}


function ms(): int
{
    return (int) floor(microtime(true) * 1000);
}


function iso(?int $ms = null): string
{
    $ms ??= ms();
    return gmdate('Y-m-d\TH:i:s', intdiv($ms, 1000)) . sprintf('.%03dZ', $ms % 1000);
}

function aujourdhui(): string
{
    return gmdate('Y-m-d');
}



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


function signer(string $texte): string
{
    return b64url(hash_hmac('sha256', $texte, cle_binaire('secret'), true));
}


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


function erreur_serveur(Throwable $e): void
{
    journaliser(($_SERVER['REQUEST_METHOD'] ?? '?') . ' ' . ($_GET['chemin'] ?? '') . ' : ' . resume_erreur($e));
    refus('serveur', 503);
}
