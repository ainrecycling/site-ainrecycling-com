<?php
declare(strict_types=1);

// Connexion avec Google (3e revue, 9 nov. 2026, propositions 68 et 74 choisies par Malik) : « Continuer avec Google » sur la
// page Mon compte. Flux « code d'autorisation » avec PKCE, côté serveur seulement : aucun script de Google n'est chargé
// sur les pages du site. La clé (identifiant et code secret du client OAuth, créés par Malik dans la console Google Cloud)
// est collée par Malik sur /gestion et gardée chiffrée dans site_reglages (« google »). Google ne donne que l'e-mail vérifié,
// le prénom et le nom. Une adresse de la liste des admins ouvre /gestion (« Mode gestion »).

require_once __DIR__ . '/admins.php';

const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_JETON = 'https://oauth2.googleapis.com/token';
const GOOGLE_VERIF = 'https://oauth2.googleapis.com/tokeninfo';

/** La clé Google si Malik l'a donnée, sinon null (le bouton reste caché). */
function google_cle(): ?array
{
    $g = reglage_site('google');
    if (!is_array($g) || empty($g['client_id']) || empty($g['secret'])) return null;
    $secret = dechiffrer((string) $g['secret']);
    return $secret ? ['client_id' => (string) $g['client_id'], 'secret' => $secret] : null;
}

/** Adresse de retour, à déclarer telle quelle dans la console Google Cloud. */
function google_retour(): string
{
    return adresse_site() . '/api/espace/google/retour';
}

function google_b64(string $octets): string
{
    return rtrim(strtr(base64_encode($octets), '+/', '-_'), '=');
}

function google_aller(string $ou, ?string $cookie = null): void
{
    header('Cache-Control: no-store');
    if ($cookie !== null) header('Set-Cookie: ' . $cookie, false);
    header('Location: ' . $ou, true, 302);
    exit;
}

/** 1er pas : vers la page de Google (état et vérificateur PKCE gardés dans un cookie signé de 10 minutes). */
function google_depart(string $langue): void
{
    $k = google_cle();
    if (!$k) google_aller(lien_page($langue, 'espace-client.html') . '?google=indisponible');
    $etat = bin2hex(random_bytes(16));
    $verif = google_b64(random_bytes(32));
    $charge = b64url((string) json_encode(['s' => $etat, 'v' => $verif, 'l' => $langue, 'exp' => ms() + 600000]));
    $cookie = 'google=' . $charge . '.' . signer('google|' . $charge) . '; Path=/api/espace/google; HttpOnly; '
        . (https() || !mode_essai() ? 'Secure; ' : '') . 'SameSite=Lax; Max-Age=600';
    $q = http_build_query(['client_id' => $k['client_id'], 'redirect_uri' => google_retour(), 'response_type' => 'code',
        'scope' => 'openid email profile', 'state' => $etat, 'code_challenge' => google_b64(hash('sha256', $verif, true)),
        'code_challenge_method' => 'S256', 'prompt' => 'select_account', 'hl' => $langue]);
    google_aller(GOOGLE_AUTH . '?' . $q, $cookie);
}

/** Appel HTTPS vers Google (cURL), réponse JSON ou null. */
function google_http(string $url, ?array $post = null): ?array
{
    $ch = curl_init($url);
    $o = [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10, CURLOPT_CONNECTTIMEOUT => 5];
    if ($post !== null) { $o[CURLOPT_POST] = true; $o[CURLOPT_POSTFIELDS] = http_build_query($post); }
    if (PHP_OS_FAMILY === 'Windows' && defined('CURLSSLOPT_NATIVE_CA')) $o[CURLOPT_SSL_OPTIONS] = CURLSSLOPT_NATIVE_CA;
    curl_setopt_array($ch, $o);
    $r = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if (!is_string($r) || $code !== 200) return null;
    $j = json_decode($r, true);
    return is_array($j) ? $j : null;
}

/** 2e pas : Google revient avec un code, échangé contre l'identité vérifiée ; puis connexion (ou /gestion pour un admin). */
function google_arrivee(): void
{
    $s = lire_cookie_signe('google', 'google');
    $langue = langue_de($s['l'] ?? null);
    $efface = 'google=; Path=/api/espace/google; HttpOnly; Max-Age=0';
    $echec = lien_page($langue, 'espace-client.html') . '?google=echec';
    $k = google_cle();
    if (!$s || !$k || !hash_equals((string) $s['s'], (string) ($_GET['state'] ?? '')) || !is_string($_GET['code'] ?? null)) google_aller($echec, $efface);
    $j = google_http(GOOGLE_JETON, ['code' => $_GET['code'], 'client_id' => $k['client_id'], 'client_secret' => $k['secret'],
        'redirect_uri' => google_retour(), 'grant_type' => 'authorization_code', 'code_verifier' => (string) $s['v']]);
    $id = is_array($j) && is_string($j['id_token'] ?? null) ? google_http(GOOGLE_VERIF . '?id_token=' . rawurlencode($j['id_token'])) : null;
    if (!$id || ($id['aud'] ?? '') !== $k['client_id'] || !in_array($id['iss'] ?? '', ['accounts.google.com', 'https://accounts.google.com'], true)
        || !in_array($id['email_verified'] ?? null, [true, 'true'], true) || (int) ($id['exp'] ?? 0) < time()) google_aller($echec, $efface);
    $email = email_valide($id['email'] ?? null);
    if (!$email) google_aller($echec, $efface);
    // l'adresse de Malik (liste des admins) : « Mode gestion » (proposition 74)
    if (in_array(strtolower($email), admins(), true)) {
        header('Set-Cookie: ' . $efface, false);
        google_aller(adresse_site() . '/gestion/', cookie_gestion($email));
    }
    $c = appliquer_creation(compte_par_email($email, $langue), ['prenom' => texte($id['given_name'] ?? null, 80), 'nom' => texte($id['family_name'] ?? null, 80),
        'profil' => 'particulier', 'entreprise' => '', 'siret' => '']);
    header('Set-Cookie: ' . $efface, false);
    google_aller(lien_page($langue, 'espace-client.html') . '#accueil', cookie_session($c['id']));
}
