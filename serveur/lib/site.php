<?php
declare(strict_types=1);

require_once __DIR__ . '/base.php';
require_once __DIR__ . '/mail.php';

// Réglages du site pilotés par Malik depuis sa page /gestion/ (8 nov. 2026, propositions 50, 54 à 57 et 65) :
// - le prix par colis (« Tout le site suit ») et sa garantie : 7 jours après la demande, jamais après la fin du mois
//   (choix de Malik : « mes contrats s'actualisent le 1er de chaque mois, donc s'il fait le 30 c'est valable jusqu'au 31 ») ;
// - les annonces en haut du site (congés, fermeture exceptionnelle, tournée), qui disparaissent seules à leur date de fin ;
// - l'alerte prix : les abonnés (inscription confirmée par e-mail) sont prévenus quand le prix monte ;
// - les pages vues, comptées sans cookie ni adresse IP (jour, page, d'où vient le visiteur), et le résumé du mois ;
// - la date de la dernière sauvegarde de l'espace client.
// Tables site_reglages, site_alertes et site_visites (créées par migrer() de base.php).

const PRIX_PAGES = 47.0;        // le prix écrit dans les pages du site : site.js le remplace par le prix du jour
const PRIX_MIN = 5, PRIX_MAX = 300, PRIX_DOUTE_BAS = 30, PRIX_DOUTE_HAUT = 80;
const GARANTIE_JOURS = 7;
const ALERTES_PAR_JOUR = 40, ALERTES_PAR_PASSAGE = 8, CONFIRMATIONS_PAR_JOUR = 20;
const TYPES_ANNONCE = ['conges', 'fermeture', 'tournee'];

// ---------- jours (heure de Paris) ----------
function jour_paris(?int $ms = null): string
{
    $d = new DateTime('@' . intdiv($ms ?? ms(), 1000));
    $d->setTimezone(new DateTimeZone('Europe/Paris'));
    return $d->format('Y-m-d');
}

function jour_valide($x): ?string
{
    if (!is_string($x) || !preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $x, $m) || !checkdate((int) $m[2], (int) $m[3], (int) $m[1])) return null;
    return $x;
}

function plus_jours(string $jour, int $n): string
{
    return (new DateTimeImmutable($jour . ' 12:00:00', new DateTimeZone('Europe/Paris')))->modify(($n >= 0 ? '+' : '') . $n . ' days')->format('Y-m-d');
}

/** Fin de la garantie d'une demande faite ce jour-là : 7 jours après, sans dépasser le dernier jour du mois. */
function garanti_jusqu(string $jour): string
{
    $fin = plus_jours($jour, GARANTIE_JOURS);
    $finMois = (new DateTimeImmutable($jour . ' 12:00:00', new DateTimeZone('Europe/Paris')))->format('Y-m-t');
    return min($fin, $finMois);
}

// ---------- réglages (une ligne par sujet, valeur en JSON) ----------
function reglage_site(string $cle, $defaut = null)
{
    $q = bd()->prepare('SELECT valeur FROM site_reglages WHERE cle = ?');
    $q->execute([$cle]);
    $v = $q->fetchColumn();
    if ($v === false) return $defaut;
    $j = json_decode((string) $v, true);
    return $j ?? $defaut;
}

function ecrire_reglage_site(string $cle, $valeur, string $par = ''): void
{
    $bd = bd();
    $sql = est_sqlite($bd)
        ? 'INSERT INTO site_reglages (cle, valeur, maj_le, maj_par) VALUES (?, ?, ?, ?)
           ON CONFLICT(cle) DO UPDATE SET valeur = excluded.valeur, maj_le = excluded.maj_le, maj_par = excluded.maj_par'
        : 'INSERT INTO site_reglages (cle, valeur, maj_le, maj_par) VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE valeur = VALUES(valeur), maj_le = VALUES(maj_le), maj_par = VALUES(maj_par)';
    $bd->prepare($sql)->execute([$cle, (string) json_encode($valeur, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), iso(), coupe($par, 60)]);
}

// ---------- prix (proposition 54) ----------
/** Le prix par colis : celui que Malik a enregistré, sinon celui des pages. Historique : les plus récents d'abord. */
function prix_site(): array
{
    $p = reglage_site('prix');
    if (!is_array($p) || !is_numeric($p['kg'] ?? null)) return ['kg' => PRIX_PAGES, 'le' => null, 'par' => '', 'historique' => []];
    $p['kg'] = (float) $p['kg'];
    $p['historique'] = is_array($p['historique'] ?? null) ? $p['historique'] : [];
    return $p;
}

