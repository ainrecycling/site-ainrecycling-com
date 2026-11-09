<?php
declare(strict_types=1);

// Les admins du site (la liste « admins » du fichier de réglages, écrite à l'installation) et le cookie de la page /gestion :
// communs à gestion.php et à la connexion avec Google (lib/google.php), qui ouvre /gestion pour l'adresse de Malik.

const COOKIE_GESTION = 'gestion';
const GESTION_JOURS = 30;

function admins(): array
{
    return array_map('strtolower', (array) reglage('admins', []));
}

function cookie_gestion(string $email): string
{
    $charge = b64url((string) json_encode(['e' => $email, 'exp' => ms() + GESTION_JOURS * 86400000]));
    return COOKIE_GESTION . "=$charge." . signer('gestion|' . $charge) . '; Path=/; HttpOnly; ' . (https() || !mode_essai() ? 'Secure; ' : '')
        . 'SameSite=Strict; Max-Age=' . (GESTION_JOURS * 86400);
}
