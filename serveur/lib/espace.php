<?php
declare(strict_types=1);

require_once __DIR__ . '/base.php';
require_once __DIR__ . '/mail.php';
require_once __DIR__ . '/site.php';








const COOKIE_ESPACE = 'espace';
const SESSION_JOURS = 60;
const CODE_MINUTES = 10, CODE_ESSAIS = 5, CODES_PAR_QUART = 3, CODES_PAR_JOUR = 8, CODES_JOUR_TOTAL = 40;
const PHOTO_MAX = 4 * 1024 * 1024, COLIS_MAX = 5, KG_PAR_COLIS = 20, ENVOIS_PAR_JOUR = 3;
const LANGUES = ['fr', 'de', 'en', 'it', 'es'];
const MATIERES = ['Plaquettes carbure', 'Forets / fraises carbure', 'Lot mélangé (plaquettes, forets, fraises)'];
const TYPES_PIECE = ["Carte d'identité", 'Passeport', 'Titre de séjour', 'Permis de conduire'];
const PREVENIR = ['email', 'whatsapp', 'les-deux'];




const CGV_VERSION = '2026-11-13-2';
const JOURS_COLIS_ATTENDU = 6;
const LIEN_MINUTES = 10;

function langue_de($x): string
{
    return in_array($x, LANGUES, true) ? $x : 'fr';
}

function email_valide($x): ?string
{
    $s = is_string($x) ? strtolower(trim($x)) : '';
    return strlen($s) <= 120 && preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u', $s) ? $s : null;
}


function robot(array $b): bool
{
    return (is_string($b['site'] ?? null) && $b['site'] !== '') || !(is_numeric($b['duree'] ?? null) && (float) $b['duree'] >= 2000);
}


function cle_code(string $espace, string $email): string
{
    return hash('sha256', $espace . '|' . $email);
}



function envoyer_code(string $email, string $langue, string $espace = 'espace', ?array $creation = null): string
{
    $maintenant = ms();
    $jour = aujourdhui();
    $cle = cle_code($espace, $email);
    $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $compteur = $espace === 'gestion' ? 'codes-gestion' : 'codes';
    $r = transaction(function (PDO $bd) use ($maintenant, $jour, $cle, $email, $code, $espace, $creation, $compteur) {
        $q = $bd->prepare('SELECT envois FROM espace_codes WHERE cle = ?' . pour_maj());
        $q->execute([$cle]);
        $l = $q->fetch();
        $envois = array_values(array_filter((array) json_decode($l['envois'] ?? '[]', true), fn ($t) => is_int($t) && $maintenant - $t < 86400000));
        $quart = count(array_filter($envois, fn ($t) => $maintenant - $t < 900000));
        if ($quart >= CODES_PAR_QUART || count($envois) >= CODES_PAR_JOUR) return 'trop';
        $q = $bd->prepare('SELECT jour, n FROM espace_compteurs WHERE nom = ?' . pour_maj());
        $q->execute([$compteur]);
        $t = $q->fetch();
        $n = $t && $t['jour'] === $jour ? (int) $t['n'] : 0;
        if ($n >= CODES_JOUR_TOTAL) return 'trop';
        $envois[] = $maintenant;
        $valeurs = [signer("code|$espace|$email|$code"), $maintenant + CODE_MINUTES * 60000, json_encode($envois),
            $creation ? json_encode($creation, JSON_UNESCAPED_UNICODE) : null, $cle];
        if ($l) $bd->prepare('UPDATE espace_codes SET h = ?, exp = ?, essais = 0, envois = ?, creation = ? WHERE cle = ?')->execute($valeurs);
        else $bd->prepare('INSERT INTO espace_codes (h, exp, essais, envois, creation, cle) VALUES (?, ?, 0, ?, ?, ?)')->execute($valeurs);
        if ($t) $bd->prepare('UPDATE espace_compteurs SET jour = ?, n = ? WHERE nom = ?')->execute([$jour, $n + 1, $compteur]);
        else $bd->prepare('INSERT INTO espace_compteurs (jour, n, nom) VALUES (?, ?, ?)')->execute([$jour, 1, $compteur]);
        return 'ok';
    });
    if ($r !== 'ok') return $r;
    mail_code($email, $code, $langue, $espace, $espace === 'espace' ? creer_lien($email) : null);
    return 'ok';
}


function lire_creation($b): ?array
{
    if (!is_array($b)) return null;
    $cr = ['prenom' => texte($b['prenom'] ?? null, 80), 'nom' => texte($b['nom'] ?? null, 80),
        'profil' => ($b['profil'] ?? '') === 'professionnel' ? 'professionnel' : 'particulier',
        'entreprise' => texte($b['entreprise'] ?? null, 120), 'siret' => (string) preg_replace('/\s/', '', texte($b['siret'] ?? null, 20))];
    if ($cr['prenom'] === '' || $cr['nom'] === '') return null;
    if ($cr['profil'] === 'particulier') $cr['entreprise'] = $cr['siret'] = '';
    elseif (!preg_match('/^\d{14}$/', $cr['siret'])) $cr['siret'] = '';
    return $cr;
}


function prendre_creation(string $email): ?array
{
    $cle = cle_code('espace', $email);
    $q = bd()->prepare('SELECT creation FROM espace_codes WHERE cle = ?');
    $q->execute([$cle]);
    $brut = $q->fetchColumn();
    if (!$brut) return null;
    bd()->prepare('UPDATE espace_codes SET creation = NULL WHERE cle = ?')->execute([$cle]);
    $cr = json_decode((string) $brut, true);
    return is_array($cr) ? $cr : null;
}


