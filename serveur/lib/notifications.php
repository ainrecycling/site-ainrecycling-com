<?php
declare(strict_types=1);

require_once __DIR__ . '/base.php';















const NOTIF_SUJET = 'mailto:contact@ainrecycling.com';
const NOTIF_TTL = 86400;
const NOTIF_JWT_DUREE = 43200;
const NOTIF_APPAREILS_MAX = 10;
const NOTIF_GARDE_MS = 86400000;
const NOTIF_ESSAIS_PAR_JOUR = 30;


const NOTIF_SERVICES = ['web.push.apple.com', 'fcm.googleapis.com', 'updates.push.services.mozilla.com'];


function notif_adresse_valide(string $u): bool
{
    if (strlen($u) > 1024 || !preg_match('#^https://([a-z0-9.-]+)/\S*$#i', $u, $m)) return false;
    $hote = strtolower($m[1]);
    return in_array($hote, NOTIF_SERVICES, true) || (bool) preg_match('/^([a-z0-9-]+\.)+notify\.windows\.com$/', $hote);
}


function notif_appareil(): string
{
    $ua = (string) ($_SERVER['HTTP_USER_AGENT'] ?? '');
    $appareil = preg_match('/iPhone/', $ua) ? 'iPhone' : (preg_match('/iPad/', $ua) ? 'iPad' : (preg_match('/Android/', $ua) ? 'Téléphone Android'
        : (preg_match('/Windows/', $ua) ? 'Ordinateur Windows' : (preg_match('/Macintosh/', $ua) ? 'Mac' : 'Autre appareil'))));
    $nav = preg_match('/Edg\//', $ua) ? 'Edge' : (preg_match('/Firefox\//', $ua) ? 'Firefox' : (preg_match('/Chrome\//', $ua) ? 'Chrome'
        : (preg_match('/Safari\//', $ua) ? 'Safari' : '')));
    return coupe(trim($appareil . ($nav !== '' ? ' · ' . $nav : '')), 60);
}




function notif_cles(): array
{
    static $cles = null;
    if ($cles !== null) return $cles;
    $f = prive() . '/vapid.php';
    if (!is_file($f)) {
        $verrou = @fopen(prive() . '/vapid.verrou', 'c');
        if ($verrou === false) throw new RuntimeException('verrou des clés VAPID impossible');
        try {
            flock($verrou, LOCK_EX);
            clearstatcache(true, $f);
            if (!is_file($f)) {
                $paire = notif_creer_paire();
                $php = "<?php\n// Clés des notifications de la page de gestion (VAPID), créées par le serveur le " . gmdate('c') . ".\n"
                    . "// Ne jamais copier ce fichier ailleurs. S'il disparaît, le serveur crée une autre paire : chaque appareil se\n"
                    . "// réinscrit tout seul à sa prochaine ouverture de la gestion.\nreturn " . var_export($paire, true) . ";\n";
                if (@file_put_contents($f, $php, LOCK_EX) === false) throw new RuntimeException('clés VAPID impossibles à garder');
                @chmod($f, 0600);
            }
        } finally {
            flock($verrou, LOCK_UN);
            fclose($verrou);
        }
    }
    $lu = require $f;
    if (!is_array($lu) || !is_string($lu['publique'] ?? null) || !is_string($lu['privee'] ?? null)) throw new RuntimeException('clés VAPID illisibles');
    return $cles = ['publique' => $lu['publique'], 'privee' => $lu['privee']];
}


