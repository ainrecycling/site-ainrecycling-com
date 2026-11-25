<?php
declare(strict_types=1);

require_once __DIR__ . '/espace.php';







































const SAUVEGARDE_TOURS = 600000;
const SAUVEGARDE_PAQUET = 500;


const SAUVEGARDE_JSON = JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE | JSON_THROW_ON_ERROR;




function parcourir_par_paquets(string $colonnes, string $table, array $cles, callable $f): int
{
    $ordre = implode(', ', $cles);
    $n = 0;
    $apres = null;
    do {
        [$ou, $params] = $apres === null ? ['', []] : apres_ligne($cles, $apres);
        $q = bd()->prepare("SELECT $colonnes FROM $table$ou ORDER BY $ordre LIMIT " . SAUVEGARDE_PAQUET);
        $q->execute($params);
        $lot = $q->fetchAll();
        foreach ($lot as $l) {
            $f($l);
            $n++;
        }
        $derniere = $lot ? $lot[count($lot) - 1] : null;
        if ($derniere !== null) $apres = array_map(fn ($c) => $derniere[$c], $cles);
    } while (count($lot) === SAUVEGARDE_PAQUET);
    return $n;
}


function apres_ligne(array $cles, array $valeurs): array
{
    $sql = '';
    $params = [];
    for ($i = count($cles) - 1; $i >= 0; $i--) {
        $c = $cles[$i];
        $sql = $sql === '' ? "$c > ?" : "$c > ? OR ($c = ? AND ($sql))";
        $params = $params === [] ? [$valeurs[$i]] : [$valeurs[$i], $valeurs[$i], ...$params];
    }
    return [" WHERE $sql", $params];
}



function json_au_niveau($v, int $niveau): string
{
    return str_replace("\n", "\n" . str_repeat('    ', $niveau), json_encode($v, SAUVEGARDE_JSON));
}


function ecrire_morceau($h, string $s): void
{
    if ($s !== '' && fwrite($h, $s) !== strlen($s)) throw new RuntimeException('sauvegarde : écriture impossible (disque plein ?)');
}





function preparer_sauvegarde(string $par, string $dossier): array
{
    $json = "$dossier/donnees.json";
    $h = fopen($json, 'wb');
    if ($h === false) throw new RuntimeException('sauvegarde : fichier temporaire impossible à créer');
    $photos = [];
    try {

        $premiere = true;
        $cle = function (string $nom) use ($h, &$premiere): void {
            ecrire_morceau($h, ($premiere ? "{\n    " : ",\n    ") . json_encode($nom, SAUVEGARDE_JSON) . ': ');
            $premiere = false;
        };


        $liste = function (string $nom, callable $remplir) use ($h, $cle): int {
            $cle($nom);
            $n = 0;
            $remplir(function ($element) use ($h, &$n): void {
                ecrire_morceau($h, ($n++ ? ",\n        " : "[\n        ") . json_au_niveau($element, 2));
            });
            ecrire_morceau($h, $n ? "\n    ]" : '[]');
            return $n;
        };
        foreach (['fait_le' => iso(), 'par' => $par, 'site' => adresse_site(), 'schema' => SCHEMA_VERSION] as $k => $v) {
            $cle($k);
            ecrire_morceau($h, json_au_niveau($v, 1));
        }

        $nComptes = $liste('comptes', function (callable $ajouter) use (&$photos): void {
            parcourir_par_paquets('*', 'espace_comptes', ['cree_le', 'id'], function (array $l) use ($ajouter, &$photos): void {
                $c = compte_depuis_ligne($l);
                foreach (['recto', 'verso'] as $face) {
                    $nom = $c['piece'][$face] ?? null;
                    if (is_string($nom) && $nom !== '') $photos["pieces/{$c['id']}/$face.jpg"] = [$c['id'], $nom];
                }
                $ajouter($c);
            });
        });
        $nEnvois = $liste('envois', fn (callable $ajouter) => parcourir_par_paquets('*', 'espace_envois', ['cree_le', 'id'],
            fn (array $l) => $ajouter(envoi_depuis_ligne($l))));
        $liste('alertes', fn (callable $ajouter) => parcourir_par_paquets('email, langue, cree_le, confirme_le', 'site_alertes', ['cree_le', 'email'], $ajouter));
        $reglages = [];
        foreach (bd()->query('SELECT cle, valeur FROM site_reglages')->fetchAll() as $l) $reglages[$l['cle']] = json_decode((string) $l['valeur'], true);
        $cle('reglages');
        ecrire_morceau($h, json_au_niveau($reglages, 1));

        $liste('visites', fn (callable $ajouter) => parcourir_par_paquets('jour, page, source, n', 'site_visites', ['jour', 'page', 'source'], $ajouter));

        $nMessages = $liste('messages', fn (callable $ajouter) => parcourir_par_paquets('*', 'site_messages', ['cree_le', 'id'], fn (array $l) => $ajouter(['id' => $l['id'],
            'cree_le' => $l['cree_le'], 'sujet' => $l['sujet'], 'texte' => $l['texte'], 'retour' => $l['retour'], 'repondu_le' => $l['repondu_le'] ?: null,
            'connu' => $l['connu'] ?? null, 'langue' => $l['langue'] ?? null, 'photos' => count((array) json_decode((string) $l['photos'], true))])));
        $nMails = $liste('mails', fn (callable $ajouter) => parcourir_par_paquets('id, envoi, le, objet', 'site_mails', ['le', 'id'], $ajouter));
        ecrire_morceau($h, "\n}");
        if (!fflush($h)) throw new RuntimeException('sauvegarde : écriture impossible (disque plein ?)');
    } finally {
        fclose($h);
    }
    return ['json' => $json, 'photos' => $photos, 'comptes' => $nComptes, 'envois' => $nEnvois, 'messages' => $nMessages, 'mails' => $nMails];
}


