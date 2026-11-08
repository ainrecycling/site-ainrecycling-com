<?php
declare(strict_types=1);

require_once __DIR__ . '/base.php';

// E-mails du site, envoyés par Resend (même compte et même domaine que l'appli : contact@ainrecycling.com).
// Essai sur l'ordinateur : rien ne part, le message est écrit dans le journal (journal/mails.log du dossier privé).
// Depuis le 8 nov. 2026 (proposition 51, « des e-mails à tes couleurs ») : tous les e-mails ont le même cadre, lisible sur
// téléphone : logo, trait bleu marine, texte, bouton, et en bas les coordonnées et les numéros de la société, dans la langue
// de la personne. Jamais de pièce d'identité ni de RIB dedans.

function echapper(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** $entetes : en-têtes en plus (ex. List-Unsubscribe de l'alerte prix). */
function envoyer_mail(string $a, string $sujet, string $html, string $texte, array $cci = [], array $entetes = []): void
{
    if (mode_essai()) {
        $d = prive() . '/journal';
        if (!is_dir($d)) @mkdir($d, 0700, true);
        $ligne = '[' . iso() . "] à $a : $sujet\n$texte\n----\n";
        @file_put_contents("$d/mails.log", $ligne, FILE_APPEND | LOCK_EX);
        // le dernier e-mail en HTML, pour le regarder dans un navigateur pendant les essais
        @file_put_contents("$d/dernier-mail.html", $html, LOCK_EX);
        error_log("[essai, rien n'est parti] mail à $a : $sujet | " . str_replace("\n", ' | ', $texte));
        return;
    }
    $cle = (string) reglage('resend_cle', '');
    if ($cle === '') throw new RuntimeException('clé Resend absente');
    $corps = [
        'from' => (string) reglage('expediteur', 'Ain Recycling <contact@ainrecycling.com>'),
        'to' => [trim($a)],
        'subject' => $sujet,
        'html' => $html,
        'text' => $texte,
    ];
    if ($cci) $corps['bcc'] = array_values($cci);
    if ($entetes) $corps['headers'] = $entetes;
    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $cle, 'Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($corps, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 15,
    ]);
    $r = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    if ($r === false || $code < 200 || $code >= 300) {
        throw new RuntimeException('mail non parti (' . $code . ' ' . curl_error($ch) . ' ' . coupe((string) $r, 200) . ')');
    }
}

// ---------- adresses, dates et nombres dans la langue de la personne ----------
function adresse_site(): string
{
    return rtrim((string) reglage('adresse_site', 'https://ainrecycling.com'), '/');
}

/** Une page du site dans la langue de la personne : https://ainrecycling.com/de/espace-client.html… */
function lien_page(string $langue, string $page = ''): string
{
    return adresse_site() . '/' . ($langue === 'fr' ? '' : $langue . '/') . $page;
}

const MOIS = [
    'fr' => ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
    'de' => ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    'en' => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    'it' => ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'],
    'es' => ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
];

/** « 2026-11-15 » → « 15 novembre 2026 », « 15. November 2026 », « 15 de noviembre de 2026 »… */
function date_longue(string $ymd, string $langue): string
{
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $ymd, $m)) return $ymd;
    $j = (int) $m[3];
    $mois = (MOIS[$langue] ?? MOIS['fr'])[(int) $m[2] - 1];
    switch ($langue) {
        case 'de': return "$j. $mois {$m[1]}";
        case 'es': return "$j de $mois de {$m[1]}";
        case 'fr': return ($j === 1 ? '1er' : (string) $j) . " $mois {$m[1]}";
        default: return "$j $mois {$m[1]}";
    }
}

/** Poids écrit comme l'appli : « 12,5 » (« 12.5 » en anglais). */
function kg_texte(float $kg, string $langue = 'fr'): string
{
    $s = rtrim(rtrim(number_format($kg, 1, '.', ''), '0'), '.');
    return $langue === 'en' ? $s : str_replace('.', ',', $s);
}

