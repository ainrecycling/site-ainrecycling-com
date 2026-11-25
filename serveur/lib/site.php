<?php
declare(strict_types=1);

require_once __DIR__ . '/base.php';
require_once __DIR__ . '/mail.php';










const PRIX_PAGES = 47.0;
const ECART_DEPOT = 3.0;
const PRIX_MIN = 5, PRIX_MAX = 300, PRIX_DOUTE_BAS = 30, PRIX_DOUTE_HAUT = 80;
const GARANTIE_JOURS = 7;

const ALERTES_PAR_JOUR = 40, ALERTES_PAR_PASSAGE = 8, CONFIRMATIONS_PAR_JOUR = 5;


const CONFIRMATIONS_PAR_APPAREIL = 2;
const TYPES_ANNONCE = ['conges', 'fermeture', 'tournee'];


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


function garanti_jusqu(string $jour): string
{
    $fin = plus_jours($jour, GARANTIE_JOURS);
    $finMois = (new DateTimeImmutable($jour . ' 12:00:00', new DateTimeZone('Europe/Paris')))->format('Y-m-t');
    return min($fin, $finMois);
}



function feries(int $an): array
{
    $a = $an % 19; $b = intdiv($an, 100); $c = $an % 100; $d = intdiv($b, 4); $e = $b % 4; $f = intdiv($b + 8, 25);
    $g = intdiv($b - $f + 1, 3); $h = (19 * $a + $b - $d - $g + 15) % 30; $i = intdiv($c, 4); $k = $c % 4;
    $l = (32 + 2 * $e + 2 * $i - $h - $k) % 7; $m = intdiv($a + 11 * $h + 22 * $l, 451);
    $mois = intdiv($h + $l - 7 * $m + 114, 31); $jour = (($h + $l - 7 * $m + 114) % 31) + 1;
    $paques = new DateTimeImmutable(sprintf('%04d-%02d-%02d 12:00:00', $an, $mois, $jour), new DateTimeZone('Europe/Paris'));
    $liste = array_map(fn ($x) => "$an-$x", ['01-01', '05-01', '05-08', '07-14', '08-15', '11-01', '11-11', '12-25']);
    foreach ([1, 39, 50] as $n) $liste[] = $paques->modify("+$n days")->format('Y-m-d');
    return $liste;
}

function est_ouvre(string $jour): bool
{
    static $f = [];
    $an = (int) substr($jour, 0, 4);
    $f[$an] ??= feries($an);
    $n = (int) (new DateTimeImmutable($jour . ' 12:00:00', new DateTimeZone('Europe/Paris')))->format('N');
    return $n < 6 && !in_array($jour, $f[$an], true);
}


function heures_ouvrees(int $debutMs, ?int $finMs = null): float
{
    $tz = new DateTimeZone('Europe/Paris');
    $d = (new DateTimeImmutable('@' . intdiv($debutMs, 1000)))->setTimezone($tz);
    $fin = (new DateTimeImmutable('@' . intdiv($finMs ?? ms(), 1000)))->setTimezone($tz);
    $h = 0.0;
    for ($i = 0; $i < 800 && $d < $fin; $i++) {
        $minuit = $d->setTime(0, 0)->modify('+1 day');
        $bout = $minuit < $fin ? $minuit : $fin;
        if (est_ouvre($d->format('Y-m-d'))) $h += ($bout->getTimestamp() - $d->getTimestamp()) / 3600;
        $d = $minuit;
    }
    return $h;
}


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



function prix_site(): array
{
    static $enCours = false;
    $p = reglage_site('prix');
    if (!is_array($p) || !is_numeric($p['kg'] ?? null)) {
        return ['kg' => PRIX_PAGES, 'depot' => PRIX_PAGES + ECART_DEPOT, 'le' => null, 'par' => '', 'historique' => [], 'programme' => null];
    }

    $prog = is_array($p['programme'] ?? null) && jour_valide($p['programme']['jour'] ?? null) && is_numeric($p['programme']['kg'] ?? null) ? $p['programme'] : null;
    if ($prog && !$enCours && $prog['jour'] <= jour_paris()) {
        $enCours = true;
        try {
            appliquer_prix_programme($prog);
        } finally {
            $enCours = false;
        }
        return prix_site();
    }
    $p['kg'] = (float) $p['kg'];

    $p['depot'] = is_numeric($p['depot_regle'] ?? null) ? (float) $p['depot_regle'] : $p['kg'] + ECART_DEPOT;
    $p['historique'] = is_array($p['historique'] ?? null) ? $p['historique'] : [];
    $p['programme'] = $prog;
    return $p;
}

function lire_prix($x): ?float
{
    if (is_string($x)) $x = str_replace([',', ' ', "\u{a0}", '€'], ['.', '', '', ''], $x);
    if (!is_numeric($x)) return null;
    $kg = round((float) $x, 2);
    return $kg >= PRIX_MIN && $kg <= PRIX_MAX ? $kg : null;
}