function lire_prix($x): ?float
{
    if (is_string($x)) $x = str_replace([',', ' ', "\u{a0}", '€'], ['.', '', '', ''], $x);
    if (!is_numeric($x)) return null;
    $kg = round((float) $x, 2);
    return $kg >= PRIX_MIN && $kg <= PRIX_MAX ? $kg : null;
}

/** Nouveau prix : gardé avec l'ancien dans l'historique (60 changements). Renvoie [ancien, nouveau]. */
function changer_prix(float $kg, string $par): array
{
    return transaction(function (PDO $bd) use ($kg, $par) {
        $avant = prix_site();
        $histo = $avant['historique'];
        array_unshift($histo, ['kg' => $kg, 'le' => iso(), 'par' => coupe($par, 60), 'avant' => $avant['kg']]);
        $nouveau = ['kg' => $kg, 'le' => iso(), 'par' => coupe($par, 60), 'historique' => array_slice($histo, 0, 60)];
        ecrire_reglage_site('prix', $nouveau, $par);
        return [$avant, $nouveau];
    });
}

// ---------- annonces (proposition 55) ----------
function annonces(): array
{
    $a = reglage_site('annonces', []);
    return is_array($a) ? array_values(array_filter($a, 'is_array')) : [];
}

/** Les annonces encore valables (fin pas encore passée), par date de début. */
function annonces_actives(): array
{
    $auj = jour_paris();
    $a = array_values(array_filter(annonces(), fn ($x) => ($x['fin'] ?? '') >= $auj));
    usort($a, fn ($x, $y) => strcmp($x['debut'] ?? '', $y['debut'] ?? ''));
    return $a;
}

/** Une annonce envoyée par la page de gestion, vérifiée : type, du … au … (62 jours au plus), villes d'une tournée. */
function lire_annonce(array $b)
{
    $type = (string) ($b['type'] ?? '');
    if (!in_array($type, TYPES_ANNONCE, true)) return 'type';
    $debut = jour_valide($b['debut'] ?? null);
    $fin = jour_valide(($b['fin'] ?? '') !== '' ? $b['fin'] : ($b['debut'] ?? null));
    if (!$debut || !$fin || $fin < $debut) return 'dates';
    if ($fin < jour_paris()) return 'passee';
    if ((new DateTime($debut))->diff(new DateTime($fin))->days > 62) return 'longue';
    $villes = $type === 'tournee' ? texte($b['villes'] ?? null, 80) : '';
    if ($type === 'tournee' && mb_strlen($villes) < 2) return 'villes';
    return ['id' => bin2hex(random_bytes(6)), 'type' => $type, 'debut' => $debut, 'fin' => $fin, 'villes' => $villes];
}

function ajouter_annonce(array $a, string $par): array
{
    return transaction(function () use ($a, $par) {
        $toutes = array_values(array_filter(annonces(), fn ($x) => ($x['fin'] ?? '') >= jour_paris()));
        $toutes[] = $a + ['le' => iso(), 'par' => coupe($par, 60)];
        ecrire_reglage_site('annonces', array_slice($toutes, -20), $par);
        return $toutes;
    });
}

function retirer_annonce(string $id, string $par): bool
{
    return (bool) transaction(function () use ($id, $par) {
        $toutes = annonces();
        $reste = array_values(array_filter($toutes, fn ($x) => ($x['id'] ?? '') !== $id));
        if (count($reste) === count($toutes)) return false;
        ecrire_reglage_site('annonces', $reste, $par);
        return true;
    });
}

// ---------- ce que voit tout visiteur (site.js : /api/site/infos) ----------
function infos_publiques(): array
{
    $p = prix_site();
    $auj = jour_paris();
    return [
        'prix' => ['kg' => $p['kg'], 'depuis' => $p['le'] ? jour_paris((int) strtotime($p['le']) * 1000) : null,
            'garanti_jusqu' => garanti_jusqu($auj)],
        'aujourdhui' => $auj,
        'annonces' => array_map(fn ($a) => ['type' => $a['type'], 'debut' => $a['debut'], 'fin' => $a['fin'], 'villes' => $a['villes'] ?? ''], array_slice(annonces_actives(), 0, 4)),
    ];
}

// ---------- limites par appareil (empreinte de l'adresse IP, jamais l'adresse elle-même) ----------
function empreinte_ip(): string
{
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    return substr(hash_hmac('sha256', $ip . '|' . aujourdhui(), cle_binaire('secret')), 0, 16);
}