/** Prix au kilo : « 47 », « 47,5 » (« 47.5 » en anglais). */
function prix_texte(float $prix, string $langue = 'fr'): string
{
    $s = rtrim(rtrim(number_format($prix, 2, '.', ''), '0'), '.');
    return $langue === 'en' ? $s : str_replace('.', ',', $s);
}

// ---------- le cadre commun ----------
const PIED_MAIL = [
    'fr' => ['SASU au capital de 1 000 €', 'TVA', 'Rachat de carbure de tungstène'],
    'de' => ['SASU mit einem Kapital von 1 000 €', 'USt-IdNr.', 'Ankauf von Wolframkarbid'],
    'en' => ['SASU with a share capital of 1 000 €', 'VAT', 'Tungsten carbide buyer'],
    'it' => ['SASU con capitale sociale di 1 000 €', 'P. IVA', 'Acquisto di carburo di tungsteno'],
    'es' => ['SASU con un capital social de 1 000 €', 'IVA', 'Compra de carburo de tungsteno'],
];

/** Un bouton qui marche dans toutes les boîtes mail (tableau, couleurs écrites dans la balise). */
function bouton_mail(string $texte, string $lien): string
{
    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 6px"><tr>'
        . '<td bgcolor="#0e3c8a" style="border-radius:10px">'
        . '<a href="' . echapper($lien) . '" style="display:inline-block;padding:13px 22px;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:10px">'
        . echapper($texte) . '</a></td></tr></table>';
}

/** La page HTML de l'e-mail : $contenu est déjà du HTML sûr (textes passés par echapper). $bas : petite note sous le cadre. */
function mail_cadre(string $langue, string $contenu, string $bas = ''): string
{
    $p = PIED_MAIL[$langue] ?? PIED_MAIL['fr'];
    $tel = $langue === 'fr' ? '07 61 11 95 23' : '+33 7 61 11 95 23';
    $site = adresse_site();
    return '<!doctype html><html lang="' . echapper($langue) . '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        . '<meta name="color-scheme" content="light only"><title>Ain Recycling</title></head>'
        . '<body style="margin:0;padding:0;background:#f2f5f4">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f2f5f4"><tr><td align="center" style="padding:18px 10px">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #e0e7e3;border-radius:14px">'
        . '<tr><td style="padding:16px 22px 14px;border-bottom:3px solid #0e3c8a">'
        . '<a href="' . echapper($site . '/') . '"><img src="https://ainrecycling.com/logo.png" width="152" height="32" alt="Ain Recycling" style="display:block;border:0;height:32px;width:152px"></a></td></tr>'
        . '<tr><td style="padding:22px;font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#0b1526">' . $contenu . '</td></tr>'
        . '<tr><td style="padding:14px 22px;border-top:1px solid #e6eaf0;background:#f7f9fb;border-radius:0 0 14px 14px;font-family:Arial,sans-serif;font-size:12px;line-height:1.55;color:#556070">'
        . '<b style="color:#0b1526">Ain Recycling</b> · ' . echapper($p[2]) . '<br>'
        . '1 rue des Prairies, 01460 Port, France · ' . $tel . ' · <a href="mailto:contact@ainrecycling.com" style="color:#0e3c8a">contact@ainrecycling.com</a><br>'
        . echapper($p[0]) . ' · SIRET 132 041 039 00018 · RCS Bourg-en-Bresse · ' . echapper($p[1]) . ' FR58132041039'
        . '</td></tr></table>'
        . ($bas !== '' ? '<p style="max-width:560px;margin:12px auto 0;font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:#667085">' . $bas . '</p>' : '')
        . '</td></tr></table></body></html>';
}