function changer_prix(float $kg, string $par, ?float $depot = null, bool $programme = true): array
{
    return transaction(function (PDO $bd) use ($kg, $par, $depot, $programme) {
        $avant = prix_site();
        $histo = $avant['historique'];
        $nouveauDepot = $depot ?? $kg + ECART_DEPOT;
        if (abs($kg - $avant['kg']) > 0.001 || abs($nouveauDepot - $avant['depot']) > 0.001) {
            array_unshift($histo, ['kg' => $kg, 'depot' => $nouveauDepot, 'le' => iso(), 'par' => coupe($par, 60), 'avant' => $avant['kg'], 'avant_depot' => $avant['depot']]);
        }
        $nouveau = ['kg' => $kg, 'depot_regle' => $depot, 'le' => iso(), 'par' => coupe($par, 60), 'historique' => array_slice($histo, 0, 60),
            'programme' => $programme ? $avant['programme'] : null];
        ecrire_reglage_site('prix', $nouveau, $par);
        drapeau_prix($kg, $nouveauDepot);
        return [$avant, $nouveau];
    });
}



function programmer_prix(?array $prog, string $par): void
{



    prix_site();
    transaction(function () use ($prog, $par) {
        $p = prix_site();
        ecrire_reglage_site('prix', ['kg' => $p['kg'], 'depot_regle' => $p['depot_regle'] ?? null, 'le' => $p['le'], 'par' => $p['par'],
            'historique' => $p['historique'], 'programme' => $prog ? $prog + ['le' => iso(), 'par' => coupe($par, 60)] : null], $par);
    });
}


function appliquer_prix_programme(array $prog): void
{
    $kg = (float) $prog['kg'];
    $depot = is_numeric($prog['depot'] ?? null) ? (float) $prog['depot'] : null;
    [$avant] = changer_prix($kg, (string) ($prog['par'] ?? '') . ' (programmé)', $depot, false);
    if ($kg > $avant['kg'] + 0.001 && ($prog['prevenir'] ?? true) !== false) programmer_alertes($kg);
    elseif ($kg < $avant['kg'] - 0.001) annuler_alertes();
}


function annonces(): array
{
    $a = reglage_site('annonces', []);
    return is_array($a) ? array_values(array_filter($a, 'is_array')) : [];
}


function annonces_actives(): array
{
    $auj = jour_paris();
    $a = array_values(array_filter(annonces(), fn ($x) => ($x['fin'] ?? '') >= $auj));
    usort($a, fn ($x, $y) => strcmp($x['debut'] ?? '', $y['debut'] ?? ''));
    return $a;
}


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

    return ['id' => bin2hex(random_bytes(6)), 'type' => $type, 'debut' => $debut, 'fin' => $fin, 'villes' => $villes, 'tot' => ($b['tot'] ?? false) === true];
}