function appliquer_creation(array $c, ?array $cr): array
{
    if (!$cr || $c['nom'] !== '' || $c['prenom'] !== '') return $c;
    $c = ['prenom' => $cr['prenom'], 'nom' => $cr['nom'], 'profil' => $cr['profil'], 'entreprise' => $cr['entreprise'], 'siret' => $cr['siret'],
        'maj_le' => iso()] + $c;
    enregistrer_compte($c);
    return $c;
}


function creer_lien(string $email): string
{
    $jeton = bin2hex(random_bytes(16));
    bd()->prepare('INSERT INTO espace_liens (h, email, exp) VALUES (?, ?, ?)')
        ->execute([hash('sha256', $jeton), chiffrer($email), ms() + LIEN_MINUTES * 60000]);
    return $jeton;
}


function utiliser_lien(string $jeton): ?string
{
    if (!preg_match('/^[0-9a-f]{32}$/', $jeton)) return null;
    $h = hash('sha256', $jeton);
    return transaction(function (PDO $bd) use ($h) {
        $q = $bd->prepare('SELECT email, exp FROM espace_liens WHERE h = ?' . pour_maj());
        $q->execute([$h]);
        $l = $q->fetch();
        if (!$l) return null;
        $bd->prepare('DELETE FROM espace_liens WHERE h = ?')->execute([$h]);
        if (ms() > (int) $l['exp']) return null;
        $email = dechiffrer((string) $l['email']);
        if (!$email) return null;
        $bd->prepare("UPDATE espace_codes SET h = '', exp = 0, essais = 0 WHERE cle = ?")->execute([cle_code('espace', $email)]);
        return $email;
    });
}


function verifier_code(string $email, string $code, string $espace = 'espace'): string
{
    $cle = cle_code($espace, $email);
    return transaction(function (PDO $bd) use ($cle, $email, $code, $espace) {
        $q = $bd->prepare('SELECT h, exp, essais FROM espace_codes WHERE cle = ?' . pour_maj());
        $q->execute([$cle]);
        $l = $q->fetch();
        if (!$l || $l['h'] === '' || ms() > (int) $l['exp']) return 'code_expire';
        if ((int) $l['essais'] >= CODE_ESSAIS) return 'bloque';
        if (!preg_match('/^\d{6}$/', $code) || !hash_equals((string) $l['h'], signer("code|$espace|$email|$code"))) {
            $essais = (int) $l['essais'] + 1;
            $bd->prepare('UPDATE espace_codes SET essais = ? WHERE cle = ?')->execute([$essais, $cle]);
            return $essais >= CODE_ESSAIS ? 'bloque' : 'code_faux';
        }
        $bd->prepare("UPDATE espace_codes SET h = '', exp = 0, essais = 0 WHERE cle = ?")->execute([$cle]);
        return 'ok';
    });
}


function compte_depuis_ligne(array $l): array
{
    $piece = $l['piece_depose_le'] ? [
        'type' => (string) $l['piece_type'], 'numero' => dechiffrer($l['piece_numero']) ?? '',
        'expiration' => (string) ($l['piece_expiration'] ?? ''),
        'recto' => $l['piece_recto'] ?: null, 'verso' => $l['piece_verso'] ?: null, 'depose_le' => (string) $l['piece_depose_le'],
    ] : null;
    $rib = $l['rib_iban'] ? ['titulaire' => (string) $l['rib_titulaire'], 'iban' => dechiffrer($l['rib_iban']) ?? ''] : null;
    $c = ['piece' => $piece, 'rib' => $rib, 'langue' => langue_de($l['langue']), 'vendeur_id' => $l['vendeur_id'] ?: null,
        'prevenir' => in_array($l['prevenir'] ?? '', PREVENIR, true) ? (string) $l['prevenir'] : 'email',
        'archive_le' => ($l['archive_le'] ?? null) ?: null, 'rappel_piece' => ($l['rappel_piece'] ?? null) ?: null,
        'rib_maj_le' => ($l['rib_maj_le'] ?? null) ?: null];
    foreach (['id', 'email', 'cree_le', 'vu_le', 'maj_le', 'profil', 'nom', 'prenom', 'entreprise', 'siret', 'telephone', 'adresse', 'cp', 'ville'] as $k) $c[$k] = (string) $l[$k];
    return $c;
}

function enregistrer_compte(array $c): void
{
    $p = $c['piece'];
    $r = $c['rib'];
    $l = [
        'email' => $c['email'], 'cree_le' => $c['cree_le'], 'vu_le' => $c['vu_le'], 'maj_le' => $c['maj_le'], 'profil' => $c['profil'],
        'nom' => $c['nom'], 'prenom' => $c['prenom'], 'entreprise' => $c['entreprise'], 'siret' => $c['siret'], 'telephone' => $c['telephone'],
        'adresse' => $c['adresse'], 'cp' => $c['cp'], 'ville' => $c['ville'],
        'piece_type' => $p['type'] ?? null, 'piece_numero' => $p ? chiffrer($p['numero']) : null, 'piece_expiration' => $p['expiration'] ?? null,
        'piece_recto' => $p['recto'] ?? null, 'piece_verso' => $p['verso'] ?? null, 'piece_depose_le' => $p['depose_le'] ?? null,
        'rib_titulaire' => $r['titulaire'] ?? null, 'rib_iban' => $r ? chiffrer($r['iban']) : null,
        'langue' => $c['langue'], 'vendeur_id' => $c['vendeur_id'],
        'prevenir' => $c['prevenir'] ?? 'email', 'rappel_piece' => $c['rappel_piece'] ?? null, 'rib_maj_le' => $c['rib_maj_le'] ?? null,
    ];
    $q = bd()->prepare('SELECT 1 FROM espace_comptes WHERE id = ?');
    $q->execute([$c['id']]);
    if ($q->fetchColumn()) {
        bd()->prepare('UPDATE espace_comptes SET ' . implode(', ', array_map(fn ($k) => "$k = ?", array_keys($l))) . ' WHERE id = ?')
            ->execute([...array_values($l), $c['id']]);
    } else {
        $l = ['id' => $c['id']] + $l;
        bd()->prepare('INSERT INTO espace_comptes (' . implode(', ', array_keys($l)) . ') VALUES (' . implode(', ', array_fill(0, count($l), '?')) . ')')
            ->execute(array_values($l));
    }
}