/** Le même e-mail en texte simple (lu par les boîtes mail qui n'affichent pas le HTML). */
function pied_texte(string $langue): string
{
    $p = PIED_MAIL[$langue] ?? PIED_MAIL['fr'];
    $tel = $langue === 'fr' ? '07 61 11 95 23' : '+33 7 61 11 95 23';
    return "--\nAin Recycling · " . $p[2] . "\n1 rue des Prairies, 01460 Port, France · $tel · contact@ainrecycling.com\n"
        . $p[0] . ' · SIRET 132 041 039 00018 · RCS Bourg-en-Bresse · ' . $p[1] . ' FR58132041039';
}

// ---------- code de connexion (5 langues, comme l'appli) ----------
const MAIL_CODE = [
    'fr' => ['Votre code de connexion Ain Recycling', "Votre code pour l'espace client Ain Recycling : ", "Il est valable 10 minutes. Si vous n'avez rien demandé, ignorez ce message."],
    'de' => ['Ihr Anmeldecode für Ain Recycling', 'Ihr Code für den Kundenbereich von Ain Recycling: ', 'Er ist 10 Minuten gültig. Wenn Sie nichts angefordert haben, ignorieren Sie diese Nachricht.'],
    'en' => ['Your Ain Recycling login code', 'Your code for the Ain Recycling customer area: ', 'It is valid for 10 minutes. If you did not ask for it, please ignore this message.'],
    'it' => ['Il vostro codice di accesso Ain Recycling', "Il vostro codice per l'area clienti Ain Recycling: ", 'È valido 10 minuti. Se non avete richiesto nulla, ignorate questo messaggio.'],
    'es' => ['Su código de acceso a Ain Recycling', 'Su código para el área de clientes de Ain Recycling: ', 'Es válido durante 10 minutos. Si no ha solicitado nada, ignore este mensaje.'],
];

/** Code à 6 chiffres envoyé à la personne (espace client) ou à Malik (page de gestion, en français). */
function mail_code(string $email, string $code, string $langue, string $espace): void
{
    $gestion = $espace === 'gestion';
    $m = $gestion
        ? ['Code pour la page des demandes du site', 'Votre code pour voir les demandes du site Ain Recycling : ', "Il est valable 10 minutes. Si vous n'avez rien demandé, ne le donnez à personne."]
        : (MAIL_CODE[$langue] ?? MAIL_CODE['fr']);
    $langue = $gestion ? 'fr' : $langue;
    $lisible = substr($code, 0, 3) . ' ' . substr($code, 3);
    $contenu = '<p style="margin:0 0 6px">' . echapper(rtrim($m[1], ' :')) . '</p>'
        . '<p style="margin:14px 0;font-family:\'Courier New\',monospace;font-size:34px;font-weight:bold;letter-spacing:6px;color:#0e3c8a">' . $lisible . '</p>'
        . '<p style="margin:0;color:#475467;font-size:14px">' . echapper($m[2]) . '</p>';
    envoyer_mail($email, $m[0], mail_cadre($langue, $contenu), $m[1] . $lisible . "\n\n" . $m[2] . "\n\n" . pied_texte($langue));
}

