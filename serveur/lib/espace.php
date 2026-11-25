<?php
declare(strict_types=1);

require_once __DIR__ . '/base.php';
require_once __DIR__ . '/mail.php';
require_once __DIR__ . '/site.php';
require_once __DIR__ . '/notifications.php';








const COOKIE_ESPACE = 'espace';
const SESSION_JOURS = 60;



const CODE_MINUTES = 10, CODE_ESSAIS = 5, CODES_PAR_QUART = 3, CODES_PAR_JOUR = 8, CODES_JOUR_TOTAL = 20, CODES_JOUR_NOUVEAUX = 10;







const CODES_ADRESSES_PAR_APPAREIL = 3;




const CREATION_MINUTES = 60;
const CODE_CHIFFRES_GESTION = 8;







const GESTION_JOUR_TOTAL = 2000;


const COOKIE_LIEN = 'espace_lien', LIEN_COOKIE_MINUTES = 30;


const MAILS_COMPTES_PAR_JOUR = 12;


const PHOTO_MAX = (int) (2.5 * 1024 * 1024), COLIS_MAX = 5, KG_PAR_COLIS = 20, ENVOIS_PAR_JOUR = 3;
const LANGUES = ['fr', 'de', 'en', 'it', 'es'];
const MATIERES = ['Plaquettes carbure', 'Forets / fraises carbure', 'Lot mélangé (plaquettes, forets, fraises)'];
const TYPES_PIECE = ["Carte d'identité", 'Passeport', 'Titre de séjour', 'Permis de conduire'];
const PREVENIR = ['email', 'whatsapp', 'les-deux'];






const CGV_VERSION = '2026-11-18';




const CGA_VERSION = '2026-11-18';
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


function chiffres_code(string $espace): int
{
    return $espace === 'gestion' ? CODE_CHIFFRES_GESTION : 6;
}



function compteurs_lus(PDO $bd, array $noms, string $jour): array
{
    $r = [];
    foreach ($noms as $nom) {
        $q = $bd->prepare('SELECT jour, n FROM espace_compteurs WHERE nom = ?' . pour_maj());
        $q->execute([$nom]);
        $t = $q->fetch();
        $r[$nom] = [(bool) $t, $t && $t['jour'] === $jour ? (int) $t['n'] : 0];
    }
    return $r;
}


function compteurs_plus(PDO $bd, array $lus, string $jour): void
{
    foreach ($lus as $nom => [$existe, $n]) {
        if ($existe) $bd->prepare('UPDATE espace_compteurs SET jour = ?, n = ? WHERE nom = ?')->execute([$jour, $n + 1, $nom]);
        else $bd->prepare('INSERT INTO espace_compteurs (jour, n, nom) VALUES (?, ?, ?)')->execute([$jour, $n + 1, $nom]);
    }
}




function transaction_sure(callable $f)
{
    try {
        return transaction($f);
    } catch (PDOException $e) {
        if (!in_array((string) $e->getCode(), ['40001', '23000'], true)) throw $e;
        usleep(random_int(5000, 30000));
        return transaction($f);
    }
}






function envoyer_code(string $email, string $langue, string $espace = 'espace', ?array $creation = null): string
{
    if ($espace !== 'espace') throw new InvalidArgumentException('code de la page de gestion : envoyer_code_gestion');
    $maintenant = ms();
    $jour = aujourdhui();
    $cle = cle_code($espace, $email);
    $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $h = signer("code|espace|$email|$code");



    $cr = $creation ? json_encode($creation + ['le' => $maintenant, 'h' => $h, 'nav' => navigateur_lien()], JSON_UNESCAPED_UNICODE) : null;

    $appareil = 'coden:' . empreinte_ip();
    $ici = 'codea:' . substr(hash_hmac('sha256', 'code-appareil|' . empreinte_ip() . '|' . $email, cle_binaire('secret')), 0, 24);
    $r = transaction_sure(function (PDO $bd) use ($maintenant, $jour, $cle, $email, $h, $cr, $appareil, $ici) {
        $q = $bd->prepare('SELECT envois FROM espace_codes WHERE cle = ?' . pour_maj());
        $q->execute([$cle]);
        $l = $q->fetch();
        $envois = array_values(array_filter((array) json_decode($l['envois'] ?? '[]', true), fn ($t) => is_int($t) && $maintenant - $t < 86400000));
        $quart = count(array_filter($envois, fn ($t) => $maintenant - $t < 900000));
        if ($quart >= CODES_PAR_QUART) return 'trop';
        if (count($envois) >= CODES_PAR_JOUR) return 'trop_jour';



        $q = $bd->prepare('SELECT 1 FROM espace_comptes WHERE email = ? AND archive_le IS NULL');
        $q->execute([$email]);
        $inscrit = (bool) $q->fetchColumn();
        $lus = compteurs_lus($bd, [$ici, $appareil, 'codes', 'codes-nouveaux'], $jour);
        $neuveIci = $lus[$ici][1] === 0;
        if ($neuveIci && $lus[$appareil][1] >= CODES_ADRESSES_PAR_APPAREIL) return 'trop_jour';
        if ($lus['codes'][1] >= CODES_JOUR_TOTAL) return 'plafond';
        if (!$inscrit && $lus['codes-nouveaux'][1] >= CODES_JOUR_NOUVEAUX) return 'plafond-nouveaux';


        if (!$neuveIci) unset($lus[$appareil]);
        if ($inscrit) unset($lus['codes-nouveaux']);
        $envois[] = $maintenant;



        $valeurs = [$h, $maintenant + CODE_MINUTES * 60000, json_encode($envois), $cr, $cle];
        if ($l) $bd->prepare('UPDATE espace_codes SET h = ?, exp = ?, essais = 0, envois = ?, creation = COALESCE(?, creation) WHERE cle = ?')->execute($valeurs);
        else $bd->prepare('INSERT INTO espace_codes (h, exp, essais, envois, creation, cle) VALUES (?, ?, 0, ?, ?, ?)')->execute($valeurs);
        compteurs_plus($bd, $lus, $jour);
        return 'ok';
    });
    if ($r === 'plafond') {
        alerter_malik('plafond-codes', 'Codes de connexion : plafond du jour atteint', 'Plus de code de connexion par e-mail jusqu\'à demain : beaucoup de demandes aujourd\'hui, peut-être un robot. Les vendeurs déjà connectés le restent, et Google marche encore.');
        return 'trop_jour';
    }
    if ($r === 'plafond-nouveaux') {
        alerter_malik('plafond-codes-nouveaux', 'Nouveaux comptes : plafond du jour atteint', 'Plus de code pour une adresse sans compte jusqu\'à demain : beaucoup de demandes aujourd\'hui, peut-être un robot. Les vendeurs déjà inscrits reçoivent encore leur code.');
        return 'trop_jour';
    }
    if ($r !== 'ok') return $r;
    mail_code($email, $code, $langue, 'espace', creer_lien($email));
    return 'ok';
}










function empreinte_gestion(string $email): string
{
    return substr(hash_hmac('sha256', 'gestion|' . $email, cle_binaire('secret')), 0, 24);
}


function cle_code_gestion(string $email): string
{
    return hash_hmac('sha256', 'code-gestion|' . $email, cle_binaire('secret'));
}



function cle_leurre_gestion(): string
{
    return hash_hmac('sha256', 'code-gestion-leurre', cle_binaire('secret'));
}