/** Compte une action pour ce nom aujourd'hui ; faux si la limite est déjà atteinte (rien n'est compté alors). */
function sous_la_limite(string $nom, int $max): bool
{
    $jour = aujourdhui();
    return (bool) transaction(function (PDO $bd) use ($nom, $max, $jour) {
        $q = $bd->prepare('SELECT jour, n FROM espace_compteurs WHERE nom = ?' . pour_maj());
        $q->execute([$nom]);
        $t = $q->fetch();
        $n = $t && $t['jour'] === $jour ? (int) $t['n'] : 0;
        if ($n >= $max) return false;
        if ($t) $bd->prepare('UPDATE espace_compteurs SET jour = ?, n = ? WHERE nom = ?')->execute([$jour, $n + 1, $nom]);
        else $bd->prepare('INSERT INTO espace_compteurs (jour, n, nom) VALUES (?, ?, ?)')->execute([$jour, 1, $nom]);
        return true;
    });
}

// ---------- alerte prix (proposition 56) ----------
/** Inscription : un e-mail de confirmation (une fois par jour au plus pour une adresse). Rien ne dit si l'adresse est déjà
 *  inscrite. Renvoie 'ok' ou 'trop'. */
function inscrire_alerte(string $email, string $langue): string
{
    $q = bd()->prepare('SELECT * FROM site_alertes WHERE email = ?');
    $q->execute([$email]);
    $l = $q->fetch();
    if ($l && $l['confirme_le']) return 'ok';
    if ($l && $l['demande_le'] > iso(ms() - 86400000)) return 'ok';
    if (!sous_la_limite('al:' . empreinte_ip(), 5)) return 'trop';
    if (!sous_la_limite('alertes-confirmations', CONFIRMATIONS_PAR_JOUR)) return 'trop';
    $jeton = $l['jeton'] ?? bin2hex(random_bytes(16));
    if ($l) bd()->prepare('UPDATE site_alertes SET langue = ?, demande_le = ? WHERE email = ?')->execute([$langue, iso(), $email]);
    else bd()->prepare('INSERT INTO site_alertes (email, jeton, langue, cree_le, demande_le) VALUES (?, ?, ?, ?, ?)')
        ->execute([$email, $jeton, $langue, iso(), iso()]);
    apres_reponse(fn () => mail_alerte_confirmer($email, $langue, $jeton));
    return 'ok';
}

function alerte_par_jeton(string $jeton): ?array
{
    if (!preg_match('/^[0-9a-f]{32}$/', $jeton)) return null;
    $q = bd()->prepare('SELECT * FROM site_alertes WHERE jeton = ?');
    $q->execute([$jeton]);
    $l = $q->fetch();
    return $l ?: null;
}

function confirmer_alerte(string $jeton): bool
{
    $l = alerte_par_jeton($jeton);
    if (!$l) return false;
    if (!$l['confirme_le']) bd()->prepare('UPDATE site_alertes SET confirme_le = ? WHERE jeton = ?')->execute([iso(), $jeton]);
    return true;
}

function desinscrire_alerte(string $jeton): bool
{
    $l = alerte_par_jeton($jeton);
    if (!$l) return false;
    bd()->prepare('DELETE FROM site_alertes WHERE jeton = ?')->execute([$jeton]);
    return true;
}

function nombre_abonnes(): int
{
    return (int) bd()->query('SELECT COUNT(*) FROM site_alertes WHERE confirme_le IS NOT NULL')->fetchColumn();
}

function alertes_en_attente(): int
{
    return (int) bd()->query('SELECT COUNT(*) FROM site_alertes WHERE prevenir IS NOT NULL AND confirme_le IS NOT NULL')->fetchColumn();
}

/** Le prix monte : chaque abonné sera prévenu (40 e-mails par jour au plus : le quota gratuit sert aussi à l'appli). */
function programmer_alertes(float $kg): int
{
    $q = bd()->prepare('UPDATE site_alertes SET prevenir = ? WHERE confirme_le IS NOT NULL');
    $q->execute([$kg]);
    return $q->rowCount();
}

function annuler_alertes(): void
{
    bd()->exec('UPDATE site_alertes SET prevenir = NULL');
}

/** Envoie quelques alertes en attente (8 par passage, une fois toutes les 2 minutes au plus), après la réponse.
 *  Une alerte dont le prix n'est plus celui du jour n'est pas envoyée. */