// ---------- demande d'envoi par colis : confirmation à la personne (jamais de pièce d'identité dedans) ----------
const MAIL_ENVOI = [
    'fr' => [
        'sujet' => "Votre demande d'envoi {ref} est bien reçue", 'bonjour' => 'Bonjour {prenom}, votre demande est bien reçue.',
        'ref' => 'Votre référence', 'detail' => '{n} colis · {kg} kg environ · {paiement}', 'virement' => 'virement', 'cheque' => 'chèque',
        'garanti' => "Prix garanti : {prix} €/kg jusqu'au {date}", 'garanti2' => 'pour un colis déposé chez le transporteur au plus tard ce jour-là.',
        'suite' => 'La suite', 'etapes' => ["{b}Étiquette prépayée{/b} par e-mail sous 24 h (jours ouvrés)", '{b}Déposez{/b} le colis, avec le bordereau dedans',
            '{b}Pesée filmée{/b} à réception : le colis fermé (poids brut), puis le carbure seul (poids net)', '{b}Paiement{/b} sous 48 h (jours ouvrés) après la pesée, par {paiement}'],
        'bouton' => 'Voir ma demande', 'note' => "Glissez dans chaque colis le bordereau (à imprimer depuis votre espace client) ou un papier avec la référence {ref}.",
    ],
    'de' => [
        'sujet' => 'Ihre Versandanfrage {ref} ist eingegangen', 'bonjour' => 'Guten Tag {prenom}, Ihre Anfrage ist eingegangen.',
        'ref' => 'Ihre Referenz', 'detail' => '{n} Paket(e) · etwa {kg} kg · {paiement}', 'virement' => 'Überweisung', 'cheque' => 'Scheck',
        'garanti' => 'Garantierter Preis: {prix} €/kg bis zum {date}', 'garanti2' => 'für ein Paket, das spätestens an diesem Tag beim Versanddienst abgegeben wird.',
        'suite' => 'Wie es weitergeht', 'etapes' => ['{b}Vorausbezahltes Etikett{/b} per E-Mail innerhalb von 24 Stunden (Werktage)', '{b}Geben Sie{/b} das Paket ab, mit dem Begleitschein darin',
            '{b}Gefilmtes Wiegen{/b} bei Eingang: das geschlossene Paket (Bruttogewicht), dann das Hartmetall allein (Nettogewicht)', '{b}Zahlung{/b} innerhalb von 48 Stunden (Werktage) nach dem Wiegen, per {paiement}'],
        'bouton' => 'Meine Anfrage ansehen', 'note' => 'Legen Sie in jedes Paket den Begleitschein (in Ihrem Kundenbereich auszudrucken) oder einen Zettel mit der Referenz {ref}.',
    ],
    'en' => [
        'sujet' => 'Your shipping request {ref} has been received', 'bonjour' => 'Hello {prenom}, your request has been received.',
        'ref' => 'Your reference', 'detail' => '{n} parcel(s) · about {kg} kg · {paiement}', 'virement' => 'bank transfer', 'cheque' => 'cheque',
        'garanti' => 'Guaranteed price: {prix} €/kg until {date}', 'garanti2' => 'for a parcel handed to the carrier by that day at the latest.',
        'suite' => 'What happens next', 'etapes' => ['{b}Prepaid label{/b} by email within 24 hours (working days)', '{b}Drop off{/b} the parcel, with the slip inside',
            '{b}Filmed weighing{/b} on arrival: the closed parcel (gross weight), then the carbide alone (net weight)', '{b}Payment{/b} within 48 hours (working days) after weighing, by {paiement}'],
        'bouton' => 'View my request', 'note' => 'Put the slip (to print from your customer area) or a note with the reference {ref} in each parcel.',
    ],
    'it' => [
        'sujet' => 'La vostra richiesta di spedizione {ref} è stata ricevuta', 'bonjour' => 'Buongiorno {prenom}, la vostra richiesta è stata ricevuta.',
        'ref' => 'Il vostro riferimento', 'detail' => '{n} pacco/pacchi · circa {kg} kg · {paiement}', 'virement' => 'bonifico', 'cheque' => 'assegno',
        'garanti' => 'Prezzo garantito: {prix} €/kg fino al {date}', 'garanti2' => 'per un pacco consegnato al corriere entro quel giorno.',
        'suite' => 'I prossimi passi', 'etapes' => ['{b}Etichetta prepagata{/b} per e-mail entro 24 ore (giorni lavorativi)', '{b}Consegnate{/b} il pacco, con la distinta dentro',
            "{b}Pesatura filmata{/b} all'arrivo: il pacco chiuso (peso lordo), poi il metallo duro da solo (peso netto)", '{b}Pagamento{/b} entro 48 ore (giorni lavorativi) dopo la pesatura, con {paiement}'],
        'bouton' => 'Vedi la mia richiesta', 'note' => 'Mettete in ogni pacco la distinta (da stampare dalla vostra area clienti) o un foglio con il riferimento {ref}.',
    ],
    'es' => [
        'sujet' => 'Hemos recibido su solicitud de envío {ref}', 'bonjour' => 'Buenos días {prenom}: hemos recibido su solicitud.',
        'ref' => 'Su referencia', 'detail' => '{n} paquete(s) · unos {kg} kg · {paiement}', 'virement' => 'transferencia', 'cheque' => 'cheque',
        'garanti' => 'Precio garantizado: {prix} €/kg hasta el {date}', 'garanti2' => 'para un paquete entregado al transportista como muy tarde ese día.',
        'suite' => 'Los siguientes pasos', 'etapes' => ['{b}Etiqueta prepagada{/b} por correo electrónico en 24 horas (días laborables)', '{b}Entregue{/b} el paquete, con el albarán dentro',
            '{b}Pesaje filmado{/b} a la llegada: el paquete cerrado (peso bruto) y luego el metal duro solo (peso neto)', '{b}Pago{/b} en 48 horas (días laborables) tras el pesaje, por {paiement}'],
        'bouton' => 'Ver mi solicitud', 'note' => 'Meta en cada paquete el albarán (para imprimir desde su área de clientes) o un papel con la referencia {ref}.',
    ],
];

