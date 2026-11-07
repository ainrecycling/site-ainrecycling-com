<?php
declare(strict_types=1);

require_once __DIR__ . '/base.php';
require_once __DIR__ . '/mail.php';

// Espace client du site (demandé par Malik le 2 nov. 2026 : « que les gens créent un compte pour ne pas renvoyer leur
// pièce d'identité »), refait chez OVH le 6 nov. 2026 avec les mêmes adresses (/api/espace/…), les mêmes réponses et les
// mêmes codes d'erreur que la première version (lib/espace-serveur.ts de l'appli) : site.js n'a rien à changer.
// Connexion par un code à 6 chiffres envoyé par e-mail (pas de mot de passe), puis cookie de session signé, 60 jours.
// Comptes et demandes dans la base MySQL ; n° de pièce et IBAN chiffrés ; photos de la pièce chiffrées dans le dossier
// privé (pieces/<compte>/), jamais servies telles quelles.

const COOKIE_ESPACE = 'espace';
const SESSION_JOURS = 60;
const CODE_MINUTES = 10, CODE_ESSAIS = 5, CODES_PAR_QUART = 3, CODES_PAR_JOUR = 8, CODES_JOUR_TOTAL = 40;
const PHOTO_MAX = 4 * 1024 * 1024, COLIS_MAX = 5, KG_PAR_COLIS = 20, ENVOIS_PAR_JOUR = 3;
const LANGUES = ['fr', 'de', 'en', 'it', 'es'];
const MATIERES = ['Plaquettes carbure', 'Forets / fraises carbure', 'Lot mélangé (plaquettes, forets, fraises)'];
const TYPES_PIECE = ["Carte d'identité", 'Passeport', 'Titre de séjour', 'Permis de conduire'];

function langue_de($x): string
{
    return in_array($x, LANGUES, true) ? $x : 'fr';
}

function email_valide($x): ?string
{
    $s = is_string($x) ? strtolower(trim($x)) : '';
    return strlen($s) <= 120 && preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u', $s) ? $s : null;
}

/** Robot : case cachée remplie, ou envoi moins de 2 secondes après l'ouverture de la page. */
function robot(array $b): bool
{
    return (is_string($b['site'] ?? null) && $b['site'] !== '') || !(is_numeric($b['duree'] ?? null) && (float) $b['duree'] >= 2000);
}

// ---------- codes de connexion ----------
function cle_code(string $espace, string $email): string
{
    return hash('sha256', $espace . '|' . $email);
}

/** Envoie un code à 6 chiffres (10 minutes, 5 essais). Limites : 3 codes par quart d'heure et 8 par jour pour une
 *  adresse, 40 par jour en tout (le quota gratuit de Resend sert aussi aux bons de l'appli). */
function envoyer_code(string $email, string $langue, string $espace = 'espace'): string
{
    $maintenant = ms();
    $jour = aujourdhui();
    $cle = cle_code($espace, $email);
    $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $r = transaction(function (PDO $bd) use ($maintenant, $jour, $cle, $email, $code, $espace) {
        $q = $bd->prepare('SELECT envois FROM espace_codes WHERE cle = ?' . pour_maj());
        $q->execute([$cle]);
        $l = $q->fetch();
        $envois = array_values(array_filter((array) json_decode($l['envois'] ?? '[]', true), fn ($t) => is_int($t) && $maintenant - $t < 86400000));
        $quart = count(array_filter($envois, fn ($t) => $maintenant - $t < 900000));
        if ($quart >= CODES_PAR_QUART || count($envois) >= CODES_PAR_JOUR) return 'trop';
        $q = $bd->prepare('SELECT jour, n FROM espace_compteurs WHERE nom = ?' . pour_maj());
        $q->execute(['codes']);
        $t = $q->fetch();
        $n = $t && $t['jour'] === $jour ? (int) $t['n'] : 0;
        if ($n >= CODES_JOUR_TOTAL) return 'trop';
        $envois[] = $maintenant;
        $valeurs = [signer("code|$espace|$email|$code"), $maintenant + CODE_MINUTES * 60000, json_encode($envois), $cle];
        if ($l) $bd->prepare('UPDATE espace_codes SET h = ?, exp = ?, essais = 0, envois = ? WHERE cle = ?')->execute($valeurs);
        else $bd->prepare('INSERT INTO espace_codes (h, exp, essais, envois, cle) VALUES (?, ?, 0, ?, ?)')->execute($valeurs);
        if ($t) $bd->prepare('UPDATE espace_compteurs SET jour = ?, n = ? WHERE nom = ?')->execute([$jour, $n + 1, 'codes']);
        else $bd->prepare('INSERT INTO espace_compteurs (jour, n, nom) VALUES (?, ?, ?)')->execute([$jour, 1, 'codes']);
        return 'ok';
    });
    if ($r !== 'ok') return $r;
    mail_code($email, $code, $langue, $espace);
    return 'ok';
}

