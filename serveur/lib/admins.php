<?php
declare(strict_types=1);




const COOKIE_GESTION = 'gestion';
const GESTION_JOURS = 30;

function admins(): array
{
    return array_map('strtolower', (array) reglage('admins', []));
}


function noter_connexion_gestion(string $email): void
{
    $ua = (string) ($_SERVER['HTTP_USER_AGENT'] ?? '');
    $appareil = preg_match('/iPhone/', $ua) ? 'iPhone' : (preg_match('/iPad/', $ua) ? 'iPad' : (preg_match('/Android/', $ua) ? 'Téléphone Android'
        : (preg_match('/Windows/', $ua) ? 'Ordinateur Windows' : (preg_match('/Macintosh/', $ua) ? 'Mac' : 'Autre appareil'))));
    $nav = preg_match('/Edg\//', $ua) ? 'Edge' : (preg_match('/Firefox\//', $ua) ? 'Firefox' : (preg_match('/Chrome\//', $ua) ? 'Chrome' : (preg_match('/Safari\//', $ua) ? 'Safari' : '')));
    $liste = (array) (reglage_site('connexions') ?? []);
    array_unshift($liste, ['le' => iso(), 'appareil' => trim($appareil . ($nav !== '' ? ' · ' . $nav : ''))]);
    ecrire_reglage_site('connexions', array_slice($liste, 0, 10), $email);
}

function cookie_gestion(string $email): string
{
    $charge = b64url((string) json_encode(['e' => $email, 'exp' => ms() + GESTION_JOURS * 86400000]));
    return COOKIE_GESTION . "=$charge." . signer('gestion|' . $charge) . '; Path=/; HttpOnly; ' . (https() || !mode_essai() ? 'Secure; ' : '')
        . 'SameSite=Strict; Max-Age=' . (GESTION_JOURS * 86400);
}