/** Remplace {mot} par sa valeur. */
function remplir(string $modele, array $valeurs): string
{
    return strtr($modele, array_combine(array_map(fn ($k) => '{' . $k . '}', array_keys($valeurs)), array_values($valeurs)));
}

function mail_envoi_recu(array $c, array $e): void
{
    $l = langue_mail($c['langue'] ?? 'fr');
    $t = MAIL_ENVOI[$l];
    $paiement = $e['paiement'] === 'Chèque' ? $t['cheque'] : $t['virement'];
    $v = ['ref' => $e['reference'], 'prenom' => $c['prenom'], 'n' => (string) count($e['colis']), 'kg' => kg_texte((float) $e['total'], $l), 'paiement' => $paiement];
    $prix = $e['prix_kg'] ?? null;
    $garanti = $prix && !empty($e['garanti_jusqu'])
        ? remplir($t['garanti'], ['prix' => prix_texte((float) $prix, $l), 'date' => date_longue((string) $e['garanti_jusqu'], $l)]) : '';

    $html = '<p style="margin:0 0 14px">' . echapper(remplir($t['bonjour'], $v)) . '</p>'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="border:2px solid #0e3c8a;border-radius:10px;padding:10px 12px">'
        . '<div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#667085">' . echapper($t['ref']) . '</div>'
        . '<div style="font-family:\'Courier New\',monospace;font-size:24px;font-weight:bold;color:#0e3c8a;line-height:1.3">' . echapper($e['reference']) . '</div>'
        . '<div style="font-size:14px;color:#475467">' . echapper(remplir($t['detail'], $v)) . '</div></td></tr></table>';
    if ($garanti !== '') {
        $html .= '<p style="margin:14px 0 0;padding:10px 12px;border-radius:10px;background:#e3f3ea;color:#13704a"><b>' . echapper($garanti) . '</b>, '
            . echapper($t['garanti2']) . '</p>';
    }
    $html .= '<p style="margin:18px 0 6px;font-weight:bold">' . echapper($t['suite']) . '</p><ol style="margin:0;padding-left:22px;color:#344054">';
    foreach ($t['etapes'] as $etape) {
        $html .= '<li style="margin:0 0 6px">' . str_replace(['{b}', '{/b}'], ['<b>', '</b>'], echapper(remplir($etape, $v))) . '</li>';
    }
    $html .= '</ol>' . bouton_mail($t['bouton'], lien_page($l, 'espace-client.html'))
        . '<p style="margin:12px 0 0;font-size:14px;color:#475467">' . echapper(remplir($t['note'], $v)) . '</p>';

    $texte = [remplir($t['bonjour'], $v), $t['ref'] . ' : ' . $e['reference'] . ' (' . remplir($t['detail'], $v) . ')'];
    if ($garanti !== '') $texte[] = $garanti . ', ' . $t['garanti2'];
    $texte[] = $t['suite'] . "\n" . implode("\n", array_map(fn ($x, $i) => ($i + 1) . '. ' . str_replace(['{b}', '{/b}'], '', remplir($x, $v)), $t['etapes'], array_keys($t['etapes'])));
    $texte[] = $t['bouton'] . ' : ' . lien_page($l, 'espace-client.html');
    $texte[] = remplir($t['note'], $v);
    envoyer_mail($c['email'], remplir($t['sujet'], $v), mail_cadre($l, $html), implode("\n\n", $texte) . "\n\n" . pied_texte($l));
}