/** Le code tapé : bon (il ne resservira pas), faux, périmé, ou bloqué après 5 essais. */
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

// ---------- comptes ----------
function compte_depuis_ligne(array $l): array
{
    $piece = $l['piece_depose_le'] ? [
        'type' => (string) $l['piece_type'], 'numero' => dechiffrer($l['piece_numero']) ?? '',
        'expiration' => (string) ($l['piece_expiration'] ?? ''),
        'recto' => $l['piece_recto'] ?: null, 'verso' => $l['piece_verso'] ?: null, 'depose_le' => (string) $l['piece_depose_le'],
    ] : null;
    $rib = $l['rib_iban'] ? ['titulaire' => (string) $l['rib_titulaire'], 'iban' => dechiffrer($l['rib_iban']) ?? ''] : null;
    $c = ['piece' => $piece, 'rib' => $rib, 'langue' => langue_de($l['langue']), 'vendeur_id' => $l['vendeur_id'] ?: null];
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

/** Le compte de cette adresse, créé à la première connexion. */
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
        'piece' => null, 'rib' => null, 'langue' => $langue, 'vendeur_id' => null,
    ];
    enregistrer_compte($c);
    return $c;
}

// ---------- sessions ----------
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

/** Contenu d'un cookie signé « charge.signature » encore valable, sinon null. */
function lire_cookie_signe(string $nom, string $sorte): ?array
{
    $brut = (string) ($_COOKIE[$nom] ?? '');
    $morceaux = explode('.', $brut);
    if (count($morceaux) !== 2 || $morceaux[0] === '' || !hash_equals(signer("$sorte|" . $morceaux[0]), $morceaux[1])) return null;
    $s = json_decode((string) deb64url($morceaux[0]), true);
    return is_array($s) && is_int($s['exp'] ?? null) && ms() < $s['exp'] ? $s : null;
}

/** Le compte de la personne connectée (cookie signé encore valable), sinon null. */
function compte_connecte(): ?array
{
    $s = lire_cookie_signe(COOKIE_ESPACE, 'session');
    return $s && is_string($s['id'] ?? null) ? lire_compte($s['id']) : null;
}

// ---------- ce que la personne voit, ce qu'elle envoie ----------
/** Ce que la personne voit de son compte : sans les chemins des photos, avec l'IBAN en partie caché. */
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
        'manque' => manques($c),
    ];
}

/** Ce qui manque pour demander un envoi (le RIB n'est demandé que pour un paiement par virement). */
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

/** Numéro de téléphone au format international (33…), ou null s'il n'est pas valable (même règle que l'appli). */
function numero_international(string $tel): ?string
{
    $n = (string) preg_replace('/[^\d+]/', '', $tel);
    if (str_starts_with($n, '+')) $n = substr($n, 1);
    elseif (str_starts_with($n, '00')) $n = substr($n, 2);
    elseif (str_starts_with($n, '0')) $n = '33' . substr($n, 1);
    return preg_match('/^\d{8,15}$/', $n) ? $n : null;
}

/** Coordonnées envoyées par le formulaire, vérifiées (France métropolitaine : code postal à 5 chiffres). */
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