function notif_creer_paire(): array
{
    $options = ['curve_name' => 'prime256v1', 'private_key_type' => OPENSSL_KEYTYPE_EC];
    $cnf = null;
    $cle = @openssl_pkey_new($options);
    if ($cle === false) {
        $cnf = tempnam(sys_get_temp_dir(), 'ain');
        if ($cnf !== false) {
            @file_put_contents($cnf, "# vide\n");
            $options['config'] = $cnf;
            $cle = @openssl_pkey_new($options);
        }
    }
    $pem = '';
    $ok = $cle !== false && @openssl_pkey_export($cle, $pem, null, $cnf ? ['config' => $cnf] : []);
    if ($cnf) @unlink($cnf);
    $ec = $ok ? (openssl_pkey_get_details($cle)['ec'] ?? null) : null;
    while (openssl_error_string() !== false);
    if (!$ok || !is_array($ec) || ($ec['curve_name'] ?? '') !== 'prime256v1' || !is_string($ec['x'] ?? null) || !is_string($ec['y'] ?? null)) {
        throw new RuntimeException('clé VAPID impossible à créer');
    }

    return ['publique' => b64url("\x04" . str_pad($ec['x'], 32, "\0", STR_PAD_LEFT) . str_pad($ec['y'], 32, "\0", STR_PAD_LEFT)), 'privee' => $pem];
}



function notif_jwt(string $origine, string $privee, ?int $maintenant = null): string
{
    $tete = b64url((string) json_encode(['typ' => 'JWT', 'alg' => 'ES256']));
    $corps = b64url((string) json_encode(['aud' => $origine, 'exp' => ($maintenant ?? time()) + NOTIF_JWT_DUREE, 'sub' => NOTIF_SUJET], JSON_UNESCAPED_SLASHES));
    $cle = openssl_pkey_get_private($privee);
    $der = '';
    if ($cle === false || !openssl_sign("$tete.$corps", $der, $cle, OPENSSL_ALGO_SHA256)) throw new RuntimeException('signature VAPID impossible');
    return "$tete.$corps." . b64url(notif_signature_brute($der));
}


function notif_signature_brute(string $der): string
{
    if (strlen($der) < 8 || ord($der[0]) !== 0x30) throw new RuntimeException('signature illisible');
    $i = 2 + ((ord($der[1]) & 0x80) ? ord($der[1]) & 0x7f : 0);
    $brut = '';
    for ($n = 0; $n < 2; $n++) {
        if (ord($der[$i] ?? "\0") !== 0x02 || !isset($der[$i + 1])) throw new RuntimeException('signature illisible');
        $long = ord($der[$i + 1]);
        $v = ltrim(substr($der, $i + 2, $long), "\0");
        if (strlen($v) > 32) throw new RuntimeException('signature illisible');
        $brut .= str_pad($v, 32, "\0", STR_PAD_LEFT);
        $i += 2 + $long;
    }
    return $brut;
}


function notif_requete(string $endpoint, array $cles, ?int $maintenant = null): array
{
    $p = parse_url($endpoint);
    if (!is_array($p) || empty($p['scheme']) || empty($p['host'])) throw new RuntimeException('adresse d\'abonnement illisible');
    $origine = $p['scheme'] . '://' . $p['host'] . (isset($p['port']) ? ':' . $p['port'] : '');
    return ['url' => $endpoint, 'entetes' => [
        'TTL: ' . NOTIF_TTL,
        'Urgency: high',
        'Authorization: vapid t=' . notif_jwt($origine, $cles['privee'], $maintenant) . ', k=' . $cles['publique'],
        'Content-Type:',
    ]];
}


function notif_poster(array $req): int
{


    if (mode_essai()) {
        journaliser('essai : notification pas envoyée (mode essai) vers ' . (parse_url((string) $req['url'], PHP_URL_HOST) ?: '?'));
        return 0;
    }
    $ch = curl_init($req['url']);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => '',
        CURLOPT_HTTPHEADER => $req['entetes'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 4,
        CURLOPT_TIMEOUT => 8,
    ]);
    $r = curl_exec($ch);
    return $r === false ? 0 : (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
}


function notif_pousser(array $l, array $cles): int
{
    $code = notif_poster(notif_requete((string) $l['endpoint'], $cles));
    if ($code === 404 || $code === 410) {
        notif_effacer((string) $l['id']);
    } elseif ($code >= 200 && $code < 300) {
        bd()->prepare('UPDATE gestion_notifs SET envoye_le = ?, echecs = 0 WHERE id = ?')->execute([iso(), $l['id']]);
    } else {
        bd()->prepare('UPDATE gestion_notifs SET echecs = echecs + 1 WHERE id = ?')->execute([$l['id']]);
        journaliser('notification refusée par ' . (parse_url((string) $l['endpoint'], PHP_URL_HOST) ?: '?') . ' : ' . ($code ?: 'pas de réponse'));
    }
    return $code;
}



