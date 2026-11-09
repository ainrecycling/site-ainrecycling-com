<?php
declare(strict_types=1);

require_once __DIR__ . '/espace.php';

// Sauvegarde de l'espace client (proposition 65, 8 nov. 2026) : un fichier téléchargé par Malik depuis sa page /gestion/,
// fermé par un mot de passe qu'il choisit (jamais gardé par le site). Dedans : les comptes (n° de pièce et IBAN en clair,
// pour pouvoir tout remettre même si le serveur et sa clé sont perdus), les demandes, les abonnés à l'alerte prix, les
// réglages (prix et son historique, annonces), les pages vues et les photos des pièces d'identité.
// Format : zip chiffré AES-256 (s'ouvre avec 7-Zip, gratuit) quand PHP le sait faire ; sinon fichier « .ain » chiffré en
// AES-256-GCM, clé tirée du mot de passe (PBKDF2-SHA256, 600 000 tours), ouvert par outils/ovh/ouvrir-sauvegarde.mjs.
// Jamais par e-mail : il y a des pièces d'identité dedans.

const SAUVEGARDE_TOURS = 600000;

function contenu_sauvegarde(string $par): array
{
    $donnees = ['fait_le' => iso(), 'par' => $par, 'site' => adresse_site(), 'schema' => SCHEMA_VERSION,
        'comptes' => [], 'envois' => [], 'alertes' => [], 'reglages' => [], 'visites' => []];
    $photos = [];
    foreach (bd()->query('SELECT * FROM espace_comptes ORDER BY cree_le')->fetchAll() as $l) {
        $c = compte_depuis_ligne($l);
        foreach (['recto', 'verso'] as $face) {
            $o = lire_photo($c['id'], $c['piece'][$face] ?? null);
            if ($o !== null) $photos["pieces/{$c['id']}/$face.jpg"] = $o;
        }
        $donnees['comptes'][] = $c;
    }
    $donnees['envois'] = array_map('envoi_depuis_ligne', bd()->query('SELECT * FROM espace_envois ORDER BY cree_le')->fetchAll());
    $donnees['alertes'] = bd()->query('SELECT email, langue, cree_le, confirme_le FROM site_alertes ORDER BY cree_le')->fetchAll();
    foreach (bd()->query('SELECT cle, valeur FROM site_reglages')->fetchAll() as $l) $donnees['reglages'][$l['cle']] = json_decode((string) $l['valeur'], true);
    $donnees['visites'] = bd()->query('SELECT jour, page, source, n FROM site_visites ORDER BY jour')->fetchAll();
    $jour = jour_paris();
    $lisezmoi = "Sauvegarde des comptes clients du site ainrecycling.com, faite le " . date_longue($jour, 'fr') . " par $par.\r\n\r\n"
        . "donnees.json : les comptes (coordonnées, n° de pièce d'identité, IBAN), les demandes d'envoi par colis, les abonnés à\r\n"
        . "l'alerte prix, les réglages du site (prix et son historique, annonces) et les pages vues.\r\n"
        . "pieces/ : les photos des pièces d'identité, un dossier par compte (le nom du dossier est l'« id » du compte).\r\n\r\n"
        . count($donnees['comptes']) . ' comptes, ' . count($donnees['envois']) . ' demandes, ' . count($photos) . " photos.\r\n\r\n"
        . "À garder sur ton ordinateur ou sur une clé USB, jamais dans un e-mail. Pour remettre ces données sur le site,\r\n"
        . "demande à Claude (il lui faudra ce fichier et ton mot de passe).\r\n";
    return [['LISEZ-MOI.txt' => $lisezmoi, 'donnees.json' => (string) json_encode($donnees, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)] + $photos,
        count($donnees['comptes']), count($donnees['envois'])];
}

function zip_chiffre_possible(): bool
{
    return class_exists('ZipArchive') && method_exists('ZipArchive', 'setEncryptionName') && defined('ZipArchive::EM_AES_256');
}

/** Fabrique le fichier, note la date et l'envoie au navigateur (puis s'arrête). */
function servir_sauvegarde(string $mdp, string $par): void
{
    [$fichiers, $nComptes, $nEnvois] = contenu_sauvegarde($par);
    $nom = 'sauvegarde-site-ain-recycling-' . jour_paris();
    $d = prive() . '/tmp';
    if (!is_dir($d) && !mkdir($d, 0700, true) && !is_dir($d)) throw new RuntimeException('dossier temporaire impossible à créer');
    $tmp = (string) tempnam($d, 'sauve');
    try {
        if (zip_chiffre_possible()) {
            $z = new ZipArchive();
            if ($z->open($tmp, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) throw new RuntimeException('zip impossible');
            foreach ($fichiers as $chemin => $octets) {
                $z->addFromString($chemin, $octets);
                if (!$z->setEncryptionName($chemin, ZipArchive::EM_AES_256, $mdp)) throw new RuntimeException('chiffrement du zip impossible');
            }
            if (!$z->close()) throw new RuntimeException('zip non écrit');
            $extension = 'zip';
            $type = 'application/zip';
        } else {
            $paquet = (string) gzencode((string) json_encode(['fichiers' => array_map('base64_encode', $fichiers)], JSON_UNESCAPED_SLASHES), 6);
            $sel = random_bytes(16);
            $iv = random_bytes(12);
            $cle = hash_pbkdf2('sha256', $mdp, $sel, SAUVEGARDE_TOURS, 32, true);
            $tag = '';
            $ct = openssl_encrypt($paquet, 'aes-256-gcm', $cle, OPENSSL_RAW_DATA, $iv, $tag, '', 16);
            if ($ct === false) throw new RuntimeException('chiffrement impossible');
            file_put_contents($tmp, 'AINSAUVE1' . $sel . $iv . $tag . $ct);
            $extension = 'ain';
            $type = 'application/octet-stream';
        }
        ecrire_reglage_site('sauvegarde', ['le' => iso(), 'par' => $par, 'comptes' => $nComptes, 'envois' => $nEnvois, 'format' => $extension], $par);
        http_response_code(200);
        header('Content-Type: ' . $type);
        header('Content-Disposition: attachment; filename="' . $nom . '.' . $extension . '"');
        header('Content-Length: ' . filesize($tmp));
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
        readfile($tmp);
    } finally {
        @unlink($tmp);
    }
    exit;
}