function langue_mail($x): string
{
    return in_array($x, ['fr', 'de', 'en', 'it', 'es'], true) ? $x : 'fr';
}

/** E-mail à Malik pour chaque nouvelle demande : qui, d'où, combien, le prix garanti et le lien de la page des demandes.
 *  Ni pièce d'identité ni IBAN dans l'e-mail : ils restent sur la page réservée. */
function mail_nouvelle_demande(array $c, array $e): void
{
    $a = (string) reglage('mail_admin', '');
    if ($a === '') return;
    $personne = majuscules($c['nom']) . ' ' . $c['prenom'];
    $nom = $c['profil'] === 'professionnel' ? $c['entreprise'] . " ($personne)" : $personne;
    $quand = (new DateTime('now', new DateTimeZone('Europe/Paris')))->format('d/m/Y à H\hi');
    $lignes = [
        "Nouvelle demande d'envoi par colis sur le site : " . $e['reference'] . " (le $quand).",
        "$nom, " . $c['cp'] . ' ' . $c['ville'] . ($c['telephone'] !== '' ? ' · ' . $c['telephone'] : '') . ' · ' . $c['email'],
        implode(' · ', array_map(fn ($x) => $x['matiere'] . ' : ' . kg_texte((float) $x['poids']) . ' kg', $e['colis'])),
        count($e['colis']) . ' colis · ' . kg_texte((float) $e['total']) . ' kg environ · paiement par ' . ($e['paiement'] === 'Chèque' ? 'chèque' : 'virement'),
    ];
    if (!empty($e['prix_kg']) && !empty($e['garanti_jusqu'])) {
        $lignes[] = 'Prix garanti : ' . prix_texte((float) $e['prix_kg']) . " €/kg jusqu'au " . date_longue((string) $e['garanti_jusqu'], 'fr') . '.';
    }
    if ($e['message'] !== '') $lignes[] = 'Message : « ' . $e['message'] . ' »';
    $lien = adresse_site() . '/gestion/#' . $e['reference'];
    $html = implode('', array_map(fn ($l) => '<p style="margin:0 0 10px">' . echapper($l) . '</p>', $lignes))
        . bouton_mail('Voir la demande', $lien)
        . '<p style="margin:10px 0 0;font-size:14px;color:#475467">Pièce d\'identité, RIB et étiquette : sur ta page des demandes.</p>';
    envoyer_mail($a, "📦 Demande d'envoi " . $e['reference'] . " : $nom", mail_cadre('fr', $html), implode("\n\n", [...$lignes, "Pièce d'identité, RIB et étiquette : $lien"]));
}