function notif_journal(array $l, array $ev): void
{
    $req = notif_requete((string) $l['endpoint'], notif_cles());
    $n = notif_texte($ev);
    $d = prive() . '/journal';
    if (!is_dir($d)) @mkdir($d, 0700, true);
    $ligne = '[' . iso() . '] notification (essai : rien n\'est parti) vers ' . (parse_url((string) $l['endpoint'], PHP_URL_HOST) ?: '?')
        . ', appareil ' . substr((string) $l['id'], 0, 12) . ' (' . $l['appareil'] . ')' . "\n"
        . '  POST ' . $l['endpoint'] . " (corps vide)\n"
        . implode('', array_map(fn ($h) => "  $h\n", array_filter($req['entetes'], fn ($h) => $h !== 'Content-Type:')))
        . '  événement : ' . $ev['t'] . ($ev['r'] !== '' ? ' ' . $ev['r'] : '') . "\n"
        . '  l\'appareil affichera : ' . ($n ? '« ' . $n['titre'] . ' » « ' . $n['texte'] . ' » → ' . $n['url'] : 'le texte général') . "\n----\n";
    @file_put_contents("$d/notifications.log", $ligne, FILE_APPEND | LOCK_EX);
    error_log('[essai, rien n\'est parti] notification ' . $ev['t'] . ' ' . $ev['r'] . ' → ' . (parse_url((string) $l['endpoint'], PHP_URL_HOST) ?: '?'));
}


function notif_ligne(string $endpoint): ?array
{
    if ($endpoint === '') return null;
    $q = bd()->prepare('SELECT * FROM gestion_notifs WHERE id = ?');
    $q->execute([hash('sha256', $endpoint)]);
    $l = $q->fetch();
    return $l ?: null;
}

function notif_effacer(string $id): void
{
    bd()->prepare('DELETE FROM gestion_notifs WHERE id = ?')->execute([$id]);
}




function notif_garder_seulement(string $endpoint): void
{
    bd()->prepare('DELETE FROM gestion_notifs WHERE id <> ?')->execute([$endpoint === '' ? '' : hash('sha256', $endpoint)]);
}



function notif_abonner($abo, string $email): ?string
{
    $endpoint = is_array($abo) && is_string($abo['endpoint'] ?? null) ? trim($abo['endpoint']) : '';
    if (!notif_adresse_valide($endpoint)) return 'abonnement';
    $id = hash('sha256', $endpoint);
    $appareil = notif_appareil();
    $maintenant = iso();
    transaction(function (PDO $bd) use ($id, $endpoint, $email, $appareil, $maintenant) {
        $q = $bd->prepare('SELECT id FROM gestion_notifs WHERE id = ?' . pour_maj());
        $q->execute([$id]);
        if ($q->fetch()) {
            $bd->prepare('UPDATE gestion_notifs SET email = ?, appareil = ?, maj_le = ?, echecs = 0 WHERE id = ?')->execute([$email, $appareil, $maintenant, $id]);
        } else {
            $bd->prepare('INSERT INTO gestion_notifs (id, endpoint, email, appareil, cree_le, maj_le) VALUES (?, ?, ?, ?, ?, ?)')
                ->execute([$id, $endpoint, $email, $appareil, $maintenant, $maintenant]);
        }
        $ids = array_column($bd->query('SELECT id FROM gestion_notifs ORDER BY maj_le DESC')->fetchAll(), 'id');
        foreach (array_slice($ids, NOTIF_APPAREILS_MAX) as $vieux) $bd->prepare('DELETE FROM gestion_notifs WHERE id = ?')->execute([$vieux]);
    });
    return null;
}