function ajouter_annonce(array $a, string $par): array
{
    return transaction(function () use ($a, $par) {
        $toutes = array_values(array_filter(annonces(), fn ($x) => ($x['fin'] ?? '') >= jour_paris()));

        foreach ($toutes as $x) {
            if (($x['type'] ?? '') === $a['type'] && ($x['debut'] ?? '') === $a['debut'] && ($x['fin'] ?? '') === $a['fin']
                && ($x['villes'] ?? '') === $a['villes'] && !empty($x['tot']) === $a['tot']) return $toutes;
        }
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


function infos_publiques(): array
{
    $p = prix_site();
    $auj = jour_paris();
    return [
        'prix' => ['kg' => $p['kg'], 'depot' => $p['depot'], 'depuis' => $p['le'] ? jour_paris((int) strtotime($p['le']) * 1000) : null,
            'garanti_jusqu' => garanti_jusqu($auj)],
        'aujourdhui' => $auj,
        'annonces' => array_map(fn ($a) => ['type' => $a['type'], 'debut' => $a['debut'], 'fin' => $a['fin'], 'villes' => $a['villes'] ?? '', 'tot' => !empty($a['tot'])], array_slice(annonces_actives(), 0, 4)),
        'google' => !empty((reglage_site('google') ?? [])['client_id']),
    ];
}


function empreinte_ip(): string
{
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');



    $bin = @inet_pton($ip);
    if (is_string($bin) && strlen($bin) === 16) {
        $ip = substr($bin, 0, 12) === "\0\0\0\0\0\0\0\0\0\0\xff\xff" ? (string) inet_ntop(substr($bin, 12)) : 'v6:' . bin2hex(substr($bin, 0, 8));
    }
    return substr(hash_hmac('sha256', $ip . '|' . aujourdhui(), cle_binaire('secret')), 0, 16);
}








const CONTACT_MAILS_PAR_JOUR = 8, CONTACT_MESSAGES_PAR_JOUR = 120, CONTACT_PHOTOS_PAR_JOUR = 40;






const CONTACT_MAILS_PAR_APPAREIL = 3, CONTACT_MESSAGES_PAR_APPAREIL = 8, CONTACT_SECOURS_PAR_JOUR = 4;







const CONTACT_PLACE_TEXTES = 25 * 1024 * 1024;



const CONTACT_SANS_DUREE_JUSQU = '2026-12-08';



const CONTACT_PHOTO_OCTETS = 1536 * 1024, CONTACT_PLACE_PHOTOS = 150 * 1024 * 1024;


function champ_contact(string $nom): string
{
    $v = $_POST[$nom] ?? null;
    return is_string($v) ? utf8_valable($v) : '';
}




function robot_contact(?string $jour = null): bool
{
    $pot = $_POST['site'] ?? '';
    if (!is_string($pot) || trim($pot) !== '') return true;
    if (!array_key_exists('duree', $_POST)) return ($jour ?? jour_paris()) > CONTACT_SANS_DUREE_JUSQU;
    return !(is_numeric($_POST['duree']) && (float) $_POST['duree'] >= 2000);
}


function phrase_messages_en_attente(): string
{
    $n = messages_a_repondre();
    return $n > 1 ? "$n messages y attendent ta réponse." : ($n === 1 ? '1 message y attend ta réponse.' : '');
}



function recevoir_contact(): void
{

    if (robot_contact()) repondre(['ok' => true]);


    $sujet = coupe(trim((string) preg_replace('/[\r\n]+/', ' ', champ_contact('sujet'))), 150);
    $corps = trim(str_replace("\r", '', champ_contact('texte')));
    $corps = mb_substr((string) preg_replace('/[^\P{C}\n\t]/u', '', $corps), 0, 4000);
    $retour = coupe(trim(champ_contact('retour')), 120);
    if ($corps === '' || $sujet === '') refus('vide');

    if (!sous_la_limite('contact:' . empreinte_ip(), CONTACT_MESSAGES_PAR_APPAREIL)) refus('trop_jour', 429);
    if (!sous_la_limite('contact:tous', CONTACT_MESSAGES_PAR_JOUR)) {
        alerter_malik('plafond-messages', 'Formulaire de contact : plafond du jour atteint',
            fn () => trim('Il refuse les messages jusqu\'à demain : beaucoup d\'envois aujourd\'hui, peut-être un robot. Les messages déjà reçus sont dans ta page de gestion. '
                . phrase_messages_en_attente()));
        refus('trop_jour', 429);
    }
    $pieces = $brutes = [];
    $f = $_FILES['photos'] ?? null;
    if ($f && is_array($f['tmp_name']) && $f['tmp_name'] && !sous_la_limite('contact-photos', CONTACT_PHOTOS_PAR_JOUR)) {
        $f = null;
        $corps .= "\n\n(Photos non gardées : trop de messages avec photos aujourd'hui. Demande-les à la personne.)";
        alerter_malik('plafond-photos', 'Messages du site : photos plus gardées aujourd\'hui',
            'Beaucoup de messages avec photos aujourd\'hui : les suivants sont gardés sans leurs photos jusqu\'à demain.');
    }
    $lourdes = 0;
    if ($f && is_array($f['tmp_name'])) {
        foreach (array_slice($f['tmp_name'], 0, 3, true) as $i => $tmp) {
            if (($f['error'][$i] ?? 1) !== UPLOAD_ERR_OK || !is_uploaded_file($tmp)) continue;
            if (($f['size'][$i] ?? 0) > CONTACT_PHOTO_OCTETS || (int) @filesize($tmp) > CONTACT_PHOTO_OCTETS) { $lourdes++; continue; }
            $info = @getimagesize($tmp);
            if (!$info || !in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) continue;
            $brutes[] = (string) file_get_contents($tmp);
            $pieces[] = ['filename' => 'photo-' . (count($pieces) + 1) . image_type_to_extension($info[2]), 'content' => base64_encode($brutes[count($brutes) - 1])];
        }
    }
    if ($lourdes) $corps .= "\n\n(" . ($lourdes > 1 ? "$lourdes photos non gardées : trop lourdes. Demande-les" : 'Une photo non gardée : trop lourde. Demande-la') . ' à la personne.)';


    $garder = $brutes;
    if ($brutes && place_photos_messages() + array_sum(array_map('strlen', $brutes)) > CONTACT_PLACE_PHOTOS) {
        $garder = [];
        alerter_malik('place-photos', 'Messages du site : plus de place pour les photos',
            'Les photos des nouveaux messages ne sont plus gardées dans ta page de gestion : leur place (environ 150 Mo) est pleine. Supprime d\'anciens messages avec photos pour en refaire.');
    }



    $connu = lire_connu($_POST['connu'] ?? null);
    $langue = langue_de($_POST['langue'] ?? null);
    $infos = [];
    if ($connu !== null) $infos[] = 'Nous a connus par : ' . CONNU[$connu];
    if ($langue !== 'fr') $infos[] = 'Écrit depuis le site en ' . LANGUES_EN_FRANCAIS[$langue] . ' : dans ta page de gestion, « Traduire en français » et tes réponses prêtes dans sa langue.';





    $parAppareil = sous_la_limite('contact-mails:' . empreinte_ip(), CONTACT_MAILS_PAR_APPAREIL);
    $mail = $parAppareil && sous_la_limite('contact-mails', CONTACT_MAILS_PAR_JOUR);


    $plein = false;
    try {
        $plein = place_textes_messages() + strlen($sujet) + strlen($corps) + strlen($retour) > CONTACT_PLACE_TEXTES;
    } catch (Throwable $e) {
        journaliser('place des textes des messages : ' . resume_erreur($e));
    }
    if ($plein) {
        alerter_malik('place-messages', 'Messages du site : plus de place dans la base',
            'Les nouveaux messages ne sont plus gardés dans ta page de gestion : leurs textes y prennent toute leur place (25 Mo), peut-être à cause d\'un robot. Ceux qui partent par e-mail t\'arrivent encore, les autres sont refusés. Supprime les messages inutiles pour en refaire.');
        if (!$mail) refus('trop_jour', 429);
    }
    $sansPlace = $brutes && !$garder;
    $corpsMail = $corps . ($plein ? "\n\n(Message pas gardé dans ta page de gestion : la place des messages y est pleine. Il n'est que dans cet e-mail.)"
        : ($sansPlace ? "\n\n(Photos jointes à cet e-mail seulement : plus de place sur le serveur pour les garder dans ta page de gestion.)" : ''));
    $html = '<p style="margin:0;white-space:pre-line">' . echapper($corpsMail) . '</p>'
        . ($infos ? '<p style="margin:14px 0 0;padding-top:10px;border-top:1px solid #e4e7ec;font-size:14px;color:#475467">' . implode('<br>', array_map('echapper', $infos)) . '</p>' : '');
    $entetes = filter_var($retour, FILTER_VALIDATE_EMAIL) ? ['Reply-To' => $retour] : [];

    $id = '';
    if (!$plein) {
        try {
            $id = garder_message($sujet, $corps . ($sansPlace ? "\n\n(Photos non gardées : plus de place sur le serveur. "
                . ($mail ? 'Elles sont jointes à l\'e-mail de ce message.)' : 'Demande-les à la personne.)') : ''), $retour, $garder, $connu, $langue);
        } catch (Throwable $e) {
            journaliser('message non gardé : ' . resume_erreur($e));
        }
    }
    if ($id === '' && !$mail) {



        if (!sous_la_limite('contact-secours', CONTACT_SECOURS_PAR_JOUR)) {
            alerter_malik('contact-panne', 'Formulaire de contact en panne',
                'La base du site refuse les messages et la réserve d\'e-mails du jour est vide : les visiteurs lisent « L\'envoi n\'a pas abouti ». Le détail est dans le journal du site.');
            refus('serveur', 503);
        }
        $mail = true;
    }
    if (!$mail) {


        if (!$parAppareil) {
            alerter_malik('appareil-contact', 'Messages du site : un même appareil a écrit plus de ' . CONTACT_MAILS_PAR_APPAREIL . ' fois',
                fn () => trim('Ses messages suivants arrivent dans ta page de gestion, sans e-mail ni notification, jusqu\'à demain. ' . phrase_messages_en_attente()));
        } else {
            alerter_malik('plafond-contact', 'Messages du site : plafond d\'e-mails atteint',
                fn () => trim('Les messages suivants arrivent dans ta page de gestion, sans e-mail ni notification, jusqu\'à demain. ' . phrase_messages_en_attente()));
        }
        repondre(['ok' => true]);
    }

    apres_reponse(fn () => notifier('message', $id));
    try {
        envoyer_mail((string) reglage('mail_admin', ''), '[Site] ' . $sujet, mail_cadre('fr', $html), $corpsMail . ($infos ? "\n\n" . implode("\n", $infos) : ''), [], $entetes, $pieces);
    } catch (Throwable $e) {



        if ($id === '') throw $e;
        journaliser('e-mail d\'un message pas parti (le message est dans la page de gestion) : ' . resume_erreur($e));
    }
    repondre(['ok' => true]);
}


const LANGUES_EN_FRANCAIS = ['fr' => 'français', 'de' => 'allemand', 'en' => 'anglais', 'it' => 'italien', 'es' => 'espagnol'];


function dossier_messages(): string
{
    $d = prive() . '/messages';
    if (!is_dir($d)) @mkdir($d, 0700, true);
    return $d;
}



function place_photos_messages(): int
{
    $total = 0;
    foreach (glob(dossier_messages() . '/*.bin') ?: [] as $f) $total += (int) @filesize($f);
    return $total;
}




function place_textes_messages(): int
{
    $bd = bd();
    $octets = est_sqlite($bd) ? 'LENGTH(CAST(sujet AS BLOB)) + LENGTH(CAST(texte AS BLOB)) + LENGTH(CAST(retour AS BLOB))'
        : 'LENGTH(sujet) + LENGTH(texte) + LENGTH(retour)';
    return (int) $bd->query("SELECT COALESCE(SUM($octets), 0) FROM site_messages")->fetchColumn();
}




function garder_message(string $sujet, string $texte, string $retour, array $photos, ?string $connu = null, string $langue = 'fr'): string
{
    $id = uuid();
    $noms = [];
    foreach (array_values($photos) as $i => $octets) {
        $nom = $id . '-' . ($i + 1) . '.bin';
        if (@file_put_contents(dossier_messages() . '/' . $nom, chiffrer_octets($octets), LOCK_EX) !== false) $noms[] = $nom;
    }
    try {
        bd()->prepare('INSERT INTO site_messages (id, cree_le, sujet, texte, retour, photos, connu, langue) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
            ->execute([$id, iso(), coupe($sujet, 160), $texte, coupe($retour, 120), json_encode($noms), lire_connu($connu), langue_de($langue)]);
    } catch (Throwable $e) {


        foreach ($noms as $nom) @unlink(dossier_messages() . '/' . $nom);
        throw $e;
    }
    return $id;
}




const MESSAGES_A_REPONDRE_MONTRES = 300, MESSAGES_REPONDUS_MONTRES = 100;



function messages_pour_malik(): array
{
    $lignes = array_merge(
        bd()->query('SELECT * FROM site_messages WHERE repondu_le IS NULL ORDER BY cree_le DESC, id DESC LIMIT ' . MESSAGES_A_REPONDRE_MONTRES)->fetchAll(),
        bd()->query('SELECT * FROM site_messages WHERE repondu_le IS NOT NULL ORDER BY cree_le DESC, id DESC LIMIT ' . MESSAGES_REPONDUS_MONTRES)->fetchAll());
    usort($lignes, fn ($a, $b) => strcmp((string) $b['cree_le'], (string) $a['cree_le']) ?: strcmp((string) $b['id'], (string) $a['id']));
    $r = [];
    foreach ($lignes as $l) {
        $r[] = ['id' => $l['id'], 'cree_le' => $l['cree_le'], 'sujet' => $l['sujet'], 'texte' => $l['texte'], 'retour' => $l['retour'],
            'photos' => count((array) json_decode((string) $l['photos'], true)), 'repondu_le' => $l['repondu_le'] ?: null,

            'connu' => lire_connu($l['connu'] ?? null), 'langue' => langue_de($l['langue'] ?? null)];
    }
    return $r;
}

function messages_a_repondre(): int
{
    return (int) bd()->query('SELECT COUNT(*) FROM site_messages WHERE repondu_le IS NULL')->fetchColumn();
}




function messages_nombres(): array
{
    $l = bd()->query('SELECT COUNT(*) AS tous, COALESCE(SUM(CASE WHEN repondu_le IS NULL THEN 1 ELSE 0 END), 0) AS a_repondre FROM site_messages')->fetch();
    $tous = (int) ($l['tous'] ?? 0);
    $a = (int) ($l['a_repondre'] ?? 0);
    return ['a_repondre' => $a, 'repondus' => $tous - $a, 'montres_a_repondre' => min($a, MESSAGES_A_REPONDRE_MONTRES),
        'montres_repondus' => min($tous - $a, MESSAGES_REPONDUS_MONTRES)];
}


function marquer_message(string $id, string $action): bool
{
    $q = bd()->prepare('SELECT photos FROM site_messages WHERE id = ?');
    $q->execute([$id]);
    $l = $q->fetch();
    if (!$l) return false;
    if ($action === 'supprimer') {
        foreach ((array) json_decode((string) $l['photos'], true) as $nom) {
            if (preg_match('/^[0-9a-f-]{36}-\d\.bin$/', (string) $nom)) @unlink(dossier_messages() . '/' . $nom);
        }
        bd()->prepare('DELETE FROM site_messages WHERE id = ?')->execute([$id]);
        return true;
    }
    bd()->prepare('UPDATE site_messages SET repondu_le = ? WHERE id = ?')->execute([$action === 'repondu' ? iso() : null, $id]);
    return true;
}

function photo_message(string $id, int $n): ?string
{
    if (!preg_match('/^[0-9a-f-]{36}$/', $id) || $n < 1 || $n > 3) return null;
    $f = dossier_messages() . '/' . $id . '-' . $n . '.bin';
    return is_file($f) ? dechiffrer_octets((string) file_get_contents($f)) : null;
}


function servir_image(string $octets): void
{
    $i = @getimagesizefromstring($octets);
    header('Content-Type: ' . (is_array($i) && in_array($i[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true) ? $i['mime'] : 'application/octet-stream'));
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    header('Content-Length: ' . strlen($octets));
    echo $octets;
    exit;
}


function sous_la_limite(string $nom, int $max): bool
{
    return compter_si_possible($nom, $max) !== null;
}



function compter_du_jour(string $nom): int
{
    return (int) compter_si_possible($nom, null);
}








function compter_si_possible(string $nom, ?int $max): ?int
{
    $jour = aujourdhui();
    for ($essai = 1; ; $essai++) {
        try {
            return transaction(function (PDO $bd) use ($nom, $max, $jour) {
                $bd->prepare(est_sqlite($bd)
                    ? 'INSERT INTO espace_compteurs (nom, jour, n) VALUES (?, ?, 0) ON CONFLICT(nom) DO NOTHING'
                    : 'INSERT INTO espace_compteurs (nom, jour, n) VALUES (?, ?, 0) ON DUPLICATE KEY UPDATE nom = nom')->execute([$nom, $jour]);
                $q = $bd->prepare('SELECT jour, n FROM espace_compteurs WHERE nom = ?' . pour_maj());
                $q->execute([$nom]);
                $t = $q->fetch();
                $n = $t && $t['jour'] === $jour ? (int) $t['n'] : 0;
                if ($max !== null && $n >= $max) return null;
                $bd->prepare('UPDATE espace_compteurs SET jour = ?, n = ? WHERE nom = ?')->execute([$jour, $n + 1, $nom]);
                return $n + 1;
            });
        } catch (PDOException $e) {
            if ($essai >= 2 || (string) $e->getCode() !== '40001') throw $e;
        }
    }
}



function decompter(string $nom): void
{
    bd()->prepare('UPDATE espace_compteurs SET n = n - 1 WHERE nom = ? AND jour = ? AND n > 0')->execute([$nom, aujourdhui()]);
}




function inscrire_alerte(string $email, string $langue): string
{
    $q = bd()->prepare('SELECT * FROM site_alertes WHERE email = ?');
    $q->execute([$email]);
    $l = $q->fetch();
    if ($l && $l['confirme_le']) return 'ok';
    if ($l && $l['demande_le'] > iso(ms() - 86400000)) return 'ok';
    if (!sous_la_limite('al:' . empreinte_ip(), CONFIRMATIONS_PAR_APPAREIL)) return 'trop';
    if (!sous_la_limite('alertes-confirmations', CONFIRMATIONS_PAR_JOUR)) {
        alerter_malik('plafond-alertes', 'Alerte prix : plafond du jour atteint', 'Plus d\'inscription à l\'alerte prix jusqu\'à demain : beaucoup de demandes aujourd\'hui.');
        return 'trop';
    }
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



function envoyer_alertes_en_attente(): void
{
    if (nuit_a_paris()) return;
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




            try {
                mail_alerte_prix($l['email'], $l['langue'], $l['jeton'], $prix);
            } catch (Throwable $e) {
                decompter('alertes-envoyees');
                journaliser('alerte prix pas partie (elle repartira au passage suivant) : ' . resume_erreur($e));
                return;
            }
            bd()->prepare('UPDATE site_alertes SET prevenir = NULL, prevenu_le = ? WHERE email = ?')->execute([iso(), $l['email']]);
        }
    });
}




const ENTREPRISES_ESSAI = [
    ['nom' => 'ESSAI DECOLLETAGE (site d\'essai)', 'siret' => '00000000100011', 'adresse' => '1 Rue des Essais', 'cp' => '01000', 'ville' => 'Bourg-en-Bresse'],
    ['nom' => 'ESSAI TOURNAGE (site d\'essai)', 'siret' => '00000000200012', 'adresse' => '2 Avenue des Essais', 'cp' => '74300', 'ville' => 'Cluses'],
    ['nom' => 'ESSAI OUTILLAGE (site d\'essai)', 'siret' => '00000000300013', 'adresse' => '', 'cp' => '69001', 'ville' => 'Lyon'],
];


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


function chercher_entreprises(string $q): array
{


    if (mode_essai()) return ENTREPRISES_ESSAI;
    $chiffres = (string) preg_replace('/\s/', '', $q);
    $texte = preg_match('/^\d{9}(\d{5})?$/', $chiffres) ? $chiffres : $q;
    $url = 'https://recherche-entreprises.api.gouv.fr/search?q=' . rawurlencode(coupe($texte, 100))
        . '&per_page=6&etat_administratif=A&minimal=true&include=siege';
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true, CURLOPT_CONNECTTIMEOUT => 3, CURLOPT_TIMEOUT => 5,
        CURLOPT_HTTPHEADER => ['Accept: application/json', 'User-Agent: AinRecycling-site/1.0 (+https://ainrecycling.com)'],
    ]);

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



function compter_visite(string $page, string $source): void
{
    $bd = bd();
    $sql = est_sqlite($bd)
        ? 'INSERT INTO site_visites (jour, page, source, n) VALUES (?, ?, ?, 1) ON CONFLICT(jour, page, source) DO UPDATE SET n = n + 1'
        : 'INSERT INTO site_visites (jour, page, source, n) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE n = n + 1';
    $bd->prepare($sql)->execute([jour_paris(), $page, $source]);
}



function page_visitee($x): ?string
{
    $p = is_string($x) ? (string) parse_url($x, PHP_URL_PATH) : '';
    $p = (string) preg_replace('#/index\.html$#', '/', $p);
    if (!preg_match('#^/((de|en|it|es)/)?([a-z0-9-]+\.html)?$#', $p)) return null;

    return is_file(dirname(__DIR__, 2) . (substr($p, -1) === '/' ? $p . 'index.html' : $p)) ? $p : null;
}




function retirer_visites_inventees(): void
{
    $fait = prive() . '/visites-inventees.ok';
    if (is_file($fait)) return;

    $racine = dirname(__DIR__, 2);
    $vraies = [];
    foreach (['', 'de/', 'en/', 'it/', 'es/'] as $l) {
        foreach (glob($racine . '/' . $l . '*.html') ?: [] as $f) {
            $nom = basename($f);
            if (preg_match('/^[a-z0-9-]+\.html$/', $nom)) $vraies[] = '/' . $l . ($nom === 'index.html' ? '' : $nom);
        }
    }
    if (!in_array('/', $vraies, true)) throw new RuntimeException('pages du site introuvables');
    $bd = bd();
    $sql = 'DELETE FROM site_visites WHERE page <> ? AND page NOT IN (' . implode(', ', array_fill(0, count($vraies), '?')) . ')';
    $n = 0;
    if (est_sqlite($bd)) {
        $q = $bd->prepare($sql);
        $q->execute(['(visiteurs)', ...$vraies]);
        $n = $q->rowCount();
    } else {

        $q = $bd->prepare($sql . ' LIMIT 2000');
        do {
            $q->execute(['(visiteurs)', ...$vraies]);
            $n += $k = $q->rowCount();
        } while ($k === 2000);
    }
    journaliser("ménage (une seule fois) : $n ligne(s) de pages vues effacée(s) (pages qui n'existent pas sur le site)");
    @file_put_contents($fait, gmdate('c'));
}


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


function sommes_visites(string $sql, array $params): array
{
    $q = bd()->prepare($sql);
    $q->execute($params);
    return array_map('intval', $q->fetchAll(PDO::FETCH_KEY_PAIR));
}



function visites_du_mois(string $mois): array
{
    $p = [$mois . '-%'];
    $q = bd()->prepare("SELECT COALESCE(SUM(n), 0) FROM site_visites WHERE jour LIKE ? AND page <> '(visiteurs)'");
    $q->execute($p);
    $total = (int) $q->fetchColumn();
    $pages = sommes_visites("SELECT page, SUM(n) AS total FROM site_visites WHERE jour LIKE ? AND page <> '(visiteurs)' GROUP BY page ORDER BY total DESC, page LIMIT 8", $p);
    $sources = [];
    foreach (sommes_visites("SELECT source, SUM(n) AS total FROM site_visites WHERE jour LIKE ? AND page <> '(visiteurs)' GROUP BY source ORDER BY total DESC, source", $p) as $s => $n) {
        $sources[$s === 'interne' ? 'dans le site' : $s] = $n;
    }
    return ['mois' => $mois, 'total' => $total, 'pages' => $pages, 'sources' => $sources];
}

function mois_avant(string $mois, int $n = 1): string
{
    return (new DateTimeImmutable($mois . '-15'))->modify("-$n month")->format('Y-m');
}


function visites_resume(): array
{
    $mois = substr(jour_paris(), 0, 7);
    $q = bd()->prepare("SELECT jour, SUM(n) AS n FROM site_visites WHERE jour >= ? AND source <> 'interne' AND page <> '(visiteurs)' GROUP BY jour ORDER BY jour");
    $q->execute([plus_jours(jour_paris(), -29)]);
    $jours = [];
    foreach ($q->fetchAll() as $l) $jours[$l['jour']] = (int) $l['n'];
    return ['ce_mois' => visites_du_mois($mois), 'mois_dernier' => visites_du_mois(mois_avant($mois)), 'entrees_par_jour' => $jours,
        'demandes_ce_mois' => demandes_du_mois($mois), 'demandes_mois_dernier' => demandes_du_mois(mois_avant($mois))];
}

function demandes_du_mois(string $mois): int
{

    $q = bd()->prepare('SELECT COUNT(*) FROM espace_envois e JOIN espace_comptes c ON c.id = e.compte WHERE e.cree_le LIKE ? AND c.test_le IS NULL');
    $q->execute([$mois . '-%']);
    return (int) $q->fetchColumn();
}





function connus_du_mois(string $mois): array
{
    $zero = array_fill_keys([...array_keys(CONNU), 'sans'], 0);
    $r = ['demandes' => $zero, 'messages' => $zero];
    $q = bd()->prepare('SELECT e.connu AS connu, COUNT(*) AS n FROM espace_envois e JOIN espace_comptes c ON c.id = e.compte
        WHERE e.cree_le LIKE ? AND c.test_le IS NULL GROUP BY e.connu');
    $q->execute([$mois . '-%']);
    foreach ($q->fetchAll() as $l) $r['demandes'][lire_connu($l['connu']) ?? 'sans'] += (int) $l['n'];
    $q = bd()->prepare("SELECT m.connu AS connu, COUNT(*) AS n FROM site_messages m WHERE m.cree_le LIKE ?
        AND LOWER(m.retour) NOT IN (SELECT LOWER(c.email) FROM espace_comptes c WHERE c.test_le IS NOT NULL AND c.email <> '') GROUP BY m.connu");
    $q->execute([$mois . '-%']);
    foreach ($q->fetchAll() as $l) $r['messages'][lire_connu($l['connu']) ?? 'sans'] += (int) $l['n'];
    return $r;
}




function visites_detail(): array
{
    $depuis = plus_jours(jour_paris(), -29);
    $jours = [];
    for ($i = 0; $i < 30; $i++) $jours[plus_jours($depuis, $i)] = 0;


    $p = [$depuis];
    foreach (sommes_visites("SELECT jour, SUM(n) FROM site_visites WHERE jour >= ? AND page <> '(visiteurs)' GROUP BY jour", $p) as $j => $n) {
        if (isset($jours[$j])) $jours[$j] += $n;
    }
    $pages = sommes_visites("SELECT page, SUM(n) AS total FROM site_visites WHERE jour >= ? AND page <> '(visiteurs)' GROUP BY page ORDER BY total DESC, page LIMIT 8", $p);
    $sources = sommes_visites("SELECT source, SUM(n) AS total FROM site_visites WHERE jour >= ? AND page <> '(visiteurs)' AND source <> 'interne'
        GROUP BY source ORDER BY total DESC, source LIMIT 8", $p);
    $visiteurs = ['nouveau' => 0, 'revenu' => 0];
    foreach (sommes_visites("SELECT source, SUM(n) FROM site_visites WHERE jour >= ? AND page = '(visiteurs)' GROUP BY source", $p) as $s => $n) {
        if (isset($visiteurs[$s])) $visiteurs[$s] += $n;
    }



    $mois = substr(jour_paris(), 0, 7);
    try {
        $connus = ['ce_mois' => ['mois' => $mois] + connus_du_mois($mois), 'mois_dernier' => ['mois' => mois_avant($mois)] + connus_du_mois(mois_avant($mois))];
    } catch (Throwable $e) {
        journaliser('« Comment ils nous ont connus » : ' . resume_erreur($e));
        $connus = null;
    }
    return ['jours' => $jours, 'total' => array_sum($jours), 'pages' => array_slice($pages, 0, 8, true),
        'sources' => array_slice($sources, 0, 8, true), 'visiteurs' => $visiteurs, 'connus' => $connus];
}

function menage_site(): void
{
    $auj = aujourdhui();
    bd()->prepare("DELETE FROM espace_compteurs WHERE jour < ? AND nom NOT IN ('codes', 'codes-gestion')")->execute([$auj]);

    $q = bd()->prepare('SELECT id FROM site_messages WHERE cree_le < ?');
    $q->execute([iso(ms() - (int) (3 * 365.25 * 86400000))]);
    foreach ($q->fetchAll() as $l) marquer_message((string) $l['id'], 'supprimer');
    bd()->prepare('DELETE FROM site_alertes WHERE confirme_le IS NULL AND cree_le < ?')->execute([iso(ms() - 7 * 86400000)]);
    bd()->prepare('DELETE FROM site_alertes WHERE confirme_le IS NOT NULL AND confirme_le < ?')->execute([iso(ms() - (int) (3 * 365.25 * 86400000))]);
    bd()->prepare('DELETE FROM site_visites WHERE jour < ?')->execute([mois_avant(substr(jour_paris(), 0, 7), 25) . '-01']);


    $n = nettoyer_tmp();
    if ($n) journaliser("ménage : $n fichier(s) ou dossier(s) temporaire(s) d'une sauvegarde interrompue effacé(s)");
    resume_du_mois();
}


function resume_du_mois(): void
{
    $a = (string) reglage('mail_admin', '');
    $mois = substr(jour_paris(), 0, 7);
    $f = prive() . '/resume.mois';
    if ($a === '' || @file_get_contents($f) === $mois) return;
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
        'Prix du site : ' . prix_texte(prix_site()['depot']) . ' €/kg au dépôt, ' . prix_texte(prix_site()['kg']) . ' €/kg par colis.',
    ];
    $sauve = reglage_site('sauvegarde');
    $le = is_array($sauve) ? (string) ($sauve['le'] ?? '') : '';
    $lignes[] = $le !== '' && $le > iso(ms() - 31 * 86400000)
        ? 'Sauvegarde des comptes clients faite le ' . date_longue(jour_paris((int) strtotime($le) * 1000), 'fr') . '.'
        : 'Pense à la sauvegarde des comptes clients (bouton « Sauvegarder » de ta page).';
    $lignes[] = 'Ce que les gens tapent dans Google pour te trouver : Google Search Console, rubrique « Performances ».';
    mail_resume_mois($a, "Le site en $nomMois", $lignes, adresse_site() . '/gestion/');


    @file_put_contents($f, $mois, LOCK_EX);
}



function drapeau_prix(float $kg, ?float $depot = null): void
{
    $f = dirname(__DIR__, 2) . '/.prix-change';

    if (abs($kg - PRIX_PAGES) > 0.001 || abs(($depot ?? $kg + ECART_DEPOT) - (PRIX_PAGES + ECART_DEPOT)) > 0.001) @touch($f);
    elseif (is_file($f)) @unlink($f);
}