function texte_lisezmoi(string $par, array $p, int $nPhotos): string
{
    return "Sauvegarde des comptes clients du site ainrecycling.com, faite le " . date_longue(jour_paris(), 'fr') . " par $par.\r\n\r\n"
        . "donnees.json : les comptes (coordonnées, n° de pièce d'identité, IBAN), les demandes d'envoi par colis, les abonnés à\r\n"
        . "l'alerte prix, les réglages du site (prix et son historique, annonces), les pages vues, les messages des formulaires\r\n"
        . "Contact et Devis (« messages » : leur texte et les coordonnées laissées pour la réponse ; leurs photos ne sont pas dans\r\n"
        . "la sauvegarde) et le journal des e-mails envoyés aux vendeurs pour leurs demandes (« mails » : date, heure et objet ; le\r\n"
        . "texte des e-mails n'est pas gardé).\r\n"
        . "pieces/ : les photos des pièces d'identité, un dossier par compte (le nom du dossier est l'« id » du compte).\r\n\r\n"
        . $p['comptes'] . ' comptes, ' . $p['envois'] . ' demandes, ' . $nPhotos . ' photos, '
        . $p['messages'] . ' messages, ' . $p['mails'] . " e-mails dans le journal.\r\n\r\n"
        . "À garder sur ton ordinateur ou sur une clé USB, jamais dans un e-mail. Pour remettre ces données sur le site,\r\n"
        . "demande à Claude (il lui faudra ce fichier et ton mot de passe).\r\n";
}



function effacer_a_l_arret(string $dossier): void
{
    register_shutdown_function(function () use ($dossier): void {
        effacer_dossier_tmp($dossier);
    });
}




function contenu_sauvegarde(string $par): array
{
    $dossier = dossier_tmp_nouveau('sauve');
    effacer_a_l_arret($dossier);
    try {
        $p = preparer_sauvegarde($par, $dossier);
        $json = file_get_contents($p['json']);
        if ($json === false) throw new RuntimeException('sauvegarde : fichier temporaire illisible');
        @unlink($p['json']);
        $photos = [];
        foreach ($p['photos'] as $chemin => [$compte, $nom]) {
            $o = lire_photo($compte, $nom);
            if ($o !== null) $photos[$chemin] = $o;
        }
        return [['LISEZ-MOI.txt' => texte_lisezmoi($par, $p, count($photos)), 'donnees.json' => $json] + $photos, $p['comptes'], $p['envois']];
    } finally {
        effacer_dossier_tmp($dossier);
    }
}