function notifs_pour_malik(?string $endpoint = null): array
{
    $ici = $endpoint ? hash('sha256', $endpoint) : '';
    $appareils = array_map(fn ($l) => ['appareil' => (string) $l['appareil'], 'cree_le' => (string) $l['cree_le'], 'envoye_le' => $l['envoye_le'] ?: null, 'ici' => $l['id'] === $ici],
        bd()->query('SELECT id, appareil, cree_le, envoye_le FROM gestion_notifs ORDER BY cree_le')->fetchAll());
    return ['cle' => notif_cles()['publique'], 'appareils' => $appareils, 'essai' => mode_essai()];
}



function notif_essai(string $endpoint): string
{
    $l = notif_ligne($endpoint);
    if (!$l) return 'perdu';
    $ev = ['t' => 'essai', 'r' => '', 'le' => iso()];
    notif_en_attente((string) $l['id'], $ev);
    if (mode_essai()) {
        notif_journal($l, $ev);
        return 'essai';
    }
    $code = notif_pousser($l, notif_cles());
    if ($code === 404 || $code === 410) return 'perdu';
    return $code >= 200 && $code < 300 ? 'ok' : 'push';
}












function alerter_malik(string $cle, string $titre, string|Closure $texte): bool
{
    if (!preg_match('/^[a-z0-9-]{1,32}$/', $cle)) return false;
    if (!sous_la_limite('alerte:' . $cle, 1)) return false;
    if ($texte instanceof Closure) $texte = (string) $texte();
    $ev = ['titre' => coupe($titre, 120), 'texte' => coupe($texte, 300)];
    apres_reponse(function () use ($cle, $ev) {
        try {
            notifier('alerte', $cle, $ev);
        } catch (Throwable $e) {
            journaliser('alerte non envoyée : ' . resume_erreur($e));
        }
    });
    return true;
}





function notifier(string $type, string $ref, array $plus = []): void
{
    $lignes = bd()->query('SELECT id, endpoint, appareil FROM gestion_notifs')->fetchAll();
    if (!$lignes) return;
    $ev = ['t' => $type, 'r' => $ref, 'le' => iso()] + array_intersect_key($plus, ['titre' => 1, 'texte' => 1]);
    $cles = notif_cles();
    foreach ($lignes as $l) {
        try {
            notif_en_attente((string) $l['id'], $ev);
            if (mode_essai()) {
                notif_journal($l, $ev);
            } elseif (!notif_adresse_valide((string) $l['endpoint'])) {
                notif_effacer((string) $l['id']);
            } else {
                notif_pousser($l, $cles);
            }
        } catch (Throwable $e) {
            journaliser('notification non envoyée : ' . resume_erreur($e));
        }
    }
}


function notif_en_attente(string $id, array $ev): void
{
    transaction(function (PDO $bd) use ($id, $ev) {
        $q = $bd->prepare('SELECT attente FROM gestion_notifs WHERE id = ?' . pour_maj());
        $q->execute([$id]);
        $l = $q->fetch();
        if (!$l) return;
        $liste = notif_recents((array) json_decode((string) ($l['attente'] ?? ''), true));
        $liste[] = $ev;
        $bd->prepare('UPDATE gestion_notifs SET attente = ? WHERE id = ?')->execute([json_encode(array_slice($liste, -20), JSON_UNESCAPED_UNICODE), $id]);
    });
}


function notif_recents(array $liste): array
{
    $limite = iso(ms() - NOTIF_GARDE_MS);
    return array_values(array_filter($liste, fn ($e) => is_array($e) && in_array($e['t'] ?? '', ['demande', 'message', 'essai', 'alerte'], true)
        && is_string($e['r'] ?? null) && is_string($e['le'] ?? null) && $e['le'] >= $limite));
}



function notif_detail(string $endpoint): array
{
    if ($endpoint === '') return [];
    $id = hash('sha256', $endpoint);
    $evenements = transaction(function (PDO $bd) use ($id) {
        $q = $bd->prepare('SELECT attente FROM gestion_notifs WHERE id = ?' . pour_maj());
        $q->execute([$id]);
        $l = $q->fetch();
        if (!$l || !$l['attente']) return [];
        $bd->prepare('UPDATE gestion_notifs SET attente = NULL WHERE id = ?')->execute([$id]);
        return notif_recents((array) json_decode((string) $l['attente'], true));
    });
    $r = [];
    foreach ($evenements as $ev) {
        $n = notif_texte($ev);
        if ($n) $r[] = $n;
    }
    return array_slice($r, -5);
}