function alerte_plafond_gestion(): void
{
    apres_reponse(fn () => alerter_malik('plafond-codes-gestion', 'Gestion : plafond du jour atteint',
        'Plus de connexion par code à ta page de gestion jusqu\'à demain : beaucoup de demandes ou de codes faux aujourd\'hui, peut-être un robot. La connexion avec Google marche encore.'));
}




function envoyer_code_gestion(string $email, bool $admin): string
{
    $maintenant = ms();
    $jour = aujourdhui();
    $fp = empreinte_gestion($email);
    $quart = 'gq:' . $fp . ':' . intdiv($maintenant, 900000);
    $code = str_pad((string) random_int(0, 10 ** CODE_CHIFFRES_GESTION - 1), CODE_CHIFFRES_GESTION, '0', STR_PAD_LEFT);
    $h = signer("code|gestion|$email|$code");
    $cle = cle_code_gestion($email);
    $r = transaction_sure(function (PDO $bd) use ($jour, $fp, $quart, $h, $cle, $maintenant, $admin) {
        $lus = compteurs_lus($bd, [$quart, "gj:$fp", 'codes-gestion'], $jour);
        if ($lus[$quart][1] >= CODES_PAR_QUART) return 'trop';
        if ($lus["gj:$fp"][1] >= CODES_PAR_JOUR) return 'trop_jour';
        if ($lus['codes-gestion'][1] >= GESTION_JOUR_TOTAL) return 'plafond';
        compteurs_plus($bd, $lus, $jour);



        $bd->prepare("REPLACE INTO espace_codes (cle, h, exp, essais, envois, creation) VALUES (?, ?, ?, 0, '[]', NULL)")
            ->execute([$admin ? $cle : cle_leurre_gestion(), $h, $maintenant + CODE_MINUTES * 60000]);
        return 'ok';
    });
    if ($r === 'plafond') {
        alerte_plafond_gestion();
        return 'trop_jour';
    }

    if ($r === 'ok' && $admin) apres_reponse(fn () => mail_code($email, $code, 'fr', 'gestion'));
    return $r;
}