// ---------- alerte prix (proposition 56) ----------
const MAIL_ALERTE = [
    'fr' => [
        'sujet_ok' => 'Confirmez votre alerte prix Ain Recycling',
        'texte_ok' => 'Vous avez demandé à être prévenu quand notre prix du carbure monte. Pour confirmer, appuyez sur le bouton :',
        'bouton_ok' => 'Oui, me prévenir', 'note_ok' => "Si vous n'avez rien demandé, ignorez ce message : vous ne recevrez rien d'autre.",
        'sujet' => 'Notre prix monte : {prix} €/kg',
        'texte' => 'Bonne nouvelle : notre prix par colis passe à {prix} €/kg pour les plaquettes, forets et fraises carbure, étiquette offerte.',
        'texte2' => "Faites votre demande : le prix vous est garanti 7 jours, jusqu'à la fin du mois au plus tard.",
        'bouton' => 'Faire ma demande', 'pourquoi' => "Vous recevez cet e-mail parce que vous avez demandé l'alerte prix sur ainrecycling.com.",
        'stop' => "Ne plus recevoir l'alerte prix",
    ],
    'de' => [
        'sujet_ok' => 'Bestätigen Sie Ihren Preisalarm bei Ain Recycling',
        'texte_ok' => 'Sie möchten benachrichtigt werden, wenn unser Hartmetallpreis steigt. Zum Bestätigen tippen Sie auf die Schaltfläche:',
        'bouton_ok' => 'Ja, benachrichtigen', 'note_ok' => 'Wenn Sie nichts angefordert haben, ignorieren Sie diese Nachricht: Sie erhalten nichts weiter.',
        'sujet' => 'Unser Preis steigt: {prix} €/kg',
        'texte' => 'Gute Nachricht: Unser Preis per Paket steigt auf {prix} €/kg für Wendeschneidplatten, Bohrer und Fräser aus Hartmetall, Etikett gratis.',
        'texte2' => 'Stellen Sie Ihre Anfrage: Der Preis ist Ihnen 7 Tage garantiert, längstens bis zum Monatsende.',
        'bouton' => 'Anfrage stellen', 'pourquoi' => 'Sie erhalten diese E-Mail, weil Sie auf ainrecycling.com den Preisalarm angefordert haben.',
        'stop' => 'Preisalarm abbestellen',
    ],
    'en' => [
        'sujet_ok' => 'Confirm your Ain Recycling price alert',
        'texte_ok' => 'You asked to be told when our carbide price goes up. To confirm, tap the button:',
        'bouton_ok' => 'Yes, alert me', 'note_ok' => 'If you did not ask for this, ignore this message: you will not receive anything else.',
        'sujet' => 'Our price is going up: {prix} €/kg',
        'texte' => 'Good news: our parcel price goes up to {prix} €/kg for carbide inserts, drills and end mills, with a free label.',
        'texte2' => 'Make your request: the price is guaranteed for 7 days, until the end of the month at the latest.',
        'bouton' => 'Make my request', 'pourquoi' => 'You are receiving this email because you asked for the price alert on ainrecycling.com.',
        'stop' => 'Stop the price alert',
    ],
    'it' => [
        'sujet_ok' => 'Confermate il vostro avviso di prezzo Ain Recycling',
        'texte_ok' => 'Avete chiesto di essere avvisati quando il nostro prezzo del metallo duro sale. Per confermare, premete il pulsante:',
        'bouton_ok' => 'Sì, avvisatemi', 'note_ok' => 'Se non avete richiesto nulla, ignorate questo messaggio: non riceverete altro.',
        'sujet' => 'Il nostro prezzo sale: {prix} €/kg',
        'texte' => 'Buone notizie: il nostro prezzo con pacco sale a {prix} €/kg per inserti, punte e frese in metallo duro, con etichetta gratuita.',
        'texte2' => 'Fate la vostra richiesta: il prezzo è garantito 7 giorni, al più tardi fino alla fine del mese.',
        'bouton' => 'Fare la mia richiesta', 'pourquoi' => "Ricevete questa e-mail perché avete chiesto l'avviso di prezzo su ainrecycling.com.",
        'stop' => "Non ricevere più l'avviso di prezzo",
    ],
    'es' => [
        'sujet_ok' => 'Confirme su alerta de precio de Ain Recycling',
        'texte_ok' => 'Ha pedido que le avisemos cuando suba nuestro precio del metal duro. Para confirmar, pulse el botón:',
        'bouton_ok' => 'Sí, avisarme', 'note_ok' => 'Si no ha pedido nada, ignore este mensaje: no recibirá nada más.',
        'sujet' => 'Nuestro precio sube: {prix} €/kg',
        'texte' => 'Buenas noticias: nuestro precio por paquete sube a {prix} €/kg para plaquitas, brocas y fresas de metal duro, con etiqueta gratuita.',
        'texte2' => 'Haga su solicitud: el precio está garantizado 7 días, como máximo hasta final de mes.',
        'bouton' => 'Hacer mi solicitud', 'pourquoi' => 'Recibe este correo porque pidió la alerta de precio en ainrecycling.com.',
        'stop' => 'Dejar de recibir la alerta de precio',
    ],
];