function zip_chiffre_possible(): bool
{
    return class_exists('ZipArchive') && method_exists('ZipArchive', 'setEncryptionName') && defined('ZipArchive::EM_AES_256');
}











function zip_nouveau(string $dossier): array
{
    $fichier = "$dossier/sauvegarde.zip";
    $h = fopen($fichier, 'wb');
    if ($h === false) throw new RuntimeException('sauvegarde : zip impossible à créer');
    return ['fichier' => $fichier, 'h' => $h, 'dossier' => $dossier, 'pos' => 0, 'central' => [], 'lot' => [], 'lot_octets' => 0];
}



const ZIP_LOT_OCTETS = 4 * 1024 * 1024, ZIP_LOT_ENTREES = 256;



function zip_ajouter(array &$z, string $mdp, string $chemin, ?string $octets, ?string $source = null): void
{
    if ($octets === null) {
        zip_ecrire_lot($z, $mdp, [[$chemin, null, (string) $source]]);
        return;
    }
    $z['lot'][] = [$chemin, $octets, null];
    $z['lot_octets'] += strlen($octets);
    if ($z['lot_octets'] >= ZIP_LOT_OCTETS || count($z['lot']) >= ZIP_LOT_ENTREES) zip_vider($z, $mdp);
}


function zip_vider(array &$z, string $mdp): void
{
    if (!$z['lot']) return;
    $lot = $z['lot'];
    $z['lot'] = [];
    $z['lot_octets'] = 0;
    zip_ecrire_lot($z, $mdp, $lot);
}