function envoyer_alertes_en_attente(): void
{
    $f = prive() . '/alertes.passage';
    $dernier = (int) @file_get_contents($f);
    if (time() - $dernier < 120) return;
    $q = bd()->query('SELECT COUNT(*) FROM site_alertes WHERE prevenir IS NOT NULL');
    if (!(int) $q->fetchColumn()) return;
    @file_put_contents($f, (string) time(), LOCK_EX);
    apres_reponse(function () {
        $prix = prix_site()['kg'];
        $q = bd()->prepare('SELECT * FROM site_alertes WHERE prevenir IS NOT NULL AND confirme_le IS NOT NULL ORDER BY confirme_le LIMIT ' . ALERTES_PAR_PASSAGE);
        $q->execute();
        foreach ($q->fetchAll() as $l) {
            if (abs((float) $l['prevenir'] - $prix) > 0.001) {
                bd()->prepare('UPDATE site_alertes SET prevenir = NULL WHERE email = ?')->execute([$l['email']]);
                continue;
            }
            if (!sous_la_limite('alertes-envoyees', ALERTES_PAR_JOUR)) return;
            bd()->prepare('UPDATE site_alertes SET prevenir = NULL, prevenu_le = ? WHERE email = ?')->execute([iso(), $l['email']]);
            mail_alerte_prix($l['email'], $l['langue'], $l['jeton'], $prix);
        }
    });
}

// ---------- annuaire des entreprises (proposition 60) ----------
/** « RUE DE L'EGLISE » → « Rue de l'Eglise » (les noms de l'annuaire sont en majuscules), comme l'appli (lib/annuaire.ts). */
function en_casse(string $s): string
{
    $petits = ['de', 'des', 'du', 'la', 'le', 'les', 'et', 'a', 'au', 'aux', 'en', 'sur', 'sous', 'd', 'l'];
    $i = 0;
    return (string) preg_replace_callback('/[\p{L}\d]+/u', function ($m) use (&$i, $petits) {
        $mot = mb_strtolower($m[0], 'UTF-8');
        $r = $i++ > 0 && in_array($mot, $petits, true) ? $mot : mb_strtoupper(mb_substr($mot, 0, 1, 'UTF-8'), 'UTF-8') . mb_substr($mot, 1, null, 'UTF-8');
        return $r;
    }, mb_strtolower($s, 'UTF-8'));
}

/** Entreprises en activité dont le nom, le SIREN ou le SIRET correspond (6 au plus) : nom, SIRET du siège, adresse. */
function chercher_entreprises(string $q): array
{
    $chiffres = (string) preg_replace('/\s/', '', $q);
    $texte = preg_match('/^\d{9}(\d{5})?$/', $chiffres) ? $chiffres : $q;
    $url = 'https://recherche-entreprises.api.gouv.fr/search?q=' . rawurlencode(coupe($texte, 100))
        . '&per_page=6&etat_administratif=A&minimal=true&include=siege';
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true, CURLOPT_CONNECTTIMEOUT => 3, CURLOPT_TIMEOUT => 5,
        CURLOPT_HTTPHEADER => ['Accept: application/json', 'User-Agent: AinRecycling-site/1.0 (+https://ainrecycling.com)'],
    ]);
    // essais sur l'ordinateur (Windows) : certificats du système ; chez OVH (Linux), ceux du serveur
    if (PHP_OS_FAMILY === 'Windows' && defined('CURLSSLOPT_NATIVE_CA')) curl_setopt($ch, CURLOPT_SSL_OPTIONS, CURLSSLOPT_NATIVE_CA);
    $r = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    if ($r === false || $code !== 200) {
        journaliser('annuaire des entreprises : ' . $code . ' ' . curl_error($ch));
        refus('annuaire', 503);
    }
    $j = json_decode((string) $r, true);
    $liste = [];
    foreach ((array) ($j['results'] ?? []) as $x) {
        if (!is_array($x) || !preg_match('/^\d{9}$/', (string) ($x['siren'] ?? ''))) continue;
        $s = is_array($x['siege'] ?? null) ? $x['siege'] : [];
        $cp = (string) ($s['code_postal'] ?? '');
        $rue = $cp !== '' ? (string) preg_replace('/\s*' . preg_quote($cp, '/') . '\b.*$/u', '', (string) ($s['adresse'] ?? '')) : '';
        $ville = (string) preg_replace('/^(PARIS|LYON|MARSEILLE) \d+$/', '$1', (string) ($s['libelle_commune'] ?? ''));
        $siret = (string) ($s['siret'] ?? '');
        $liste[] = [
            'nom' => trim((string) (($x['nom_raison_sociale'] ?? '') ?: ($x['nom_complet'] ?? ''))),
            'siret' => preg_match('/^\d{14}$/', $siret) ? $siret : '',
            'adresse' => en_casse(trim($rue)), 'cp' => preg_match('/^\d{5}$/', $cp) ? $cp : '', 'ville' => en_casse($ville),
        ];
    }
    return $liste;
}