/** IBAN juste : sa clé de contrôle (calcul « modulo 97 »), comme dans l'appli. */
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

/** RIB (paiement par virement) : un IBAN juste et le nom du titulaire. */
function lire_rib(array $b, array $c)
{
    $iban = normaliser_iban(texte($b['iban'] ?? null, 50));
    $titulaire = texte($b['titulaire'] ?? null, 80);
    if ($titulaire === '') return 'titulaire';
    if (!iban_valide($iban)) return 'iban';
    $c['rib'] = ['titulaire' => $titulaire, 'iban' => $iban];
    $c['maj_le'] = iso();
    return $c;
}

/** Champs de la pièce (type, numéro, date de fin) ; les photos arrivent à part. Une pièce périmée est refusée. */
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

// ---------- photos de la pièce : chiffrées dans le dossier privé ----------
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

/** Garde la photo (chiffrée) et renvoie son nom de fichier. */
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

/** Envoie la photo déchiffrée, jamais gardée en cache. */
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

// ---------- demandes d'envoi par colis ----------
function envoi_depuis_ligne(array $l): array
{
    return [
        'id' => (string) $l['id'], 'reference' => (string) $l['reference'], 'compte' => (string) $l['compte'], 'cree_le' => (string) $l['cree_le'],
        'colis' => array_values((array) json_decode((string) $l['colis'], true)), 'total' => (float) $l['total'],
        'paiement' => (string) $l['paiement'], 'message' => (string) $l['message'],
        'traite_le' => $l['traite_le'] ?: null, 'traite_par' => (string) $l['traite_par'],
        'bon_numero' => $l['bon_numero'] ?: null, 'bon_le' => $l['bon_le'] ?: null,
    ];
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

/** Ce que la personne voit de ses demandes (sans les notes internes). */
function envoi_visible(array $e): array
{
    return ['reference' => $e['reference'], 'cree_le' => $e['cree_le'], 'colis' => $e['colis'], 'total' => $e['total'],
        'paiement' => $e['paiement'], 'traite_le' => $e['traite_le']];
}

/** Référence lisible à écrire sur le colis : COL-AAMMJJ- + 4 caractères sans ambiguïté (pas de 0/O ni 1/I). */
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
            bd()->prepare('INSERT INTO espace_envois (id, reference, compte, cree_le, colis, total, paiement, message, traite_le, traite_par)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, \'\')')
                ->execute([$e['id'], $e['reference'], $e['compte'], $e['cree_le'], json_encode($e['colis'], JSON_UNESCAPED_UNICODE),
                    $e['total'], $e['paiement'], $e['message']]);
            return;
        } catch (PDOException $x) {
            // référence déjà prise (une chance sur un million par jour) : une autre
            if ($essai >= 3) throw $x;
            $e['reference'] = reference_envoi();
        }
    }
}

/** Supprime le compte, ses photos et ses demandes (la fiche du carnet de l'appli, elle, reste à Malik). */
function supprimer_compte(array $c): void
{
    transaction(function (PDO $bd) use ($c) {
        $bd->prepare('DELETE FROM espace_envois WHERE compte = ?')->execute([$c['id']]);
        $bd->prepare('DELETE FROM espace_codes WHERE cle = ?')->execute([cle_code('espace', $c['email'])]);
        $bd->prepare('DELETE FROM espace_comptes WHERE id = ?')->execute([$c['id']]);
    });
    effacer_dossier_photos($c['id']);
}

// ---------- ménage quotidien (fait par la première demande du jour, après la réponse) ----------
/** Les comptes sans connexion depuis 3 ans sont supprimés (promis dans la politique de confidentialité du site) ; les
 *  codes de connexion qui ne servent plus aux limites de la journée sont effacés. */