function lire_compte(string $id): ?array
{
    $q = bd()->prepare('SELECT * FROM espace_comptes WHERE id = ?');
    $q->execute([$id]);
    $l = $q->fetch();
    return $l ? compte_depuis_ligne($l) : null;
}


function compte_par_email(string $email, string $langue): array
{
    $q = bd()->prepare('SELECT * FROM espace_comptes WHERE email = ?');
    $q->execute([$email]);
    $l = $q->fetch();
    $maintenant = iso();
    if ($l) {
        bd()->prepare('UPDATE espace_comptes SET vu_le = ?, langue = ? WHERE id = ?')->execute([$maintenant, $langue, $l['id']]);
        return compte_depuis_ligne($l);
    }
    $c = [
        'id' => uuid(), 'email' => $email, 'cree_le' => $maintenant, 'vu_le' => $maintenant, 'maj_le' => $maintenant, 'profil' => 'particulier',
        'nom' => '', 'prenom' => '', 'entreprise' => '', 'siret' => '', 'telephone' => '', 'adresse' => '', 'cp' => '', 'ville' => '',
        'piece' => null, 'rib' => null, 'langue' => $langue, 'vendeur_id' => null, 'prevenir' => 'email', 'archive_le' => null, 'rappel_piece' => null,
    ];
    enregistrer_compte($c);
    return $c;
}


function cookie_session(string $id): string
{
    $charge = b64url((string) json_encode(['id' => $id, 'exp' => ms() + SESSION_JOURS * 86400000]));
    return COOKIE_ESPACE . "=$charge." . signer('session|' . $charge) . '; Path=/; HttpOnly; ' . (https() || !mode_essai() ? 'Secure; ' : '')
        . 'SameSite=Lax; Max-Age=' . (SESSION_JOURS * 86400);
}

function cookie_efface(string $nom = COOKIE_ESPACE, string $samesite = 'Lax'): string
{
    return "$nom=; Path=/; HttpOnly; " . (https() || !mode_essai() ? 'Secure; ' : '') . "SameSite=$samesite; Max-Age=0";
}


function lire_cookie_signe(string $nom, string $sorte): ?array
{
    $brut = (string) ($_COOKIE[$nom] ?? '');
    $morceaux = explode('.', $brut);
    if (count($morceaux) !== 2 || $morceaux[0] === '' || !hash_equals(signer("$sorte|" . $morceaux[0]), $morceaux[1])) return null;
    $s = json_decode((string) deb64url($morceaux[0]), true);
    return is_array($s) && is_int($s['exp'] ?? null) && ms() < $s['exp'] ? $s : null;
}


function compte_connecte(): ?array
{
    $s = lire_cookie_signe(COOKIE_ESPACE, 'session');
    $c = $s && is_string($s['id'] ?? null) ? lire_compte($s['id']) : null;
    return $c && !$c['archive_le'] ? $c : null;
}



function compte_visible(array $c): array
{
    $p = $c['piece'];
    $iban = $c['rib']['iban'] ?? '';
    return [
        'email' => $c['email'], 'profil' => $c['profil'], 'nom' => $c['nom'], 'prenom' => $c['prenom'], 'entreprise' => $c['entreprise'],
        'siret' => $c['siret'], 'telephone' => $c['telephone'], 'adresse' => $c['adresse'], 'cp' => $c['cp'], 'ville' => $c['ville'],
        'piece' => $p ? ['type' => $p['type'], 'numero' => $p['numero'], 'expiration' => $p['expiration'], 'recto' => (bool) $p['recto'],
            'verso' => (bool) $p['verso'], 'depose_le' => $p['depose_le']] : null,
        'rib' => $c['rib'] ? ['titulaire' => $c['rib']['titulaire'], 'iban' => substr($iban, 0, 4) . ' •••• ' . substr($iban, -4)] : null,
        'rib_autre' => rib_autre_personne($c),
        'manque' => manques($c), 'prevenir' => $c['prevenir'] ?? 'email', 'cree_le' => $c['cree_le'],
    ];
}


function manques(array $c): array
{
    $m = [];
    $p = $c['piece'];
    if ($c['nom'] === '' || $c['prenom'] === '' || $c['adresse'] === '' || $c['cp'] === '' || $c['ville'] === ''
        || ($c['profil'] === 'professionnel' && ($c['entreprise'] === '' || $c['siret'] === ''))) $m[] = 'coordonnees';
    if ($c['profil'] === 'particulier' && (!$p || !$p['recto'] || $p['numero'] === '' || ($p['type'] !== 'Passeport' && !$p['verso']))) $m[] = 'piece';
    elseif ($c['profil'] === 'particulier' && $p && $p['expiration'] !== '' && $p['expiration'] < aujourdhui()) $m[] = 'piece_expiree';
    return $m;
}


function numero_international(string $tel): ?string
{
    $n = (string) preg_replace('/[^\d+]/', '', $tel);
    if (str_starts_with($n, '+')) $n = substr($n, 1);
    elseif (str_starts_with($n, '00')) $n = substr($n, 2);
    elseif (str_starts_with($n, '0')) $n = '33' . substr($n, 1);
    return preg_match('/^\d{8,15}$/', $n) ? $n : null;
}