// ---------- pages vues (proposition 57) : sans cookie, sans adresse IP ----------
/** Page lue et source du visiteur (« google », « bing », « direct », « qr »…) : une ligne par jour, page et source. */
function compter_visite(string $page, string $source): void
{
    $bd = bd();
    $sql = est_sqlite($bd)
        ? 'INSERT INTO site_visites (jour, page, source, n) VALUES (?, ?, ?, 1) ON CONFLICT(jour, page, source) DO UPDATE SET n = n + 1'
        : 'INSERT INTO site_visites (jour, page, source, n) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE n = n + 1';
    $bd->prepare($sql)->execute([jour_paris(), $page, $source]);
}

/** « /de/correspondance.html » ou « / » : seulement les pages du site, sans paramètres. */
function page_visitee($x): ?string
{
    $p = is_string($x) ? (string) parse_url($x, PHP_URL_PATH) : '';
    $p = (string) preg_replace('#/index\.html$#', '/', $p);
    return preg_match('#^/((de|en|it|es)/)?([a-z0-9-]+\.html)?$#', $p) ? $p : null;
}

/** D'où vient le visiteur, d'après le nom du site précédent (jamais son adresse complète). */
function source_visite($referent, $qr): string
{
    if ($qr === 'bac') return 'qr-bac';
    if ($qr === 'bordereau') return 'qr-bordereau';
    if ($qr === 'prospectus') return 'qr-prospectus';
    $h = is_string($referent) ? strtolower(trim($referent)) : '';
    if ($h === '') return 'direct';
    if (!preg_match('/^[a-z0-9.-]{1,120}$/', $h)) return 'autre';
    if (preg_match('/(^|\.)ainrecycling\.com$/', $h)) return 'interne';
    foreach (['google' => '/(^|\.)google\./', 'bing' => '/(^|\.)bing\.com$/', 'duckduckgo' => '/duckduckgo\.com$/', 'qwant' => '/qwant\.com$/',
        'ecosia' => '/ecosia\.org$/', 'yahoo' => '/yahoo\./', 'facebook' => '/(facebook|fb)\.com$/', 'whatsapp' => '/whatsapp\.(com|net)$/',
        'leboncoin' => '/leboncoin\.fr$/', 'chatgpt' => '/(chatgpt|openai)\.com$/'] as $nom => $re) {
        if (preg_match($re, $h)) return $nom;
    }
    return 'autre';
}

function est_robot(): bool
{
    return (bool) preg_match('/bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|whatsapp|curl|wget|python|monitor/i', (string) ($_SERVER['HTTP_USER_AGENT'] ?? ''));
}

/** Pages vues d'un mois (« 2026-11 ») : total, par page, par source. */
function visites_du_mois(string $mois): array
{
    $q = bd()->prepare('SELECT page, source, SUM(n) AS n FROM site_visites WHERE jour LIKE ? GROUP BY page, source');
    $q->execute([$mois . '-%']);
    $pages = $sources = [];
    $total = 0;
    foreach ($q->fetchAll() as $l) {
        if ($l['source'] === 'interne') $l['source'] = 'dans le site';
        $n = (int) $l['n'];
        $total += $n;
        $pages[$l['page']] = ($pages[$l['page']] ?? 0) + $n;
        $sources[$l['source']] = ($sources[$l['source']] ?? 0) + $n;
    }
    arsort($pages);
    arsort($sources);
    return ['mois' => $mois, 'total' => $total, 'pages' => array_slice($pages, 0, 8, true), 'sources' => $sources];
}

function mois_avant(string $mois, int $n = 1): string
{
    return (new DateTimeImmutable($mois . '-15'))->modify("-$n month")->format('Y-m');
}

