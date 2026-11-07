<?php
declare(strict_types=1);

require_once __DIR__ . '/base.php';

// E-mails du site, envoyés par Resend (même compte et même domaine que l'appli : contact@ainrecycling.com).
// Essai sur l'ordinateur : rien ne part, le message est écrit dans le journal (journal/mails.log du dossier privé).

function echapper(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function envoyer_mail(string $a, string $sujet, string $html, string $texte, array $cci = []): void
{
    if (mode_essai()) {
        $d = prive() . '/journal';
        if (!is_dir($d)) @mkdir($d, 0700, true);
        $ligne = '[' . iso() . "] à $a : $sujet\n$texte\n----\n";
        @file_put_contents("$d/mails.log", $ligne, FILE_APPEND | LOCK_EX);
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
    $m = $espace === 'gestion'
        ? ['Code pour la page des demandes du site', 'Votre code pour voir les demandes du site Ain Recycling : ', "Il est valable 10 minutes. Si vous n'avez rien demandé, ne le donnez à personne."]
        : (MAIL_CODE[$langue] ?? MAIL_CODE['fr']);
    $lisible = substr($code, 0, 3) . ' ' . substr($code, 3);
    $html = '<div style="font-family:Arial,sans-serif;font-size:16px;color:#0b1526"><p>' . echapper(rtrim($m[1], ' :')) . '</p>'
        . '<p style="font-size:30px;font-weight:bold;letter-spacing:6px;color:#0e3c8a;margin:18px 0">' . $lisible . '</p>'
        . '<p style="color:#475467">' . echapper($m[2]) . '</p><p>Ain Recycling</p></div>';
    envoyer_mail($email, $m[0], $html, $m[1] . $lisible . "\n\n" . $m[2] . "\n\nAin Recycling");
}

// ---------- demande d'envoi par colis : confirmation à la personne (jamais de pièce d'identité dedans) ----------
function textes_envoi_recu(string $langue, string $p, string $r, int $n, string $kg): array
{
    switch ($langue) {
        case 'de':
            return ["Ihre Versandanfrage $r ist eingegangen", ["Guten Tag $p,", "wir haben Ihre Anfrage für den Versand per Paket erhalten ($n Paket(e), etwa $kg kg), Referenz $r.", 'Wir schicken Ihnen das vorausbezahlte Etikett per E-Mail: Der Versand geht auf unsere Kosten.', "Legen Sie in jedes Paket einen Zettel mit der Referenz $r oder drucken Sie Ihren Begleitschein in Ihrem Kundenbereich aus.", 'Die Zahlung erfolgt nach dem Wiegen, per Überweisung oder Scheck.']];
        case 'en':
            return ["Your shipping request $r has been received", ["Hello $p,", "We have received your request to send by parcel ($n parcel(s), about $kg kg), reference $r.", 'We will email you the prepaid label: shipping is paid by us.', "Put a note with the reference $r in each parcel, or print your slip from your customer area.", 'Payment follows the weighing, by bank transfer or cheque.']];
        case 'it':
            return ["La vostra richiesta di spedizione $r è stata ricevuta", ["Buongiorno $p,", "abbiamo ricevuto la vostra richiesta di spedizione con pacco ($n pacco/pacchi, circa $kg kg), riferimento $r.", "Vi inviamo l'etichetta prepagata per e-mail: il trasporto è a nostro carico.", "Mettete in ogni pacco un foglio con il riferimento $r, oppure stampate la distinta dalla vostra area clienti.", 'Il pagamento segue la pesatura, con bonifico o assegno.']];
        case 'es':
            return ["Hemos recibido su solicitud de envío $r", ["Buenos días $p:", "Hemos recibido su solicitud de envío por paquete ($n paquete(s), unos $kg kg), referencia $r.", 'Le enviaremos la etiqueta prepagada por correo electrónico: el transporte corre de nuestra cuenta.', "Meta en cada paquete un papel con la referencia $r, o imprima su albarán desde su área de clientes.", 'El pago se hace tras el pesaje, por transferencia o cheque.']];
        default:
            return ["Votre demande d'envoi $r est bien reçue", ["Bonjour $p,", "Nous avons bien reçu votre demande d'envoi par colis ($n colis, $kg kg environ), référence $r.", "Nous vous envoyons l'étiquette prépayée par e-mail : le transport est à notre charge.", "Glissez dans chaque colis un papier avec la référence $r, ou imprimez votre bordereau depuis votre espace client.", 'Le paiement suit la pesée, par virement ou par chèque.']];
    }
}

/** Poids écrit comme l'appli : « 12,5 » (« 12.5 » en anglais). */
function kg_texte(float $kg, string $langue = 'fr'): string
{
    $s = rtrim(rtrim(number_format($kg, 1, '.', ''), '0'), '.');
    return $langue === 'en' ? $s : str_replace('.', ',', $s);
}

function mail_envoi_recu(array $c, array $e): void
{
    [$sujet, $lignes] = textes_envoi_recu($c['langue'], $c['prenom'], $e['reference'], count($e['colis']), kg_texte((float) $e['total'], $c['langue']));
    $html = '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#0b1526">'
        . implode('', array_map(fn ($l) => '<p>' . echapper($l) . '</p>', $lignes)) . '<p>Ain Recycling</p></div>';
    envoyer_mail($c['email'], $sujet, $html, implode("\n\n", [...$lignes, '', 'Ain Recycling']));
}

/** E-mail à Malik pour chaque nouvelle demande : qui, d'où, combien, et le lien de la page des demandes.
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
    if ($e['message'] !== '') $lignes[] = 'Message : « ' . $e['message'] . ' »';
    $lien = rtrim((string) reglage('adresse_site', 'https://ainrecycling.com'), '/') . '/gestion/';
    $lignes[] = "Pièce d'identité, RIB et étiquette : $lien";
    $html = '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#0b1526">'
        . implode('', array_map(fn ($l) => '<p>' . echapper($l) . '</p>', array_slice($lignes, 0, -1)))
        . '<p><a href="' . echapper($lien) . '" style="color:#0e3c8a;font-weight:bold">Voir la demande</a></p></div>';
    envoyer_mail($a, "📦 Demande d'envoi " . $e['reference'] . " : $nom", $html, implode("\n\n", $lignes));
}