function verifier_code_gestion(string $email, string $code, bool $admin): array
{
    $jour = aujourdhui();
    $fp = empreinte_gestion($email);
    $cle = cle_code_gestion($email);
    $attendu = signer("code|gestion|$email|$code");
    $forme = preg_match('/^\d{' . CODE_CHIFFRES_GESTION . '}$/', $code) === 1;
    $r = transaction_sure(function (PDO $bd) use ($jour, $fp, $cle, $attendu, $forme, $admin) {
        $lus = compteurs_lus($bd, ["ge:$fp", 'codes-gestion'], $jour);
        $echecs = $lus["ge:$fp"][1];
        if ($lus['codes-gestion'][1] >= GESTION_JOUR_TOTAL) return ['plafond', $echecs];
        $q = $bd->prepare('SELECT h, exp FROM espace_codes WHERE cle = ?' . pour_maj());
        $q->execute([$cle]);
        $l = $q->fetch();
        $egal = hash_equals((string) ($l['h'] ?? ''), $attendu);
        if ($egal && $forme && $admin && $echecs < CODE_ESSAIS && ms() <= (int) $l['exp']) {
            $bd->prepare("UPDATE espace_codes SET h = '' WHERE cle = ?")->execute([$cle]);
            return ['ok', $echecs];
        }
        compteurs_plus($bd, $lus, $jour);
        return [$echecs + 1 >= CODE_ESSAIS ? 'bloque' : 'code_faux', $echecs + 1];
    });
    if ($r[0] === 'plafond') {
        alerte_plafond_gestion();
        return ['trop_jour', $r[1]];
    }
    return $r;
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










function prendre_creation(string $email, ?string $code = null): ?array
{
    $cle = cle_code('espace', $email);
    $q = bd()->prepare('SELECT creation, exp FROM espace_codes WHERE cle = ?');
    $q->execute([$cle]);
    $l = $q->fetch();
    if (!$l || !$l['creation']) return null;
    $oublier = fn () => bd()->prepare('UPDATE espace_codes SET creation = NULL WHERE cle = ?')->execute([$cle]);
    $cr = json_decode((string) $l['creation'], true);
    if (!is_array($cr)) {
        $oublier();
        return null;
    }

    $tape = $cr['le'] ?? null;
    if ($tape === null ? ms() > (int) $l['exp'] : (!is_int($tape) || ms() - $tape > CREATION_MINUTES * 60000)) {
        $oublier();
        return null;
    }


    $nav = navigateur_lien(false);
    $sienne = !isset($cr['h'])
        || ($code !== null && is_string($cr['h']) && hash_equals($cr['h'], signer("code|espace|$email|$code")))
        || ($nav !== '' && is_string($cr['nav'] ?? null) && hash_equals($cr['nav'], $nav));
    if (!$sienne) return null;
    $oublier();
    unset($cr['le'], $cr['h'], $cr['nav']);
    return $cr;
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


function empreinte_lien(string $email): string
{
    return substr(b64url(hash_hmac('sha256', 'lien-appareil|' . $email, cle_binaire('secret'), true)), 0, 22);
}



function navigateur_lien(bool $creer = true): string
{
    static $neuf = null;
    $s = lire_cookie_signe(COOKIE_LIEN, 'lien');
    if (is_string($s['n'] ?? null) && preg_match('/^[0-9a-f]{32}$/', $s['n'])) return $s['n'];
    if (!$creer) return $neuf ?? '';
    return $neuf ??= bin2hex(random_bytes(16));
}




function cookie_lien(string $email): string
{
    $s = lire_cookie_signe(COOKIE_LIEN, 'lien');
    $avant = is_array($s['a'] ?? null) ? array_values(array_filter($s['a'], 'is_string')) : [];
    $liste = array_slice(array_values(array_unique([empreinte_lien($email), ...$avant])), 0, 3);
    $charge = b64url((string) json_encode(['a' => $liste, 'n' => navigateur_lien(), 'exp' => ms() + LIEN_COOKIE_MINUTES * 60000]));
    return COOKIE_LIEN . "=$charge." . signer('lien|' . $charge) . '; Path=/api/espace/; HttpOnly; ' . (https() || !mode_essai() ? 'Secure; ' : '')
        . 'SameSite=Lax; Max-Age=' . (LIEN_COOKIE_MINUTES * 60);
}






function utiliser_lien(string $jeton): array
{
    if (!preg_match('/^[0-9a-f]{32}$/', $jeton)) return ['erreur' => 'lien_expire'];
    $appareil = lire_cookie_signe(COOKIE_LIEN, 'lien');
    $empreintes = is_array($appareil['a'] ?? null) ? $appareil['a'] : [];
    if (!$empreintes) return ['erreur' => 'lien_appareil'];
    $h = hash('sha256', $jeton);
    return transaction(function (PDO $bd) use ($h, $empreintes) {
        $q = $bd->prepare('SELECT email, exp FROM espace_liens WHERE h = ?' . pour_maj());
        $q->execute([$h]);
        $l = $q->fetch();
        if (!$l) return ['erreur' => 'lien_expire'];
        $email = dechiffrer((string) $l['email']);
        if (!$email || ms() > (int) $l['exp']) {
            $bd->prepare('DELETE FROM espace_liens WHERE h = ?')->execute([$h]);
            return ['erreur' => 'lien_expire'];
        }
        if (!in_array(empreinte_lien($email), $empreintes, true)) return ['erreur' => 'lien_appareil'];
        $bd->prepare('DELETE FROM espace_liens WHERE h = ?')->execute([$h]);
        return ['email' => $email];
    });
}




function fermer_connexions_en_attente(string $email): void
{


    bd()->prepare("UPDATE espace_codes SET h = '', essais = 0 WHERE cle = ?")->execute([cle_code('espace', $email)]);
    $q = bd()->prepare('SELECT h, email FROM espace_liens WHERE exp >= ?');
    $q->execute([ms()]);
    foreach ($q->fetchAll() as $l) {
        if (dechiffrer((string) $l['email']) === $email) bd()->prepare('DELETE FROM espace_liens WHERE h = ?')->execute([$l['h']]);
    }
}



function verifier_code(string $email, string $code, string $espace = 'espace'): string
{
    if ($espace !== 'espace') throw new InvalidArgumentException('code de la page de gestion : verifier_code_gestion');
    $cle = cle_code($espace, $email);
    return transaction(function (PDO $bd) use ($cle, $email, $code, $espace) {
        $q = $bd->prepare('SELECT h, exp, essais FROM espace_codes WHERE cle = ?' . pour_maj());
        $q->execute([$cle]);
        $l = $q->fetch();
        if (!$l || $l['h'] === '' || ms() > (int) $l['exp']) return 'code_expire';
        if ((int) $l['essais'] >= CODE_ESSAIS) return 'bloque';
        if (!preg_match('/^\d{' . chiffres_code($espace) . '}$/', $code) || !hash_equals((string) $l['h'], signer("code|$espace|$email|$code"))) {
            $essais = (int) $l['essais'] + 1;
            $bd->prepare('UPDATE espace_codes SET essais = ? WHERE cle = ?')->execute([$essais, $cle]);
            return $essais >= CODE_ESSAIS ? 'bloque' : 'code_faux';
        }
        $bd->prepare("UPDATE espace_codes SET h = '', essais = 0 WHERE cle = ?")->execute([$cle]);
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
        'rib_maj_le' => ($l['rib_maj_le'] ?? null) ?: null,

        'test_le' => ($l['test_le'] ?? null) ?: null,

        'sessions_depuis' => isset($l['sessions_depuis']) ? (int) $l['sessions_depuis'] : null];
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

    $charge = b64url((string) json_encode(['id' => $id, 'exp' => ms() + SESSION_JOURS * 86400000, 'emis' => ms()]));
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
    if (!$c || $c['archive_le']) return null;


    $emis = is_int($s['emis'] ?? null) ? $s['emis'] : (int) $s['exp'] - SESSION_JOURS * 86400000;
    return $c['sessions_depuis'] !== null && $emis < $c['sessions_depuis'] ? null : $c;
}



function couper_sessions(string $id): void
{
    bd()->prepare('UPDATE espace_comptes SET sessions_depuis = ? WHERE id = ?')->execute([ms(), $id]);
}








function mail_compte_permis(array $c): bool
{
    try {
        if (est_test($c) || sous_la_limite('mails-comptes', MAILS_COMPTES_PAR_JOUR)) return true;
        alerter_malik('plafond-mon-compte', 'Mon compte : plafond d\'e-mails atteint',
            'Les nouvelles demandes et les numéros de suivi des vendeurs sont gardés dans ta page de gestion, sans e-mail, jusqu\'à demain.');
    } catch (Throwable $e) {
        journaliser('e-mails de Mon compte : compteur en panne, pas d\'e-mail (' . resume_erreur($e) . ')');
    }
    return false;
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
        'test' => est_test($c),
    ];
}



function est_test(array $c): bool
{
    return !empty($c['test_le']);
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






const PIECES_PLACE_MAX = 400 * 1024 * 1024, HEBERGEMENT_OCTETS = 1024 * 1024 * 1024, PLACE_MINUTES = 10;

function fichier_place_pieces(): string
{
    return prive() . '/place-pieces.json';
}


function place_pieces(): int
{
    $c = json_decode((string) @file_get_contents(fichier_place_pieces()), true);
    $age = is_array($c) && is_int($c['le'] ?? null) ? ms() - $c['le'] : -1;
    if (is_int($c['octets'] ?? null) && $age >= 0 && $age < PLACE_MINUTES * 60000) return $c['octets'];
    $total = 0;
    foreach (glob(prive() . '/pieces/*', GLOB_ONLYDIR) ?: [] as $d) {
        foreach (glob($d . '/*') ?: [] as $f) $total += (int) @filesize($f);
    }
    @file_put_contents(fichier_place_pieces(), json_encode(['octets' => $total, 'le' => ms()]), LOCK_EX);
    return $total;
}



function place_pour_pieces(int $octets): bool
{
    if ($octets <= 0 || place_pieces() + $octets <= PIECES_PLACE_MAX) return true;
    alerter_malik('place-pieces', 'Pièces d\'identité : plus de place',
        'Les vendeurs ne peuvent plus déposer de pièce d\'identité : leur place sur ton hébergement (400 Mo) est pleine. Rien n\'a été effacé. Regarde la place prise dans ta page de gestion.');
    return false;
}


function place_pieces_ajouter(int $octets): void
{
    $c = json_decode((string) @file_get_contents(fichier_place_pieces()), true);
    if (!is_array($c) || !is_int($c['octets'] ?? null) || !is_int($c['le'] ?? null)) return;
    @file_put_contents(fichier_place_pieces(), json_encode(['octets' => $c['octets'] + $octets, 'le' => $c['le']]), LOCK_EX);
}






function place_pour_malik(): ?array
{
    try {
        $pieces = place_pieces();
        $messages = place_photos_messages();
        $textes = place_textes_messages();
        return ['pieces' => $pieces, 'pieces_max' => PIECES_PLACE_MAX, 'messages' => $messages,
            'messages_max' => defined('CONTACT_PLACE_PHOTOS') ? CONTACT_PLACE_PHOTOS : null,
            'total' => $pieces + $messages, 'hebergement' => HEBERGEMENT_OCTETS,
            'textes' => $textes, 'textes_max' => CONTACT_PLACE_TEXTES, 'sauvegarde' => $pieces + $textes];
    } catch (Throwable $e) {
        journaliser('place sur le disque : ' . resume_erreur($e));
        return null;
    }
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







function conditions_gardees(array $c): string
{
    $pro = ($c['profil'] ?? '') === 'professionnel';
    $v = $pro ? CGA_VERSION : CGV_VERSION;
    $court = ($pro ? 'cga-' : 'cgv-') . substr($v, 2, 2) . substr($v, 5, 2) . substr($v, 8);
    return preg_match('/^\d{4}-\d{2}-\d{2}(-\d+)?$/', $v) && strlen($court) <= 12 ? $court : $v;
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
        'avis' => avis_de_ligne($l),

        'transport' => ($l['transport'] ?? '') === 'vendeur' ? 'vendeur' : 'offert',
        'suivis' => array_values(array_filter((array) json_decode((string) ($l['suivis'] ?? ''), true), 'is_string')),

        'connu' => lire_connu($l['connu'] ?? null),
    ];
}




const AVIS_PLUS = ['paiement', 'prix', 'pesee', 'reponse', 'simple'];
const AVIS_TEXTE_MAX = 600, AVIS_PAR_JOUR = 12;


function avis_de_ligne(array $l): ?array
{
    $note = (int) ($l['avis_note'] ?? 0);
    if ($note < 1 || $note > 5) return null;
    return ['note' => $note, 'plus' => array_values(array_intersect(AVIS_PLUS, explode(',', (string) ($l['avis_plus'] ?? '')))),
        'texte' => (string) ($l['avis_texte'] ?? ''), 'public' => !empty($l['avis_public']), 'le' => ($l['avis_le'] ?? null) ?: null,

        'affiche_le' => !empty($l['avis_public']) ? (($l['avis_affiche_le'] ?? null) ?: null) : null];
}



function lire_avis(array $b): ?array
{
    $note = $b['note'] ?? null;
    if (!is_int($note) || $note < 1 || $note > 5) return null;
    $plus = is_array($b['plus'] ?? null) ? array_values(array_intersect(AVIS_PLUS, array_filter($b['plus'], 'is_string'))) : [];
    $texte = is_string($b['texte'] ?? null) ? coupe(trim((string) preg_replace('/\s+/u', ' ', $b['texte'])), AVIS_TEXTE_MAX) : '';
    return ['note' => $note, 'plus' => $plus, 'texte' => $texte, 'public' => ($b['public'] ?? false) === true];
}


function avis_possible(array $c, array $e): bool
{
    return !empty($e['paye_le']) || est_test($c);
}



function noter_avis(array $e, ?array $a): ?array
{
    bd()->prepare('UPDATE espace_envois SET avis_note = ?, avis_plus = ?, avis_texte = ?, avis_public = ?, avis_le = ?, avis_affiche_le = NULL WHERE id = ?')
        ->execute($a ? [$a['note'], implode(',', $a['plus']), $a['texte'], $a['public'] ? 1 : 0, iso(), $e['id']] : [null, null, null, null, null, $e['id']]);
    return lire_envoi($e['id']);
}


const SUIVIS_PAR_JOUR = 20;


function lire_suivis($x, int $max): ?array
{
    if (!is_array($x)) return null;
    $r = [];
    foreach ($x as $s) {
        if (!is_string($s)) return null;
        $s = strtoupper(trim((string) preg_replace('/\s+/', ' ', $s)));
        if ($s === '') continue;
        if (!preg_match('/^[A-Z0-9][A-Z0-9 \-]{4,38}[A-Z0-9]$/', $s)) return null;
        $r[] = $s;
    }
    $r = array_values(array_unique($r));
    return count($r) > $max ? null : $r;
}

function noter_suivis(array $e, array $suivis): ?array
{
    bd()->prepare('UPDATE espace_envois SET suivis = ? WHERE id = ?')->execute([$suivis ? json_encode($suivis) : null, $e['id']]);
    return lire_envoi($e['id']);
}



const AVIS_AFFICHES = 12;


function prenom_public(array $c): string
{
    $mots = preg_split('/\s+/u', trim((string) $c['prenom']), -1, PREG_SPLIT_NO_EMPTY) ?: [];
    $p = mb_substr((string) ($mots[0] ?? ''), 0, 24);
    if ($p === '' || !preg_match('/^[\p{L}\'’-]+$/u', $p)) return '';
    foreach ([$c['nom'] ?? '', $c['entreprise'] ?? ''] as $interdit) if (mb_strtolower(trim((string) $interdit)) === mb_strtolower($p)) return '';
    return mb_convert_case(mb_strtolower($p), MB_CASE_TITLE, 'UTF-8');
}






function masquer_noms(string $texte, array $c): string
{
    $t = (string) preg_replace('/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/u', '…', $texte);
    $t = (string) preg_replace('~(?:https?://|www\.)\S+~iu', '…', $t);
    $t = (string) preg_replace('/(?<!\d)\+?\d[\d .\-]{7,}\d(?!\d)/u', '…', $t);
    $cibles = [$c['entreprise'] ?? '', $c['nom'] ?? '', $c['ville'] ?? '', $c['cp'] ?? ''];
    $parties = preg_split('/[\s\'’-]+/u', trim((string) ($c['nom'] ?? '')), -1, PREG_SPLIT_NO_EMPTY) ?: [];
    if (count($parties) > 1) foreach ($parties as $p) if (mb_strlen(lettres_collees($p)[0]) >= 4) $cibles[] = $p;
    $car = mb_str_split($t);
    [$colle, $place] = lettres_collees($t);
    $alnum = fn (int $i): bool => isset($car[$i]) && preg_match('/^[\p{L}\p{N}]$/u', $car[$i]) === 1;
    $caches = [];
    foreach ($cibles as $cible) {
        $mot = lettres_collees((string) $cible)[0];
        if (mb_strlen($mot) < 2) continue;
        for ($o = strpos($colle, $mot); $o !== false; $o = strpos($colle, $mot, $o + 1)) {
            $fin = $o + strlen($mot) - 1;
            [$de, $a] = [$place[$o], $place[$fin]];

            if (($o > 0 && $place[$o - 1] === $de) || ($fin + 1 < strlen($colle) && $place[$fin + 1] === $a)) continue;
            if ($alnum($de - 1) || $alnum($a + 1)) continue;
            $caches[] = [$de, $a];
        }
    }
    if ($caches) {
        $garde = [];
        foreach ($caches as [$de, $a]) for ($i = $de; $i <= $a; $i++) $garde[$i] = $de;
        $s = '';
        foreach ($car as $i => $ch) {
            if (!isset($garde[$i])) $s .= $ch;
            elseif ($i === 0 || !isset($garde[$i - 1])) $s .= '…';
        }
        $t = $s;
    }
    return trim((string) preg_replace('/\s+/u', ' ', $t));
}



function lettres_collees(string $s): array
{
    $colle = '';
    $place = [];
    foreach (mb_str_split($s) as $i => $ch) {
        $n = sans_accents($ch);
        if ($n === '' || !preg_match('/^[\p{L}\p{N}]+$/u', $n)) continue;
        $colle .= $n;
        for ($k = strlen($n); $k > 0; $k--) $place[] = $i;
    }
    return [$colle, $place];
}


function sans_accents(string $s): string
{
    $s = mb_strtolower($s, 'UTF-8');
    if (class_exists('Normalizer')) $s = (string) Normalizer::normalize($s, Normalizer::FORM_D);
    $s = (string) preg_replace('/\p{Mn}+/u', '', $s);
    return strtr($s, ['à' => 'a', 'á' => 'a', 'â' => 'a', 'ã' => 'a', 'ä' => 'a', 'å' => 'a', 'ā' => 'a', 'ă' => 'a', 'ą' => 'a',
        'ç' => 'c', 'ć' => 'c', 'č' => 'c', 'ď' => 'd', 'đ' => 'd', 'ð' => 'd', 'è' => 'e', 'é' => 'e', 'ê' => 'e', 'ë' => 'e', 'ē' => 'e',
        'ę' => 'e', 'ě' => 'e', 'ğ' => 'g', 'ì' => 'i', 'í' => 'i', 'î' => 'i', 'ï' => 'i', 'ī' => 'i', 'ı' => 'i', 'ľ' => 'l', 'ł' => 'l',
        'ñ' => 'n', 'ń' => 'n', 'ň' => 'n', 'ò' => 'o', 'ó' => 'o', 'ô' => 'o', 'õ' => 'o', 'ö' => 'o', 'ø' => 'o', 'ō' => 'o', 'ő' => 'o',
        'ŕ' => 'r', 'ř' => 'r', 'ś' => 's', 'š' => 's', 'ş' => 's', 'ș' => 's', 'ť' => 't', 'ţ' => 't', 'ț' => 't', 'ù' => 'u', 'ú' => 'u',
        'û' => 'u', 'ü' => 'u', 'ū' => 'u', 'ů' => 'u', 'ű' => 'u', 'ý' => 'y', 'ÿ' => 'y', 'ź' => 'z', 'ż' => 'z', 'ž' => 'z',
        'ß' => 'ss', 'æ' => 'ae', 'œ' => 'oe', 'þ' => 'th']);
}



function avis_affichable(array $c, array $e): bool
{
    $a = $e['avis'] ?? null;
    return $a && $a['public'] && $a['affiche_le'] && !est_test($c) && empty($c['archive_le']);
}



function avis_public(array $c, array $e): array
{
    $a = $e['avis'];
    return ['prenom' => prenom_public($c), 'note' => $a['note'], 'plus' => $a['plus'],
        'texte' => masquer_noms($a['texte'], $c), 'mois' => substr((string) $a['le'], 0, 7)];
}



function avis_publics(): array
{
    $q = bd()->query('SELECT * FROM espace_envois WHERE avis_note IS NOT NULL ORDER BY avis_le DESC LIMIT 500');
    $comptes = [];
    $n = $somme = 0;
    $liste = [];
    foreach (array_map('envoi_depuis_ligne', $q->fetchAll()) as $e) {
        $comptes[$e['compte']] ??= lire_compte($e['compte']);
        $c = $comptes[$e['compte']];
        if (!$c || est_test($c) || !$e['avis']) continue;
        $n++;
        $somme += $e['avis']['note'];
        if (count($liste) < AVIS_AFFICHES && avis_affichable($c, $e)) $liste[] = avis_public($c, $e);
    }
    return ['n' => $n, 'moyenne' => $n ? round($somme / $n, 1) : null, 'avis' => $liste];
}


function afficher_avis(string $id, bool $oui): ?array
{
    $e = lire_envoi($id);
    if (!$e || !$e['avis'] || ($oui && !$e['avis']['public'])) return null;
    bd()->prepare('UPDATE espace_envois SET avis_affiche_le = ? WHERE id = ?')->execute([$oui ? iso() : null, $id]);
    return lire_envoi($id);
}



function avis_pour_malik(): array
{
    $q = bd()->query('SELECT * FROM espace_envois WHERE avis_note IS NOT NULL ORDER BY avis_le DESC LIMIT 300');
    $comptes = [];
    $r = ['n' => 0, 'moyenne' => null, 'derniers' => []];
    $somme = 0;
    foreach (array_map('envoi_depuis_ligne', $q->fetchAll()) as $e) {
        $comptes[$e['compte']] ??= lire_compte($e['compte']);
        $c = $comptes[$e['compte']];
        if (!$c || est_test($c) || !$e['avis']) continue;
        $r['n']++;
        $somme += $e['avis']['note'];
        if (count($r['derniers']) < 6) {

            $r['derniers'][] = $e['avis'] + ['envoi' => $e['id'], 'reference' => $e['reference'], 'prenom' => $c['prenom'], 'nom' => $c['nom'], 'ville' => $c['ville'],
                'apercu' => avis_public($c, $e)];
        }
    }
    if ($r['n']) $r['moyenne'] = round($somme / $r['n'], 1);
    return $r;
}


function colis_tarde(array $e): bool
{
    if (!$e['traite_le'] || ($e['recu_le'] ?? null) || ($e['pese_le'] ?? null) || ($e['paye_le'] ?? null) || $e['bon_numero']) return false;
    return heures_ouvrees((int) (strtotime((string) $e['traite_le']) * 1000)) >= JOURS_COLIS_ATTENDU * 24;
}




function colis_en_retard(array $e): bool
{
    return ($e['transport'] ?? 'offert') !== 'vendeur' && colis_tarde($e);
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
        'paiement' => $e['paiement'], 'message' => $e['message'] ?? '', 'traite_le' => $e['traite_le'], 'prix_kg' => $e['prix_kg'] ?? null, 'garanti_jusqu' => $e['garanti_jusqu'] ?? null,
        'recu_le' => $e['recu_le'] ?? null, 'pese_le' => $e['pese_le'] ?? null, 'poids_brut' => $e['poids_brut'] ?? null,
        'poids_net' => $e['poids_net'] ?? null, 'paye_le' => $e['paye_le'] ?? null, 'montant' => $e['montant'] ?? null,
        'bon_numero' => $e['bon_numero'] ?? null, 'bon_redemande_le' => $e['bon_redemande_le'] ?? null,
        'accord_le' => $e['accord_le'] ?? null, 'depot_reponse' => $e['depot_reponse'] ?? null, 'depot_question' => question_depot($e),
        'avis' => $e['avis'] ?? null, 'transport' => $e['transport'] ?? 'offert', 'suivis' => $e['suivis'] ?? [],


        'tarde' => ($e['transport'] ?? 'offert') === 'vendeur' && colis_tarde($e)];
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
            bd()->prepare('INSERT INTO espace_envois (id, reference, compte, cree_le, colis, total, paiement, message, traite_le, traite_par, prix_kg, garanti_jusqu, cgv_version, cgv_le, transport, connu)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
                ->execute([$e['id'], $e['reference'], $e['compte'], $e['cree_le'], json_encode($e['colis'], JSON_UNESCAPED_UNICODE),
                    $e['total'], $e['paiement'], $e['message'], $e['traite_le'] ?? null, $e['traite_par'] ?? '', $e['prix_kg'] ?? null, $e['garanti_jusqu'] ?? null,
                    $e['cgv_version'] ?? null, $e['cgv_le'] ?? null, ($e['transport'] ?? '') === 'vendeur' ? 'vendeur' : null, lire_connu($e['connu'] ?? null)]);
            return;
        } catch (PDOException $x) {

            if ($essai >= 3) throw $x;
            $e['reference'] = reference_envoi();
        }
    }
}


function lire_colis($brut): ?array
{
    $brut = is_array($brut) ? array_slice(array_values($brut), 0, COLIS_MAX + 1) : [];
    $colis = array_map(fn ($x) => [
        'matiere' => is_array($x) && in_array($x['matiere'] ?? null, MATIERES, true) ? $x['matiere'] : '',
        'poids' => is_array($x) && is_numeric($x['poids'] ?? null) ? round((float) $x['poids'] * 10) / 10 : 0.0,
    ], $brut);
    if (!$colis || count($colis) > COLIS_MAX) return null;
    foreach ($colis as $x) if ($x['matiere'] === '' || !($x['poids'] > 0) || $x['poids'] > KG_PAR_COLIS) return null;
    return $colis;
}



function modifier_envoi(array $e, array $colis, string $paiement, string $message): ?array
{
    bd()->prepare('UPDATE espace_envois SET colis = ?, total = ?, paiement = ?, message = ? WHERE id = ?')
        ->execute([json_encode($colis, JSON_UNESCAPED_UNICODE), round(array_sum(array_column($colis, 'poids')) * 10) / 10,
            $paiement, $message, $e['id']]);
    return lire_envoi($e['id']);
}


function supprimer_envoi(array $e): void
{
    transaction(function (PDO $bd) use ($e) {
        $bd->prepare('DELETE FROM site_mails WHERE envoi = ?')->execute([$e['id']]);
        $bd->prepare('DELETE FROM espace_envois WHERE id = ?')->execute([$e['id']]);
    });
}


function envoi_vendu(array $e): bool
{
    return !empty($e['recu_le']) || !empty($e['pese_le']) || !empty($e['paye_le']) || !empty($e['bon_numero']);
}




function envoi_en_route(array $e): bool
{
    if (envoi_vendu($e)) return false;
    return ($e['transport'] ?? 'offert') === 'vendeur' ? !empty($e['suivis']) : !empty($e['traite_le']);
}


function envoi_garde(array $e): bool
{
    return envoi_vendu($e) || envoi_en_route($e);
}


function a_vendu(array $c): bool
{
    foreach (envois_du($c['id']) as $e) if (envoi_garde($e)) return true;
    return false;
}




function archiver_compte(array $c): void
{
    transaction(function (PDO $bd) use ($c) {
        $bd->prepare("UPDATE espace_comptes SET email = ?, telephone = '', rib_titulaire = NULL, rib_iban = NULL, prevenir = NULL, archive_le = ? WHERE id = ?")
            ->execute(['supprime+' . $c['id'] . '@compte.invalid', iso(), $c['id']]);
        $bd->prepare('DELETE FROM espace_codes WHERE cle = ?')->execute([cle_code('espace', $c['email'])]);


        $q = $bd->prepare('SELECT * FROM espace_envois WHERE compte = ?' . pour_maj());
        $q->execute([$c['id']]);
        foreach (array_map('envoi_depuis_ligne', $q->fetchAll()) as $e) {
            if (envoi_garde($e)) continue;
            $bd->prepare('DELETE FROM site_mails WHERE envoi = ?')->execute([$e['id']]);
            $bd->prepare('DELETE FROM espace_envois WHERE id = ?')->execute([$e['id']]);
        }

        $bd->prepare('UPDATE espace_envois SET avis_note = NULL, avis_plus = NULL, avis_texte = NULL, avis_public = NULL, avis_le = NULL, avis_affiche_le = NULL WHERE compte = ?')
            ->execute([$c['id']]);
    });
}


function effacer_compte(array $c): void
{
    transaction(function (PDO $bd) use ($c) {
        $bd->prepare('DELETE FROM site_mails WHERE envoi IN (SELECT id FROM espace_envois WHERE compte = ?)')->execute([$c['id']]);
        $bd->prepare('DELETE FROM espace_envois WHERE compte = ?')->execute([$c['id']]);
        $bd->prepare('DELETE FROM espace_codes WHERE cle = ?')->execute([cle_code('espace', $c['email'])]);
        $bd->prepare('DELETE FROM espace_comptes WHERE id = ?')->execute([$c['id']]);
    });
    effacer_dossier_photos($c['id']);
}



function supprimer_compte(array $c): void
{
    if (a_vendu($c)) { archiver_compte($c); return; }
    effacer_compte($c);
}




const ANS_APRES_VENTE = 5, ANS_SANS_VENTE = 3;


function derniere_date(array $l, array $colonnes): string
{
    $d = '';
    foreach ($colonnes as $k) if (is_string($l[$k] ?? null) && $l[$k] > $d) $d = $l[$k];
    return $d;
}




function compte_ferme_perime(array $c, array $envois): bool
{
    $limite_vente = iso(ms() - (int) (ANS_APRES_VENTE * 365.25 * 86400000));
    $limite_echange = iso(ms() - (int) (ANS_SANS_VENTE * 365.25 * 86400000));
    $vente = false;
    foreach ($envois as $l) {
        if (envoi_vendu(envoi_depuis_ligne($l))) {
            $vente = true;
            if (derniere_date($l, ['recu_le', 'pese_le', 'accord_le', 'paye_le', 'bon_le']) >= $limite_vente) return false;
        } elseif (derniere_date($l, ['cree_le', 'traite_le', 'depot_repondu_le', 'rappel_garantie', 'bon_redemande_le']) >= $limite_echange) {
            return false;
        }
    }
    return $vente || (string) $c['archive_le'] < $limite_echange;
}







function fermer_compte_inactif(array $c): void
{
    $q = bd()->prepare('SELECT * FROM espace_envois WHERE compte = ?');
    $q->execute([$c['id']]);
    $envois = $q->fetchAll();
    $vente = (bool) array_filter($envois, fn ($l) => envoi_vendu(envoi_depuis_ligne($l)));
    if (!$vente && compte_ferme_perime(['archive_le' => $c['vu_le']] + $c, $envois)) {
        effacer_compte($c);
        return;
    }
    supprimer_compte($c);
}



function purger_comptes_fermes(): int
{
    $n = 0;
    foreach (bd()->query('SELECT * FROM espace_comptes WHERE archive_le IS NOT NULL')->fetchAll() as $l) {
        $c = compte_depuis_ligne($l);
        $q = bd()->prepare('SELECT * FROM espace_envois WHERE compte = ?');
        $q->execute([$c['id']]);
        if (!compte_ferme_perime($c, $q->fetchAll())) continue;
        effacer_compte($c);
        $n++;
    }
    if ($n) journaliser("ménage : $n compte(s) fermé(s) effacé(s) pour de bon (durées de la politique de confidentialité)");
    return $n;
}



function retirer_versos_passeport(): void
{
    $fait = prive() . '/versos-passeport.ok';
    if (is_file($fait)) return;
    $q = bd()->query("SELECT id, piece_verso FROM espace_comptes WHERE piece_type = 'Passeport' AND piece_verso IS NOT NULL AND piece_verso <> ''");
    $n = 0;
    foreach ($q->fetchAll() as $l) {
        bd()->prepare('UPDATE espace_comptes SET piece_verso = NULL WHERE id = ?')->execute([$l['id']]);
        effacer_photo((string) $l['id'], (string) $l['piece_verso']);
        $n++;
    }
    journaliser("ménage (une seule fois) : $n verso(s) retiré(s) de comptes dont la pièce est un passeport");
    @file_put_contents($fait, gmdate('c'));
}




const DELAI_ETIQUETTE_H = 24, DELAI_PAIEMENT_H = 48, DELAI_REPONSE_H = 24;



function retards(): array
{
    $r = [];
    $h = fn (string $iso): float => heures_ouvrees((int) (strtotime($iso) * 1000));

    foreach (bd()->query('SELECT e.reference, e.cree_le, e.traite_le, e.accord_le FROM espace_envois e JOIN espace_comptes c ON c.id = e.compte
        WHERE e.paye_le IS NULL AND c.test_le IS NULL')->fetchAll() as $l) {
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
    if (nuit_a_paris()) return;
    $f = prive() . '/menage.jour';
    $jour = aujourdhui();
    if (@file_get_contents($f) === $jour) return;
    @file_put_contents($f, $jour, LOCK_EX);
    apres_reponse(function () {


        $partie = function (string $nom, callable $f): void {
            try {
                $f();
            } catch (Throwable $e) {
                journaliser("ménage du jour ($nom) : " . resume_erreur($e));
            }
        };
        $partie('comptes sans connexion depuis 3 ans', function () use ($partie) {
            $q = bd()->prepare('SELECT * FROM espace_comptes WHERE vu_le < ? AND archive_le IS NULL');
            $q->execute([iso(ms() - (int) (3 * 365.25 * 86400000))]);
            foreach ($q->fetchAll() as $l) $partie('un compte sans connexion', fn () => fermer_compte_inactif(compte_depuis_ligne($l)));
        });
        $partie('comptes fermés', 'purger_comptes_fermes');
        $partie('liens de connexion', fn () => bd()->prepare('DELETE FROM espace_liens WHERE exp < ?')->execute([ms()]));
        $partie('versos des passeports', 'retirer_versos_passeport');
        $partie('pièces qui expirent', 'rappeler_pieces');
        $partie('prix garantis', 'rappeler_garanties');
        $partie('codes de connexion', 'effacer_vieux_codes');
        $partie('pages vues inventées', 'retirer_visites_inventees');
        $partie('site', 'menage_site');
    });
}







function effacer_vieux_codes(): int
{
    $limite = ms() - 86400000;
    $q = bd()->prepare('DELETE FROM espace_codes WHERE exp > 0 AND exp < ?');
    $q->execute([$limite]);
    $n = $q->rowCount();
    $apres = '';
    do {
        $q = bd()->prepare('SELECT cle, envois FROM espace_codes WHERE exp = 0 AND cle > ? ORDER BY cle LIMIT 200');
        $q->execute([$apres]);
        $lignes = $q->fetchAll();
        $vieilles = [];
        foreach ($lignes as $l) {
            $apres = (string) $l['cle'];
            $envois = (array) json_decode((string) $l['envois'], true);
            if (!array_filter($envois, fn ($t) => is_int($t) && $t >= $limite)) $vieilles[] = $apres;
        }
        if ($vieilles) {
            $d = bd()->prepare('DELETE FROM espace_codes WHERE cle IN (' . implode(', ', array_fill(0, count($vieilles), '?')) . ')');
            $d->execute($vieilles);
            $n += $d->rowCount();
        }
    } while (count($lignes) === 200);
    return $n;
}



function mail_du_menage(string $quoi, callable $envoyer): bool
{
    try {
        $envoyer();
        return true;
    } catch (Throwable $e) {
        journaliser("e-mail « $quoi » pas parti : " . resume_erreur($e));
        return false;
    }
}



function client_pour_malik(array $c): array
{
    $p = $c['piece'];
    return [
        'id' => $c['id'], 'email' => $c['email'], 'profil' => $c['profil'], 'nom' => $c['nom'], 'prenom' => $c['prenom'],
        'entreprise' => $c['entreprise'], 'siret' => $c['siret'], 'telephone' => $c['telephone'], 'adresse' => $c['adresse'],
        'cp' => $c['cp'], 'ville' => $c['ville'], 'rib' => $c['rib'], 'vendeur_id' => $c['vendeur_id'], 'langue' => $c['langue'],
        'rib_maj_le' => $c['rib_maj_le'] ?? null, 'rib_autre' => rib_autre_personne($c), 'cree_le' => $c['cree_le'],
        'test' => est_test($c),
        'piece' => $p ? ['type' => $p['type'], 'numero' => $p['numero'], 'expiration' => $p['expiration'], 'recto' => (bool) $p['recto'],
            'verso' => (bool) $p['verso'], 'depose_le' => $p['depose_le']] : null,
    ];
}





function demandes_pour_malik(string $etat, bool $sans_test = false): array
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
        if ($comptes[$e['compte']] && !($sans_test && est_test($comptes[$e['compte']]))) {
            $r[] = $e + ['client' => client_pour_malik($comptes[$e['compte']]), 'mails' => $mails[$e['id']] ?? [], 'colis_en_retard' => colis_en_retard($e),
                'colis_tarde' => colis_tarde($e),

                'avis_apercu' => $e['avis'] ? avis_public($comptes[$e['compte']], $e) : null];
        }
    }
    return $r;
}




function comptes_pour_malik(): array
{
    $nombres = [];

    foreach (bd()->query('SELECT compte, COUNT(*) AS n, SUM(CASE WHEN paye_le IS NOT NULL THEN 1 ELSE 0 END) AS payees, MAX(cree_le) AS derniere,
        SUM(CASE WHEN recu_le IS NOT NULL OR pese_le IS NOT NULL OR paye_le IS NOT NULL OR bon_numero IS NOT NULL THEN 1 ELSE 0 END) AS vendues
        FROM espace_envois GROUP BY compte')->fetchAll() as $l) $nombres[$l['compte']] = $l;
    $r = [];
    foreach (bd()->query('SELECT * FROM espace_comptes ORDER BY cree_le DESC LIMIT 500')->fetchAll() as $l) {
        $c = compte_depuis_ligne($l);
        $p = $c['piece'];
        $n = $nombres[$c['id']] ?? null;
        $ferme = (bool) $c['archive_le'];
        $r[] = [
            'id' => $c['id'], 'email' => $ferme ? '' : $c['email'], 'profil' => $c['profil'], 'nom' => $c['nom'], 'prenom' => $c['prenom'],
            'entreprise' => $c['entreprise'], 'telephone' => $c['telephone'], 'cp' => $c['cp'], 'ville' => $c['ville'],
            'cree_le' => $c['cree_le'], 'vu_le' => $c['vu_le'], 'ferme_le' => $c['archive_le'], 'test' => est_test($c),
            'manque' => $ferme ? [] : manques($c), 'piece' => (bool) $p, 'piece_expiration' => (string) ($p['expiration'] ?? ''),
            'rib' => (bool) $c['rib'],
            'demandes' => (int) ($n['n'] ?? 0), 'ventes' => (int) ($n['payees'] ?? 0), 'derniere_demande' => $n['derniere'] ?? null,
            'vendues' => (int) ($n['vendues'] ?? 0),
        ];
    }
    return $r;
}


function marquer_test(string $id, bool $oui): bool
{
    if (!lire_compte($id)) return false;
    bd()->prepare('UPDATE espace_comptes SET test_le = ? WHERE id = ?')->execute([$oui ? iso() : null, $id]);
    return true;
}

const ETAPES_A_PREVENIR = ['traite', 'recu', 'pese', 'paye'];











function marquer_envoi(string $id, string $action, string $par, string $numero = '', array $x = [], bool $appli = false, ?string &$issue = null): ?array
{
    [$e, $issue] = transaction(function (PDO $bd) use ($id, $action, $par, $numero, $x, $appli) {
        $q = $bd->prepare('SELECT * FROM espace_envois WHERE id = ?' . pour_maj());
        $q->execute([$id]);
        $l = $q->fetch();
        if (!$l) return [null, null];
        $e = envoi_depuis_ligne($l);
        $issue = 'fait';
        $kg = fn ($v) => is_numeric($v) && (float) $v > 0 && (float) $v < 1000 ? round((float) $v * 100) / 100 : null;
        switch ($action) {
            case 'traite':
                if ($e['traite_le']) return [$e, 'deja'];
                $e = ['traite_le' => iso(), 'traite_par' => coupe($par, 60)] + $e;
                break;
            case 'remettre':
                if (!$e['traite_le']) return [$e, 'deja'];
                if (!$appli && ($e['recu_le'] || $e['pese_le'] || $e['paye_le'])) return [$e, 'change'];
                $e = ['traite_le' => null, 'traite_par' => ''] + $e;
                break;
            case 'recu':
                if ($e['recu_le']) return [$e, 'deja'];
                $e = ['recu_le' => iso(), 'traite_le' => $e['traite_le'] ?? iso()] + $e;
                break;
            case 'sans_recu':
                if (!$e['recu_le']) return [$e, 'deja'];
                if (!$appli && ($e['pese_le'] || $e['paye_le'])) return [$e, 'change'];
                $e = ['recu_le' => null] + $e;
                break;
            case 'pese':
                $net = $kg($x['poids_net'] ?? null);
                if ($net === null) return [null, null];

                $montant = is_numeric($x['montant'] ?? null) && (float) $x['montant'] > 0 && (float) $x['montant'] < 1000000
                    ? centimes((float) $x['montant']) / 100 : null;
                $brut = $kg($x['poids_brut'] ?? null);

                if ($e['paye_le']) return [$e, 'change'];
                if ($e['pese_le']) {

                    $annonce = fn (?float $n, ?float $m) => $m !== null ? centimes($m) : ($n && $e['prix_kg'] ? montant_centimes($n, (float) $e['prix_kg']) : null);
                    $meme = abs((float) $e['poids_net'] - $net) < 0.005 && $annonce((float) $e['poids_net'], $e['montant']) === $annonce($net, $montant);
                    $memeBrut = $e['poids_brut'] === null ? $brut === null : $brut !== null && abs($e['poids_brut'] - $brut) < 0.005;


                    if (!$appli) return [$e, $meme && $memeBrut ? 'deja' : 'change'];


                    if ($meme) $issue = 'discret';
                }
                $e = ['pese_le' => iso(), 'poids_net' => $net, 'poids_brut' => $brut, 'recu_le' => ($e['recu_le'] ?? null) ?: iso(),
                    'montant' => $montant] + $e;
                break;
            case 'sans_pese':
                if (!$e['pese_le']) return [$e, 'deja'];
                if (!$appli && ($e['accord_le'] || $e['paye_le'])) return [$e, 'change'];
                $e = ['pese_le' => null, 'poids_net' => null, 'poids_brut' => null, 'accord_le' => null, 'accord_par' => ''] + $e;
                break;


            case 'accord':
                if (!($e['pese_le'] ?? null)) return [null, null];
                if ($e['accord_le']) return [$e, 'deja'];
                $e = ['accord_le' => iso(), 'accord_par' => texte($x['par'] ?? null, 20)] + $e;
                break;
            case 'sans_accord':
                if (!$e['accord_le']) return [$e, 'deja'];
                if (!$appli && $e['paye_le']) return [$e, 'change'];
                $e = ['accord_le' => null, 'accord_par' => ''] + $e;
                break;

            case 'retard':
                $etape = (string) ($x['etape'] ?? '');
                if (!in_array($etape, ['reclamation', 'prevenu', 'indemnite'], true)) return [null, null];
                $r = $e['retard'] ?? [];
                if (($x['fait'] ?? true) === false) unset($r[$etape]);
                else $r[$etape] = iso();
                $e = ['retard' => $r] + $e;
                break;
            case 'paye':
                if ($e['paye_le']) return [$e, 'deja'];

                $m = is_numeric($x['montant'] ?? null) && (float) $x['montant'] > 0 ? centimes((float) $x['montant']) / 100
                    : (($e['poids_net'] ?? null) && ($e['prix_kg'] ?? null) ? montant_pesee((float) $e['poids_net'], (float) $e['prix_kg']) : null);

                $e = ['paye_le' => iso(), 'montant' => $m, 'paye_detail' => texte($x['detail'] ?? null, 60), 'accord_le' => ($e['accord_le'] ?? null) ?: iso()] + $e;
                break;
            case 'sans_paye':
                if (!$e['paye_le']) return [$e, 'deja'];
                $e = ['paye_le' => null, 'montant' => null, 'paye_detail' => ''] + $e;
                break;
            case 'bon':
                if ($e['bon_numero'] === coupe($numero, 20)) return [$e, 'deja'];
                $e = ['bon_numero' => coupe($numero, 20), 'bon_le' => iso(), 'traite_le' => $e['traite_le'] ?? iso()] + $e;
                break;
            case 'sans_bon':
                if (!$e['bon_numero']) return [$e, 'deja'];
                $e = ['bon_numero' => null, 'bon_le' => null] + $e;
                break;
            default: return [null, null];
        }
        $bd->prepare('UPDATE espace_envois SET traite_le = ?, traite_par = ?, bon_numero = ?, bon_le = ?, recu_le = ?, pese_le = ?, poids_brut = ?,
            poids_net = ?, paye_le = ?, montant = ?, paye_detail = ?, accord_le = ?, accord_par = ?, retard = ? WHERE id = ?')
            ->execute([$e['traite_le'], $e['traite_par'], $e['bon_numero'], $e['bon_le'], $e['recu_le'] ?? null, $e['pese_le'] ?? null,
                $e['poids_brut'] ?? null, $e['poids_net'] ?? null, $e['paye_le'] ?? null, $e['montant'] ?? null, $e['paye_detail'] ?? '',
                $e['accord_le'] ?? null, ($e['accord_par'] ?? '') ?: null, !empty($e['retard']) ? json_encode($e['retard']) : null, $id]);
        return [$e, $issue];
    });
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
    $q = bd()->prepare("SELECT * FROM espace_envois WHERE garanti_jusqu = ? AND traite_le IS NOT NULL AND recu_le IS NULL AND bon_numero IS NULL AND paye_le IS NULL
        AND rappel_garantie IS NULL AND (transport IS NULL OR transport <> 'vendeur') LIMIT 20");
    $q->execute([$dans2]);
    foreach ($q->fetchAll() as $l) {
        $e = envoi_depuis_ligne($l);
        $c = lire_compte($e['compte']);
        if ($c && !$c['archive_le'] && !mail_du_menage('Plus que 2 jours', fn () => mail_rappel_garantie($c, $e))) continue;
        bd()->prepare('UPDATE espace_envois SET rappel_garantie = ? WHERE id = ?')->execute([iso(), $e['id']]);
    }
}




function rappeler_pieces(): void
{
    $auj = aujourdhui();
    $dans30 = (new DateTimeImmutable($auj . ' 12:00:00'))->modify('+30 days')->format('Y-m-d');
    $q = bd()->prepare("SELECT * FROM espace_comptes WHERE archive_le IS NULL AND piece_expiration IS NOT NULL AND piece_expiration <> ''
        AND piece_expiration >= ? AND piece_expiration <= ? AND (rappel_piece IS NULL OR rappel_piece <> piece_expiration)
        ORDER BY piece_expiration LIMIT 10");
    $q->execute([$auj, $dans30]);
    foreach ($q->fetchAll() as $l) {
        $c = compte_depuis_ligne($l);
        if (!$c['piece'] || $c['rappel_piece'] === $c['piece']['expiration']) continue;
        if (!mail_du_menage('pièce qui expire', fn () => mail_piece_bientot($c))) continue;
        bd()->prepare('UPDATE espace_comptes SET rappel_piece = ? WHERE id = ?')->execute([$c['piece']['expiration'], $c['id']]);
    }
}