function lire_coordonnees(array $b, array $c)
{
    $n = $c;
    $n['profil'] = ($b['profil'] ?? '') === 'professionnel' ? 'professionnel' : 'particulier';
    $n['nom'] = texte($b['nom'] ?? null, 80);
    $n['prenom'] = texte($b['prenom'] ?? null, 80);
    $n['entreprise'] = texte($b['entreprise'] ?? null, 120);
    $n['siret'] = (string) preg_replace('/\s/', '', texte($b['siret'] ?? null, 20));
    $n['telephone'] = texte($b['telephone'] ?? null, 30);
    $n['adresse'] = texte($b['adresse'] ?? null, 160);
    $n['cp'] = (string) preg_replace('/\s/', '', texte($b['cp'] ?? null, 10));
    $n['ville'] = texte($b['ville'] ?? null, 80);
    if ($n['nom'] === '' || $n['prenom'] === '') return 'nom';
    if ($n['adresse'] === '' || !preg_match('/^\d{5}$/', $n['cp']) || $n['ville'] === '') return 'adresse';
    if ($n['telephone'] !== '' && !numero_international($n['telephone'])) return 'telephone';
    if ($n['profil'] === 'professionnel' && ($n['entreprise'] === '' || !preg_match('/^\d{14}$/', $n['siret']))) return 'siret';
    if ($n['profil'] === 'particulier') $n['entreprise'] = $n['siret'] = '';
    $n['maj_le'] = iso();
    return $n;
}

const LONGUEURS_IBAN = ['FR' => 27, 'MC' => 27, 'DE' => 22, 'BE' => 16, 'LU' => 20, 'NL' => 18, 'CH' => 21, 'IT' => 27, 'ES' => 24,
    'PT' => 25, 'AT' => 20, 'GB' => 22, 'PL' => 28, 'IE' => 22];

function normaliser_iban(string $s): string
{
    return (string) preg_replace('/[^A-Z0-9]/', '', strtoupper($s));
}


function iban_valide(string $s): bool
{
    $iban = normaliser_iban($s);
    if (!preg_match('/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/', $iban)) return false;
    $attendue = LONGUEURS_IBAN[substr($iban, 0, 2)] ?? null;
    if ($attendue && strlen($iban) !== $attendue) return false;
    $chiffres = (string) preg_replace_callback('/[A-Z]/', fn ($m) => (string) (ord($m[0]) - 55), substr($iban, 4) . substr($iban, 0, 4));
    $reste = 0;
    foreach (str_split($chiffres) as $ch) $reste = ($reste * 10 + (int) $ch) % 97;
    return $reste === 1;
}


function lire_rib(array $b, array $c)
{
    $iban = normaliser_iban(texte($b['iban'] ?? null, 50));
    $titulaire = texte($b['titulaire'] ?? null, 80);
    if ($titulaire === '') return 'titulaire';
    if (!iban_valide($iban)) return 'iban';
    if (($c['rib']['iban'] ?? '') !== $iban) $c['rib_maj_le'] = iso();
    $c['rib'] = ['titulaire' => $titulaire, 'iban' => $iban];
    $c['maj_le'] = iso();
    return $c;
}



function rib_autre_personne(array $c): bool
{
    if (!$c['rib']) return false;
    $mots = function (string $s): array {
        $s = function_exists('mb_strtolower') ? mb_strtolower($s, 'UTF-8') : strtolower($s);
        $s = strtr($s, ['à' => 'a', 'â' => 'a', 'ä' => 'a', 'á' => 'a', 'ç' => 'c', 'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e', 'î' => 'i', 'ï' => 'i',
            'í' => 'i', 'ı' => 'i', 'ô' => 'o', 'ö' => 'o', 'ó' => 'o', 'ù' => 'u', 'û' => 'u', 'ü' => 'u', 'ú' => 'u', 'ÿ' => 'y', 'ñ' => 'n',
            'ß' => 'ss', 'ğ' => 'g', 'ş' => 's']);
        return array_values(array_filter((array) preg_split('/[^a-z0-9]+/', $s), fn ($m) => strlen((string) $m) >= 3));
    };
    $titulaire = $mots((string) $c['rib']['titulaire']);
    $noms = array_merge($mots((string) $c['nom']), $c['profil'] === 'professionnel' ? $mots((string) $c['entreprise']) : []);
    return $noms && $titulaire && !array_intersect($noms, $titulaire);
}


function lire_piece(array $b)
{
    $type = texte($b['type'] ?? null, 40);
    $numero = (string) preg_replace('/\s/', '', strtoupper(texte($b['numero'] ?? null, 40)));
    $expiration = texte($b['expiration'] ?? null, 10);
    if (!in_array($type, TYPES_PIECE, true)) return 'piece_type';
    if (!preg_match('/^[A-Z0-9<-]{4,30}$/', $numero)) return 'numero';
    if ($expiration !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $expiration)) return 'expiration';
    if ($expiration !== '' && $expiration < aujourdhui()) return 'piece_expiree';
    return ['type' => $type, 'numero' => $numero, 'expiration' => $expiration];
}


function dossier_photos(string $compte): string
{
    if (!preg_match('/^[0-9a-f-]{36}$/', $compte)) throw new RuntimeException('compte invalide');
    return prive() . "/pieces/$compte";
}

function est_jpeg(string $octets): bool
{
    if (strlen($octets) < 4 || substr($octets, 0, 3) !== "\xFF\xD8\xFF") return false;
    $i = @getimagesizefromstring($octets);
    return is_array($i) && ($i[2] ?? null) === IMAGETYPE_JPEG;
}