function zip_ecrire_lot(array &$z, string $mdp, array $entrees): void
{
    $petit = $z['dossier'] . '/lot.zip';
    $za = new ZipArchive();
    if ($za->open($petit, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) throw new RuntimeException('zip impossible');
    $ok = true;
    foreach ($entrees as [$chemin, $octets, $source]) {
        $ok = $ok && ($octets !== null ? $za->addFromString($chemin, $octets) : $za->addFile((string) $source, $chemin))
            && $za->setEncryptionName($chemin, ZipArchive::EM_AES_256, $mdp);
    }
    if (!$ok) {
        $za->unchangeAll();
        $za->close();
        throw new RuntimeException('chiffrement du zip impossible');
    }
    if (!$za->close()) throw new RuntimeException('zip non écrit');
    $n = count($entrees);
    $p = fopen($petit, 'rb');
    if ($p === false) throw new RuntimeException('zip de travail illisible');
    $centraux = [];
    try {

        $taille = (int) filesize($petit);
        if ($taille < 22 || fseek($p, $taille - 22) !== 0) throw new RuntimeException('zip de travail illisible');
        $fin = unpack('Vsig/vdisque/vdebut/vici/vtotal/Vtaille/Vplace/vcomm', (string) fread($p, 22));
        if (!$fin || $fin['sig'] !== 0x06054b50 || $fin['total'] !== $n || $fin['ici'] !== $n || $fin['comm'] !== 0
            || $fin['place'] + $fin['taille'] + 22 !== $taille) throw new RuntimeException('zip de travail inattendu');

        if (fseek($p, $fin['place']) !== 0) throw new RuntimeException('zip de travail illisible');
        $central = (string) fread($p, $fin['taille']);
        for ($i = 0; $i < strlen($central);) {
            $e = $i + 46 <= strlen($central) ? unpack('Vsig/x16/Vcomp/Vtaille/vnom/vextra/vcomm/x8/Vlocal', substr($central, $i, 46)) : false;
            $long = $e ? 46 + $e['nom'] + $e['extra'] + $e['comm'] : 0;
            if (!$e || $e['sig'] !== 0x02014b50 || $i + $long > strlen($central) || $e['local'] >= $fin['place']
                || $e['comp'] === 0xFFFFFFFF || $e['taille'] === 0xFFFFFFFF) throw new RuntimeException('zip de travail inattendu');
            $centraux[substr($central, $i + 46, $e['nom'])] = [$e['local'], substr($central, $i, $long)];
            $i += $long;
        }
        if (count($centraux) !== $n) throw new RuntimeException('zip de travail inattendu');

        if (!rewind($p) || stream_copy_to_stream($p, $z['h'], $fin['place']) !== $fin['place']) throw new RuntimeException('sauvegarde : écriture impossible (disque plein ?)');
    } finally {
        fclose($p);
        @unlink($petit);
    }
    if ($z['pos'] + $fin['place'] >= 0xFFFFFFFF) throw new RuntimeException('sauvegarde trop grande pour un zip sans ZIP64');
    foreach ($centraux as $chemin => [$local, $c]) $z['central'][$chemin] = substr($c, 0, 42) . pack('V', $z['pos'] + $local) . substr($c, 46);
    $z['pos'] += $fin['place'];
}



function zip_fermer(array &$z, string $mdp, array $ordre): void
{
    zip_vider($z, $mdp);
    $central = '';
    foreach ($ordre as $chemin) $central .= $z['central'][$chemin];
    $n = count($ordre);
    $taille = strlen($central);
    if ($z['pos'] + $taille >= 0xFFFFFFFF) throw new RuntimeException('sauvegarde trop grande pour un zip sans ZIP64');
    $fin = $n > 0xFFFF
        ? pack('VPvvVVPPPP', 0x06064b50, 44, 45, 45, 0, 0, $n, $n, $taille, $z['pos'])
            . pack('VVPV', 0x07064b50, 0, $z['pos'] + $taille, 1)
            . pack('VvvvvVVv', 0x06054b50, 0, 0, 0xFFFF, 0xFFFF, $taille, $z['pos'], 0)
        : pack('VvvvvVVv', 0x06054b50, 0, 0, $n, $n, $taille, $z['pos'], 0);
    ecrire_morceau($z['h'], $central . $fin);
    if (!fflush($z['h']) || !fclose($z['h'])) throw new RuntimeException('sauvegarde : écriture impossible (disque plein ?)');
}




function fichier_zip(string $dossier, string $mdp, string $par): array
{
    $p = preparer_sauvegarde($par, $dossier);
    $z = zip_nouveau($dossier);
    try {
        zip_ajouter($z, $mdp, 'donnees.json', null, $p['json']);
        @unlink($p['json']);
        $ordre = ['LISEZ-MOI.txt', 'donnees.json'];
        foreach ($p['photos'] as $chemin => [$compte, $nom]) {
            $o = lire_photo($compte, $nom);
            if ($o === null) continue;
            zip_ajouter($z, $mdp, $chemin, $o);
            $ordre[] = $chemin;
        }
        unset($o);
        zip_ajouter($z, $mdp, 'LISEZ-MOI.txt', texte_lisezmoi($par, $p, count($ordre) - 2));
        zip_fermer($z, $mdp, $ordre);
    } finally {
        if (is_resource($z['h'])) fclose($z['h']);
    }
    return [$z['fichier'], $p['comptes'], $p['envois']];
}


function fichier_ain(string $dossier, string $mdp, string $par): array
{
    [$fichiers, $nComptes, $nEnvois] = contenu_sauvegarde($par);
    $paquet = gzencode(json_encode(['fichiers' => array_map('base64_encode', $fichiers)], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR), 6);
    unset($fichiers);
    if ($paquet === false) throw new RuntimeException('compression impossible');
    $sel = random_bytes(16);
    $iv = random_bytes(12);
    $cle = hash_pbkdf2('sha256', $mdp, $sel, SAUVEGARDE_TOURS, 32, true);
    $tag = '';
    $ct = openssl_encrypt($paquet, 'aes-256-gcm', $cle, OPENSSL_RAW_DATA, $iv, $tag, '', 16);
    if ($ct === false) throw new RuntimeException('chiffrement impossible');
    $fichier = "$dossier/sauvegarde.ain";
    $contenu = 'AINSAUVE1' . $sel . $iv . $tag . $ct;
    if (@file_put_contents($fichier, $contenu) !== strlen($contenu)) throw new RuntimeException('sauvegarde : écriture impossible (disque plein ?)');
    return [$fichier, $nComptes, $nEnvois];
}






function verrou_sauvegarde()
{
    $h = @fopen(prive() . '/sauvegarde.verrou', 'c');
    if ($h === false) return true;
    for ($i = 0; $i < 240; $i++) {
        if (flock($h, LOCK_EX | LOCK_NB, $occupe)) return $h;
        if (!$occupe) {
            fclose($h);
            return true;
        }
        usleep(250000);
    }
    fclose($h);
    return null;
}



function effacer_sauvegardes_interrompues(): int
{
    $n = 0;
    foreach (glob(dossier_tmp() . '/sauve-*', GLOB_ONLYDIR) ?: [] as $d) {
        effacer_dossier_tmp($d);
        if (!is_dir($d)) $n++;
    }
    return $n;
}



function servir_sauvegarde(string $mdp, string $par): void
{

    if (function_exists('set_time_limit')) @set_time_limit(300);


    ignore_user_abort(true);
    $verrou = verrou_sauvegarde();
    if ($verrou === null) {
        journaliser('sauvegarde pas faite : une autre sauvegarde est encore en cours');
        refus('sauvegarde', 500);
        return;
    }
    nettoyer_tmp();

    if ($verrou === true) {
        journaliser('sauvegarde : pas de verrou possible sur ce disque, faite sans');
    } else {
        $n = effacer_sauvegardes_interrompues();
        if ($n) journaliser("sauvegarde : $n dossier(s) de travail d'une sauvegarde interrompue effacé(s)");
    }
    $nom = 'sauvegarde-site-ain-recycling-' . jour_paris();
    $dossier = null;
    try {
        $dossier = dossier_tmp_nouveau('sauve');
        effacer_a_l_arret($dossier);
        $zip = zip_chiffre_possible();
        [$fichier, $nComptes, $nEnvois] = $zip ? fichier_zip($dossier, $mdp, $par) : fichier_ain($dossier, $mdp, $par);
        $extension = $zip ? 'zip' : 'ain';
        $taille = filesize($fichier);
        if ($taille === false || $taille <= 0) throw new RuntimeException('sauvegarde : fichier vide');
    } catch (Throwable $e) {
        if ($dossier !== null) effacer_dossier_tmp($dossier);
        journaliser('sauvegarde pas faite : ' . resume_erreur($e));
        refus('sauvegarde', 500);
        return;
    }
    try {
        http_response_code(200);
        header('Content-Type: ' . ($zip ? 'application/zip' : 'application/octet-stream'));
        header('Content-Disposition: attachment; filename="' . $nom . '.' . $extension . '"');
        header('Content-Length: ' . $taille);
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');


        $envoye = 0;
        $h = fopen($fichier, 'rb');
        if ($h !== false) {
            try {
                while (!feof($h) && !connection_aborted()) {
                    $morceau = fread($h, 1048576);
                    if ($morceau === false || $morceau === '') break;
                    echo $morceau;
                    flush();
                    $envoye += strlen($morceau);
                }
            } finally {
                fclose($h);
            }
        }


        if ($envoye === $taille && !connection_aborted()) {
            try {
                ecrire_reglage_site('sauvegarde', ['le' => iso(), 'par' => $par, 'comptes' => $nComptes, 'envois' => $nEnvois, 'format' => $extension], $par);
            } catch (Throwable $e) {
                journaliser('sauvegarde envoyée, date pas notée : ' . resume_erreur($e));
            }
        } else {
            journaliser('sauvegarde pas reçue en entier (connexion coupée) : date pas notée');
        }
    } finally {
        effacer_dossier_tmp($dossier);
    }
    exit;
}