function notif_texte(array $ev): ?array
{
    $n = notif_texte_brut($ev);
    if ($n) foreach (['titre', 'texte'] as $k) $n[$k] = notif_insec($n[$k]);
    return $n;
}



function notif_insec(string $t): string
{
    return (string) preg_replace(['/ ([:;?!»])/u', '/« /u', '/(\d) (kg)\b/u', '/ \((\d{2,3})\)/u'], ["\u{a0}$1", "«\u{a0}", "$1\u{a0}$2", "\u{a0}($1)"], $t);
}

function notif_texte_brut(array $ev): ?array
{
    $ref = (string) ($ev['r'] ?? '');
    switch ($ev['t'] ?? '') {
        case 'essai':
            return ['titre' => 'Notification d\'essai', 'texte' => 'C\'est bon : cet appareil sonnera ainsi à chaque nouvelle demande et à chaque nouveau message.',
                'url' => '/gestion/', 'tag' => 'essai'];

        case 'alerte':
            return ['titre' => coupe((string) ($ev['titre'] ?? 'Alerte du site'), 120), 'texte' => coupe((string) ($ev['texte'] ?? ''), 300),
                'url' => '/gestion/', 'tag' => 'alerte-' . $ref];
        case 'demande':
            $q = bd()->prepare('SELECT * FROM espace_envois WHERE reference = ?');
            $q->execute([$ref]);
            $l = $q->fetch();
            if (!$l) return null;
            $e = envoi_depuis_ligne($l);
            $c = lire_compte($e['compte']);

            $prenom = $c ? notif_prenom((string) $c['prenom']) : '';
            return ['titre' => 'Nouvelle demande' . ($prenom !== '' ? ' · ' . $prenom : ''),
                'texte' => ($e['transport'] === 'vendeur' ? 'Envoi par colis, à ses frais' : 'Envoi par colis') . '. Touchez pour l\'ouvrir.',
                'url' => '/gestion/#' . $e['reference'], 'tag' => 'demande-' . $e['reference']];
        case 'message':

            if ($ref === '') return ['titre' => 'Nouveau message sur le site', 'texte' => 'Il est dans ta boîte mail.', 'url' => '/gestion/', 'tag' => 'message'];
            $q = bd()->prepare('SELECT sujet FROM site_messages WHERE id = ?');
            $q->execute([$ref]);
            $l = $q->fetch();
            if (!$l) return null;



            $morceaux = explode(' – ', (string) $l['sujet'], 2);
            $devis = (bool) preg_match('/devis|angebot|quote|preventivo|presupuesto/i', trim($morceaux[0]));
            $prenom = $devis ? '' : notif_prenom(trim($morceaux[1] ?? ''), true);
            return ['titre' => ($devis ? 'Nouvelle demande de devis' : 'Nouveau message') . ($prenom !== '' ? ' · ' . $prenom : ''),
                'texte' => ($devis ? 'Formulaire des professionnels' : 'Formulaire de contact') . '. Touchez pour le lire.',
                'url' => '/gestion/#message-' . $ref, 'tag' => 'message-' . $ref];
    }
    return null;
}





function notif_prenom(string $nom, bool $libre = false): string
{
    $mots = preg_split('/\s+/u', trim($nom)) ?: [];
    $m = (string) ($mots[0] ?? '');
    if (!preg_match('/^\p{L}[\p{L}\'’-]{0,19}$/u', $m)) return '';
    if ($libre && (count($mots) < 2 || mb_strtoupper($m, 'UTF-8') === $m
        || preg_match('/^(m|mr|mrs|ms|mme|mlle|monsieur|madame|mademoiselle|herr|frau|sig|sigra|signor|signora|sr|sra|senor|señor|senora|señora|don|dona|doña|dr)$/iu', $m))) return '';
    return $m;
}