function garder_photo(string $compte, string $face, string $octets): string
{
    $d = dossier_photos($compte);
    if (!is_dir($d) && !mkdir($d, 0700, true) && !is_dir($d)) throw new RuntimeException('dossier des pièces impossible à créer');
    $nom = $face . '-' . bin2hex(random_bytes(8)) . '.bin';
    if (file_put_contents("$d/$nom", chiffrer_octets($octets), LOCK_EX) === false) throw new RuntimeException('photo non enregistrée');
    return $nom;
}

function lire_photo(string $compte, ?string $nom): ?string
{
    if (!$nom || !preg_match('/^(recto|verso)-[0-9a-f]{16}\.bin$/', $nom)) return null;
    $f = dossier_photos($compte) . "/$nom";
    $chiffre = is_file($f) ? file_get_contents($f) : false;
    return is_string($chiffre) ? dechiffrer_octets($chiffre) : null;
}

function effacer_photo(string $compte, ?string $nom): void
{
    if ($nom && preg_match('/^(recto|verso)-[0-9a-f]{16}\.bin$/', $nom)) @unlink(dossier_photos($compte) . "/$nom");
}

function effacer_dossier_photos(string $compte): void
{
    $d = dossier_photos($compte);
    if (!is_dir($d)) return;
    foreach ((array) glob("$d/*") as $f) @unlink((string) $f);
    @rmdir($d);
}


function servir_photo(string $octets): void
{
    http_response_code(200);
    header('Content-Type: image/jpeg');
    header('Cache-Control: private, no-store');
    header('X-Content-Type-Options: nosniff');
    header('Content-Length: ' . strlen($octets));
    echo $octets;
    exit;
}


function envoi_depuis_ligne(array $l): array
{
    return [
        'id' => (string) $l['id'], 'reference' => (string) $l['reference'], 'compte' => (string) $l['compte'], 'cree_le' => (string) $l['cree_le'],
        'colis' => array_values((array) json_decode((string) $l['colis'], true)), 'total' => (float) $l['total'],
        'paiement' => (string) $l['paiement'], 'message' => (string) $l['message'],
        'traite_le' => $l['traite_le'] ?: null, 'traite_par' => (string) $l['traite_par'],
        'bon_numero' => $l['bon_numero'] ?: null, 'bon_le' => $l['bon_le'] ?: null,
        'prix_kg' => isset($l['prix_kg']) ? (float) $l['prix_kg'] : null, 'garanti_jusqu' => ($l['garanti_jusqu'] ?? null) ?: null,
        'recu_le' => ($l['recu_le'] ?? null) ?: null, 'pese_le' => ($l['pese_le'] ?? null) ?: null,
        'poids_brut' => isset($l['poids_brut']) ? (float) $l['poids_brut'] : null, 'poids_net' => isset($l['poids_net']) ? (float) $l['poids_net'] : null,
        'paye_le' => ($l['paye_le'] ?? null) ?: null, 'montant' => isset($l['montant']) ? (float) $l['montant'] : null,
        'paye_detail' => (string) ($l['paye_detail'] ?? ''), 'bon_redemande_le' => ($l['bon_redemande_le'] ?? null) ?: null,
        'cgv_version' => ($l['cgv_version'] ?? null) ?: null, 'cgv_le' => ($l['cgv_le'] ?? null) ?: null,

        'accord_le' => ($l['accord_le'] ?? null) ?: null, 'accord_par' => (string) ($l['accord_par'] ?? ''),
        'depot_reponse' => ($l['depot_reponse'] ?? null) ?: null, 'depot_repondu_le' => ($l['depot_repondu_le'] ?? null) ?: null,
        'retard' => array_filter((array) json_decode((string) ($l['retard'] ?? ''), true), 'is_string'),
    ];
}



function colis_en_retard(array $e): bool
{
    if (!$e['traite_le'] || ($e['recu_le'] ?? null) || ($e['pese_le'] ?? null) || ($e['paye_le'] ?? null) || $e['bon_numero']) return false;
    return heures_ouvrees((int) (strtotime((string) $e['traite_le']) * 1000)) >= JOURS_COLIS_ATTENDU * 24;
}



function question_depot(array $e): bool
{
    if (!colis_en_retard($e) || ($e['depot_reponse'] ?? null) === 'oui') return false;
    return ($e['depot_reponse'] ?? null) !== 'pas_encore' || (string) $e['depot_repondu_le'] < iso(ms() - 3 * 86400000);
}


function repondre_depot(array $e, string $reponse): ?array
{
    if (!in_array($reponse, ['oui', 'pas_encore'], true) || !colis_en_retard($e)) return null;
    bd()->prepare('UPDATE espace_envois SET depot_reponse = ?, depot_repondu_le = ? WHERE id = ?')->execute([$reponse, iso(), $e['id']]);
    return lire_envoi($e['id']);
}

function envois_du(string $compte): array
{
    $q = bd()->prepare('SELECT * FROM espace_envois WHERE compte = ? ORDER BY cree_le DESC');
    $q->execute([$compte]);
    return array_map('envoi_depuis_ligne', $q->fetchAll());
}

function lire_envoi(string $id): ?array
{
    $q = bd()->prepare('SELECT * FROM espace_envois WHERE id = ?');
    $q->execute([$id]);
    $l = $q->fetch();
    return $l ? envoi_depuis_ligne($l) : null;
}