function menage_du_jour(): void
{
    $f = prive() . '/menage.jour';
    $jour = aujourdhui();
    if (@file_get_contents($f) === $jour) return;
    @file_put_contents($f, $jour, LOCK_EX);
    apres_reponse(function () {
        $limite = iso(ms() - (int) (3 * 365.25 * 86400000));
        $q = bd()->prepare('SELECT * FROM espace_comptes WHERE vu_le < ?');
        $q->execute([$limite]);
        foreach ($q->fetchAll() as $l) supprimer_compte(compte_depuis_ligne($l));
        $maintenant = ms();
        $q = bd()->prepare('SELECT cle, envois FROM espace_codes WHERE exp < ?');
        $q->execute([$maintenant]);
        foreach ($q->fetchAll() as $l) {
            $envois = (array) json_decode((string) $l['envois'], true);
            if (!array_filter($envois, fn ($t) => is_int($t) && $maintenant - $t <= 86400000)) {
                bd()->prepare('DELETE FROM espace_codes WHERE cle = ?')->execute([$l['cle']]);
            }
        }
    });
}

// ---------- pour Malik (page des demandes) et pour l'appli (adresse privée) ----------
/** Tout ce qu'il faut pour faire l'étiquette et le bon : coordonnées, pièce (n° en clair), RIB complet. */
function client_pour_malik(array $c): array
{
    $p = $c['piece'];
    return [
        'id' => $c['id'], 'email' => $c['email'], 'profil' => $c['profil'], 'nom' => $c['nom'], 'prenom' => $c['prenom'],
        'entreprise' => $c['entreprise'], 'siret' => $c['siret'], 'telephone' => $c['telephone'], 'adresse' => $c['adresse'],
        'cp' => $c['cp'], 'ville' => $c['ville'], 'rib' => $c['rib'], 'vendeur_id' => $c['vendeur_id'], 'langue' => $c['langue'],
        'piece' => $p ? ['type' => $p['type'], 'numero' => $p['numero'], 'expiration' => $p['expiration'], 'recto' => (bool) $p['recto'],
            'verso' => (bool) $p['verso'], 'depose_le' => $p['depose_le']] : null,
    ];
}

/** Les demandes avec leur client : « a_traiter » (étiquette pas encore envoyée), « en_cours » (pas encore de bon),
 *  « toutes » (les 300 dernières). Les plus anciennes d'abord pour les deux premières. */
function demandes_pour_malik(string $etat): array
{
    $ou = $etat === 'a_traiter' ? 'WHERE traite_le IS NULL' : ($etat === 'en_cours' ? 'WHERE bon_numero IS NULL' : '');
    $ordre = $etat === 'toutes' ? 'DESC' : 'ASC';
    $q = bd()->query("SELECT * FROM espace_envois $ou ORDER BY cree_le $ordre LIMIT 300");
    $envois = array_map('envoi_depuis_ligne', $q->fetchAll());
    $comptes = [];
    $r = [];
    foreach ($envois as $e) {
        $comptes[$e['compte']] ??= lire_compte($e['compte']);
        if ($comptes[$e['compte']]) $r[] = $e + ['client' => client_pour_malik($comptes[$e['compte']])];
    }
    return $r;
}

/** Étiquette envoyée (ou Annuler), bon fait dans l'appli (ou retiré). */
function marquer_envoi(string $id, string $action, string $par, string $numero = ''): ?array
{
    $e = lire_envoi($id);
    if (!$e) return null;
    if ($action === 'traite') $e = ['traite_le' => iso(), 'traite_par' => coupe($par, 60)] + $e;
    elseif ($action === 'remettre') $e = ['traite_le' => null, 'traite_par' => ''] + $e;
    elseif ($action === 'bon') $e = ['bon_numero' => coupe($numero, 20), 'bon_le' => iso(), 'traite_le' => $e['traite_le'] ?? iso()] + $e;
    elseif ($action === 'sans_bon') $e = ['bon_numero' => null, 'bon_le' => null] + $e;
    else return null;
    bd()->prepare('UPDATE espace_envois SET traite_le = ?, traite_par = ?, bon_numero = ?, bon_le = ? WHERE id = ?')
        ->execute([$e['traite_le'], $e['traite_par'], $e['bon_numero'], $e['bon_le'], $id]);
    return $e;
}