/** Pour la page de gestion : ce mois-ci et le mois d'avant, et les 30 derniers jours (pages vues par jour). */
function visites_resume(): array
{
    $mois = substr(jour_paris(), 0, 7);
    $q = bd()->prepare("SELECT jour, SUM(n) AS n FROM site_visites WHERE jour >= ? AND source <> 'interne' GROUP BY jour ORDER BY jour");
    $q->execute([plus_jours(jour_paris(), -29)]);
    $jours = [];
    foreach ($q->fetchAll() as $l) $jours[$l['jour']] = (int) $l['n'];
    return ['ce_mois' => visites_du_mois($mois), 'mois_dernier' => visites_du_mois(mois_avant($mois)), 'entrees_par_jour' => $jours,
        'demandes_ce_mois' => demandes_du_mois($mois), 'demandes_mois_dernier' => demandes_du_mois(mois_avant($mois))];
}

function demandes_du_mois(string $mois): int
{
    // cree_le est en heure de Londres : à quelques heures près, c'est le bon mois
    $q = bd()->prepare('SELECT COUNT(*) FROM espace_envois WHERE cree_le LIKE ?');
    $q->execute([$mois . '-%']);
    return (int) $q->fetchColumn();
}

// ---------- ménage et résumé du mois (première demande du jour, après la réponse) ----------
function menage_site(): void
{
    $auj = aujourdhui();
    bd()->prepare("DELETE FROM espace_compteurs WHERE jour < ? AND nom NOT IN ('codes')")->execute([$auj]);
    bd()->prepare('DELETE FROM site_alertes WHERE confirme_le IS NULL AND cree_le < ?')->execute([iso(ms() - 7 * 86400000)]);
    bd()->prepare('DELETE FROM site_alertes WHERE confirme_le IS NOT NULL AND confirme_le < ?')->execute([iso(ms() - (int) (3 * 365.25 * 86400000))]);
    bd()->prepare('DELETE FROM site_visites WHERE jour < ?')->execute([mois_avant(substr(jour_paris(), 0, 7), 25) . '-01']);
    resume_du_mois();
}

/** Le 1er du mois (première demande), un e-mail à Malik : le mois passé en quelques lignes, et la sauvegarde à refaire. */
function resume_du_mois(): void
{
    $a = (string) reglage('mail_admin', '');
    $mois = substr(jour_paris(), 0, 7);
    $f = prive() . '/resume.mois';
    if ($a === '' || @file_get_contents($f) === $mois) return;
    @file_put_contents($f, $mois, LOCK_EX);
    $passe = mois_avant($mois);
    $v = visites_du_mois($passe);
    $avant = visites_du_mois(mois_avant($passe));
    [$an, $m] = explode('-', $passe);
    $nomMois = MOIS['fr'][(int) $m - 1] . ' ' . $an;
    $hors = $v['total'] - ($v['sources']['dans le site'] ?? 0);
    $lignes = [
        $v['total'] . ' pages vues' . ($avant['total'] ? ' (' . $avant['total'] . ' le mois d\'avant)' : '') . ', dont ' . $hors . ' en arrivant sur le site.',
        'Venus de Google : ' . ($v['sources']['google'] ?? 0) . ' · de Bing : ' . ($v['sources']['bing'] ?? 0) . ' · en tapant l\'adresse ou par un lien direct : ' . ($v['sources']['direct'] ?? 0)
            . (isset($v['sources']['qr-bac']) ? ' · étiquette de bac (QR code) : ' . $v['sources']['qr-bac'] : '') . '.',
        'Pages les plus lues : ' . (implode(', ', array_map(fn ($p, $n) => ($p === '/' ? 'accueil' : $p) . " ($n)", array_keys(array_slice($v['pages'], 0, 3, true)), array_slice($v['pages'], 0, 3, true))) ?: 'aucune') . '.',
        'Demandes d\'envoi par colis : ' . demandes_du_mois($passe) . ' · abonnés à l\'alerte prix : ' . nombre_abonnes() . '.',
        'Prix du site : ' . prix_texte(prix_site()['kg']) . ' €/kg.',
    ];
    $sauve = reglage_site('sauvegarde');
    $le = is_array($sauve) ? (string) ($sauve['le'] ?? '') : '';
    $lignes[] = $le !== '' && $le > iso(ms() - 31 * 86400000)
        ? 'Sauvegarde de l\'espace client faite le ' . date_longue(jour_paris((int) strtotime($le) * 1000), 'fr') . '.'
        : 'Pense à la sauvegarde de l\'espace client (bouton « Sauvegarder » de ta page).';
    $lignes[] = 'Ce que les gens tapent dans Google pour te trouver : Google Search Console, rubrique « Performances ».';
    mail_resume_mois($a, "Le site en $nomMois", $lignes, adresse_site() . '/gestion/');
}