function envoi_visible(array $e): array
{
    return ['reference' => $e['reference'], 'cree_le' => $e['cree_le'], 'colis' => $e['colis'], 'total' => $e['total'],
        'paiement' => $e['paiement'], 'traite_le' => $e['traite_le'], 'prix_kg' => $e['prix_kg'] ?? null, 'garanti_jusqu' => $e['garanti_jusqu'] ?? null,
        'recu_le' => $e['recu_le'] ?? null, 'pese_le' => $e['pese_le'] ?? null, 'poids_brut' => $e['poids_brut'] ?? null,
        'poids_net' => $e['poids_net'] ?? null, 'paye_le' => $e['paye_le'] ?? null, 'montant' => $e['montant'] ?? null,
        'bon_numero' => $e['bon_numero'] ?? null, 'bon_redemande_le' => $e['bon_redemande_le'] ?? null,
        'accord_le' => $e['accord_le'] ?? null, 'depot_reponse' => $e['depot_reponse'] ?? null, 'depot_question' => question_depot($e)];
}


function reference_envoi(): string
{
    $a = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    $s = '';
    for ($i = 0; $i < 4; $i++) $s .= $a[random_int(0, strlen($a) - 1)];
    return 'COL-' . gmdate('ymd') . '-' . $s;
}

function creer_envoi(array $e): void
{
    for ($essai = 0; ; $essai++) {
        try {
            bd()->prepare('INSERT INTO espace_envois (id, reference, compte, cree_le, colis, total, paiement, message, traite_le, traite_par, prix_kg, garanti_jusqu, cgv_version, cgv_le)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, \'\', ?, ?, ?, ?)')
                ->execute([$e['id'], $e['reference'], $e['compte'], $e['cree_le'], json_encode($e['colis'], JSON_UNESCAPED_UNICODE),
                    $e['total'], $e['paiement'], $e['message'], $e['prix_kg'] ?? null, $e['garanti_jusqu'] ?? null,
                    $e['cgv_version'] ?? null, $e['cgv_le'] ?? null]);
            return;
        } catch (PDOException $x) {

            if ($essai >= 3) throw $x;
            $e['reference'] = reference_envoi();
        }
    }
}


function a_vendu(array $c): bool
{
    foreach (envois_du($c['id']) as $e) {
        if ($e['traite_le'] || ($e['recu_le'] ?? null) || $e['bon_numero'] || ($e['paye_le'] ?? null)) return true;
    }
    return false;
}



function archiver_compte(array $c): void
{
    transaction(function (PDO $bd) use ($c) {
        $bd->prepare("UPDATE espace_comptes SET email = ?, telephone = '', rib_titulaire = NULL, rib_iban = NULL, prevenir = NULL, archive_le = ? WHERE id = ?")
            ->execute(['supprime+' . $c['id'] . '@compte.invalid', iso(), $c['id']]);
        $bd->prepare('DELETE FROM espace_codes WHERE cle = ?')->execute([cle_code('espace', $c['email'])]);

        $bd->prepare('DELETE FROM site_mails WHERE envoi IN (SELECT id FROM espace_envois WHERE compte = ? AND traite_le IS NULL AND recu_le IS NULL AND bon_numero IS NULL AND paye_le IS NULL)')
            ->execute([$c['id']]);
        $bd->prepare('DELETE FROM espace_envois WHERE compte = ? AND traite_le IS NULL AND recu_le IS NULL AND bon_numero IS NULL AND paye_le IS NULL')
            ->execute([$c['id']]);
    });
}



function supprimer_compte(array $c): void
{
    if (a_vendu($c)) { archiver_compte($c); return; }
    transaction(function (PDO $bd) use ($c) {
        $bd->prepare('DELETE FROM site_mails WHERE envoi IN (SELECT id FROM espace_envois WHERE compte = ?)')->execute([$c['id']]);
        $bd->prepare('DELETE FROM espace_envois WHERE compte = ?')->execute([$c['id']]);
        $bd->prepare('DELETE FROM espace_codes WHERE cle = ?')->execute([cle_code('espace', $c['email'])]);
        $bd->prepare('DELETE FROM espace_comptes WHERE id = ?')->execute([$c['id']]);
    });
    effacer_dossier_photos($c['id']);
}




const DELAI_ETIQUETTE_H = 24, DELAI_PAIEMENT_H = 48, DELAI_REPONSE_H = 24;



function retards(): array
{
    $r = [];
    $h = fn (string $iso): float => heures_ouvrees((int) (strtotime($iso) * 1000));
    foreach (bd()->query('SELECT reference, cree_le, traite_le, accord_le FROM espace_envois WHERE paye_le IS NULL')->fetchAll() as $l) {
        if (!$l['traite_le'] && $h($l['cree_le']) > DELAI_ETIQUETTE_H) {
            $r[] = 'Étiquette à envoyer pour ' . $l['reference'] . ' : la demande attend depuis ' . round($h($l['cree_le'])) . ' h (promis : 24 h).';
        }
        if ($l['accord_le'] && $h($l['accord_le']) > DELAI_PAIEMENT_H) {
            $r[] = 'Paiement à faire pour ' . $l['reference'] . ' : le client a donné son accord il y a ' . round($h($l['accord_le'])) . ' h (promis : 48 h).';
        }
    }
    foreach (bd()->query('SELECT sujet, cree_le FROM site_messages WHERE repondu_le IS NULL')->fetchAll() as $l) {
        if ($h($l['cree_le']) > DELAI_REPONSE_H) {
            $r[] = 'Message sans réponse depuis ' . round($h($l['cree_le'])) . ' h : « ' . coupe((string) $l['sujet'], 80) . ' » (promis : 24 h).';
        }
    }
    return $r;
}