/** E-mail « confirmez votre alerte » (le lien ouvre le site, où la personne appuie pour confirmer). */
function mail_alerte_confirmer(string $email, string $langue, string $jeton): void
{
    $l = langue_mail($langue);
    $t = MAIL_ALERTE[$l];
    $lien = lien_page($l) . '?alerte=confirmer&j=' . $jeton . '#alerte';
    $html = '<p style="margin:0">' . echapper($t['texte_ok']) . '</p>' . bouton_mail($t['bouton_ok'], $lien)
        . '<p style="margin:12px 0 0;font-size:14px;color:#475467">' . echapper($t['note_ok']) . '</p>';
    envoyer_mail($email, $t['sujet_ok'], mail_cadre($l, $html), $t['texte_ok'] . "\n" . $lien . "\n\n" . $t['note_ok'] . "\n\n" . pied_texte($l));
}

/** E-mail « notre prix monte », avec le lien de désinscription (et l'en-tête qui donne le bouton « Se désabonner »). */
function mail_alerte_prix(string $email, string $langue, string $jeton, float $prix): void
{
    $l = langue_mail($langue);
    $t = MAIL_ALERTE[$l];
    $p = prix_texte($prix, $l);
    $stop = lien_page($l) . '?alerte=stop&j=' . $jeton . '#alerte';
    $direct = adresse_site() . '/api/site/alerte/desinscrire?j=' . $jeton;
    $html = '<p style="margin:0 0 10px;font-size:18px"><b>' . echapper(remplir($t['sujet'], ['prix' => $p])) . '</b></p>'
        . '<p style="margin:0 0 10px">' . echapper(remplir($t['texte'], ['prix' => $p])) . '</p>'
        . '<p style="margin:0">' . echapper($t['texte2']) . '</p>'
        . bouton_mail($t['bouton'], lien_page($l, 'espace-client.html#envoi'));
    $bas = echapper($t['pourquoi']) . ' <a href="' . echapper($stop) . '" style="color:#0e3c8a">' . echapper($t['stop']) . '</a>';
    $texte = remplir($t['texte'], ['prix' => $p]) . "\n\n" . $t['texte2'] . "\n\n" . $t['bouton'] . ' : ' . lien_page($l, 'espace-client.html#envoi')
        . "\n\n" . pied_texte($l) . "\n\n" . $t['pourquoi'] . "\n" . $t['stop'] . ' : ' . $stop;
    envoyer_mail($email, remplir($t['sujet'], ['prix' => $p]), mail_cadre($l, $html, $bas), $texte, [],
        ['List-Unsubscribe' => '<' . $direct . '>', 'List-Unsubscribe-Post' => 'List-Unsubscribe=One-Click']);
}

// ---------- résumé du mois pour Malik (proposition 57) ----------
function mail_resume_mois(string $a, string $sujet, array $lignes, string $lien): void
{
    $html = '<p style="margin:0 0 12px;font-size:18px"><b>' . echapper($sujet) . '</b></p><ul style="margin:0;padding-left:20px;color:#344054">'
        . implode('', array_map(fn ($l) => '<li style="margin:0 0 6px">' . echapper($l) . '</li>', $lignes)) . '</ul>'
        . bouton_mail('Ouvrir ma page du site', $lien);
    envoyer_mail($a, $sujet, mail_cadre('fr', $html), $sujet . "\n\n- " . implode("\n- ", $lignes) . "\n\n" . $lien);
}