function rappel_retards(): void
{
    $m = new DateTimeImmutable('now', new DateTimeZone('Europe/Paris'));
    $jour = $m->format('Y-m-d');
    if ((int) $m->format('G') < 8) return;
    $f = prive() . '/retards.jour';
    if (@file_get_contents($f) === $jour) return;
    @file_put_contents($f, $jour, LOCK_EX);
    if (!est_ouvre($jour)) return;
    apres_reponse(function () {
        $a = (string) reglage('mail_admin', '');
        $lignes = retards();
        if ($a === '' || !$lignes) return;
        mail_resume_mois($a, '⏰ ' . count($lignes) . (count($lignes) > 1 ? ' choses dépassent tes délais' : ' chose dépasse tes délais'), $lignes, adresse_site() . '/gestion/');
    });
}

function menage_du_jour(): void
{
    rappel_retards();
    $f = prive() . '/menage.jour';
    $jour = aujourdhui();
    if (@file_get_contents($f) === $jour) return;
    @file_put_contents($f, $jour, LOCK_EX);
    apres_reponse(function () {
        $limite = iso(ms() - (int) (3 * 365.25 * 86400000));
        $q = bd()->prepare('SELECT * FROM espace_comptes WHERE vu_le < ? AND archive_le IS NULL');
        $q->execute([$limite]);
        foreach ($q->fetchAll() as $l) supprimer_compte(compte_depuis_ligne($l));
        $maintenant = ms();
        bd()->prepare('DELETE FROM espace_liens WHERE exp < ?')->execute([$maintenant]);
        rappeler_pieces();
        rappeler_garanties();
        $q = bd()->prepare('SELECT cle, envois FROM espace_codes WHERE exp < ?');
        $q->execute([$maintenant]);
        foreach ($q->fetchAll() as $l) {
            $envois = (array) json_decode((string) $l['envois'], true);
            if (!array_filter($envois, fn ($t) => is_int($t) && $maintenant - $t <= 86400000)) {
                bd()->prepare('DELETE FROM espace_codes WHERE cle = ?')->execute([$l['cle']]);
            }
        }
        menage_site();
    });
}



function client_pour_malik(array $c): array
{
    $p = $c['piece'];
    return [
        'id' => $c['id'], 'email' => $c['email'], 'profil' => $c['profil'], 'nom' => $c['nom'], 'prenom' => $c['prenom'],
        'entreprise' => $c['entreprise'], 'siret' => $c['siret'], 'telephone' => $c['telephone'], 'adresse' => $c['adresse'],
        'cp' => $c['cp'], 'ville' => $c['ville'], 'rib' => $c['rib'], 'vendeur_id' => $c['vendeur_id'], 'langue' => $c['langue'],
        'rib_maj_le' => $c['rib_maj_le'] ?? null, 'rib_autre' => rib_autre_personne($c), 'cree_le' => $c['cree_le'],
        'piece' => $p ? ['type' => $p['type'], 'numero' => $p['numero'], 'expiration' => $p['expiration'], 'recto' => (bool) $p['recto'],
            'verso' => (bool) $p['verso'], 'depose_le' => $p['depose_le']] : null,
    ];
}



function demandes_pour_malik(string $etat): array
{
    $ou = $etat === 'a_traiter' ? 'WHERE traite_le IS NULL' : ($etat === 'en_cours' ? 'WHERE bon_numero IS NULL' : '');
    $ordre = $etat === 'toutes' ? 'DESC' : 'ASC';
    $q = bd()->query("SELECT * FROM espace_envois $ou ORDER BY cree_le $ordre LIMIT 300");
    $envois = array_map('envoi_depuis_ligne', $q->fetchAll());
    $mails = mails_des_envois(array_column($envois, 'id'));
    $comptes = [];
    $r = [];
    foreach ($envois as $e) {
        $comptes[$e['compte']] ??= lire_compte($e['compte']);
        if ($comptes[$e['compte']]) {
            $r[] = $e + ['client' => client_pour_malik($comptes[$e['compte']]), 'mails' => $mails[$e['id']] ?? [], 'colis_en_retard' => colis_en_retard($e)];
        }
    }
    return $r;
}

const ETAPES_A_PREVENIR = ['traite', 'recu', 'pese', 'paye'];



function marquer_envoi(string $id, string $action, string $par, string $numero = '', array $x = []): ?array
{
    $e = lire_envoi($id);
    if (!$e) return null;
    $kg = fn ($v) => is_numeric($v) && (float) $v > 0 && (float) $v < 1000 ? round((float) $v * 100) / 100 : null;
    switch ($action) {
        case 'traite': $e = ['traite_le' => iso(), 'traite_par' => coupe($par, 60)] + $e; break;
        case 'remettre': $e = ['traite_le' => null, 'traite_par' => ''] + $e; break;
        case 'recu': $e = ['recu_le' => iso(), 'traite_le' => $e['traite_le'] ?? iso()] + $e; break;
        case 'sans_recu': $e = ['recu_le' => null] + $e; break;
        case 'pese':
            $net = $kg($x['poids_net'] ?? null);
            if ($net === null) return null;

            $montant = is_numeric($x['montant'] ?? null) && (float) $x['montant'] > 0 && (float) $x['montant'] < 1000000
                ? round((float) $x['montant'] * 100) / 100 : null;
            $e = ['pese_le' => iso(), 'poids_net' => $net, 'poids_brut' => $kg($x['poids_brut'] ?? null), 'recu_le' => ($e['recu_le'] ?? null) ?: iso(),
                'montant' => $montant] + $e;
            break;
        case 'sans_pese': $e = ['pese_le' => null, 'poids_net' => null, 'poids_brut' => null, 'accord_le' => null, 'accord_par' => ''] + $e; break;


        case 'accord':
            if (!($e['pese_le'] ?? null)) return null;
            $e = ['accord_le' => iso(), 'accord_par' => texte($x['par'] ?? null, 20)] + $e;
            break;
        case 'sans_accord': $e = ['accord_le' => null, 'accord_par' => ''] + $e; break;

        case 'retard':
            $etape = (string) ($x['etape'] ?? '');
            if (!in_array($etape, ['reclamation', 'prevenu', 'indemnite'], true)) return null;
            $r = $e['retard'] ?? [];
            if (($x['fait'] ?? true) === false) unset($r[$etape]);
            else $r[$etape] = iso();
            $e = ['retard' => $r] + $e;
            break;
        case 'paye':
            $m = is_numeric($x['montant'] ?? null) && (float) $x['montant'] > 0 ? round((float) $x['montant'] * 100) / 100
                : (($e['poids_net'] ?? null) && ($e['prix_kg'] ?? null) ? round($e['poids_net'] * $e['prix_kg'] * 100) / 100 : null);

            $e = ['paye_le' => iso(), 'montant' => $m, 'paye_detail' => texte($x['detail'] ?? null, 60), 'accord_le' => ($e['accord_le'] ?? null) ?: iso()] + $e;
            break;
        case 'sans_paye': $e = ['paye_le' => null, 'montant' => null, 'paye_detail' => ''] + $e; break;
        case 'bon': $e = ['bon_numero' => coupe($numero, 20), 'bon_le' => iso(), 'traite_le' => $e['traite_le'] ?? iso()] + $e; break;
        case 'sans_bon': $e = ['bon_numero' => null, 'bon_le' => null] + $e; break;
        default: return null;
    }
    bd()->prepare('UPDATE espace_envois SET traite_le = ?, traite_par = ?, bon_numero = ?, bon_le = ?, recu_le = ?, pese_le = ?, poids_brut = ?,
        poids_net = ?, paye_le = ?, montant = ?, paye_detail = ?, accord_le = ?, accord_par = ?, retard = ? WHERE id = ?')
        ->execute([$e['traite_le'], $e['traite_par'], $e['bon_numero'], $e['bon_le'], $e['recu_le'] ?? null, $e['pese_le'] ?? null,
            $e['poids_brut'] ?? null, $e['poids_net'] ?? null, $e['paye_le'] ?? null, $e['montant'] ?? null, $e['paye_detail'] ?? '',
            $e['accord_le'] ?? null, ($e['accord_par'] ?? '') ?: null, !empty($e['retard']) ? json_encode($e['retard']) : null, $id]);
    return $e;
}


function mails_des_envois(array $ids): array
{
    $r = [];
    foreach (array_chunk(array_values(array_unique($ids)), 200) as $lot) {
        $q = bd()->prepare('SELECT envoi, le, objet FROM site_mails WHERE envoi IN (' . implode(',', array_fill(0, count($lot), '?')) . ') ORDER BY le');
        $q->execute($lot);
        foreach ($q->fetchAll() as $l) $r[$l['envoi']][] = ['le' => $l['le'], 'objet' => $l['objet']];
    }
    return $r;
}



function prevenir_etape(array $e, string $action): ?string
{
    if (!in_array($action, ETAPES_A_PREVENIR, true)) return null;
    $c = lire_compte($e['compte']);
    if (!$c || $c['archive_le']) return null;
    if (in_array($c['prevenir'], ['email', 'les-deux'], true)) apres_reponse(fn () => mail_etape($c, $e, $action));
    $tel = in_array($c['prevenir'], ['whatsapp', 'les-deux'], true) ? numero_international($c['telephone']) : null;
    return $tel ? 'https://wa.me/' . $tel . '?text=' . rawurlencode(texte_whatsapp_etape($c, $e, $action)) : null;
}


function envoi_du_compte(array $c, string $reference): ?array
{
    foreach (envois_du($c['id']) as $e) if ($e['reference'] === $reference) return $e;
    return null;
}


function rappeler_garanties(): void
{
    $dans2 = (new DateTimeImmutable(aujourdhui() . ' 12:00:00'))->modify('+2 days')->format('Y-m-d');
    $q = bd()->prepare('SELECT * FROM espace_envois WHERE garanti_jusqu = ? AND traite_le IS NOT NULL AND recu_le IS NULL AND bon_numero IS NULL AND paye_le IS NULL AND rappel_garantie IS NULL LIMIT 20');
    $q->execute([$dans2]);
    foreach ($q->fetchAll() as $l) {
        $e = envoi_depuis_ligne($l);
        $c = lire_compte($e['compte']);
        bd()->prepare('UPDATE espace_envois SET rappel_garantie = ? WHERE id = ?')->execute([iso(), $e['id']]);
        if ($c && !$c['archive_le']) apres_reponse(fn () => mail_rappel_garantie($c, $e));
    }
}


function rappeler_pieces(): void
{
    $auj = aujourdhui();
    $dans30 = (new DateTimeImmutable($auj . ' 12:00:00'))->modify('+30 days')->format('Y-m-d');
    $q = bd()->prepare("SELECT * FROM espace_comptes WHERE archive_le IS NULL AND piece_expiration IS NOT NULL AND piece_expiration <> ''
        AND piece_expiration >= ? AND piece_expiration <= ? LIMIT 10");
    $q->execute([$auj, $dans30]);
    foreach ($q->fetchAll() as $l) {
        $c = compte_depuis_ligne($l);
        if (!$c['piece'] || $c['rappel_piece'] === $c['piece']['expiration']) continue;
        bd()->prepare('UPDATE espace_comptes SET rappel_piece = ? WHERE id = ?')->execute([$c['piece']['expiration'], $c['id']]);
        mail_piece_bientot($c);
    }
}
