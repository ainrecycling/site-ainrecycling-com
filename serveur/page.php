<?php
declare(strict_types=1);




require __DIR__ . '/lib/espace.php';

$f = (string) ($_GET['f'] ?? '');
$racine = dirname(__DIR__);
if (!preg_match('#^(?:(?:de|en|it|es)/)?[a-z0-9-]+\.html$#', $f) || !is_file("$racine/$f")) {
    http_response_code(404);
    header('Content-Type: text/html; charset=UTF-8');
    $l = preg_match('#^(de|en|it|es)/#', $f, $m) ? $m[1] . '/' : '';
    readfile(is_file("$racine/{$l}404.html") ? "$racine/{$l}404.html" : "$racine/404.html");
    exit;
}
$html = (string) file_get_contents("$racine/$f");
try {
    $kg = (float) prix_site()['kg'];
    $fin = strpos($html, '</head>');
    if ($fin !== false && abs($kg - PRIX_PAGES) > 0.001) {
        $virgule = str_starts_with($f, 'en/') ? '.' : ',';
        $prix = rtrim(rtrim(number_format($kg, 2, $virgule, ''), '0'), $virgule);
        $tete = preg_replace('/(^|[^\d.,])' . PRIX_PAGES . '(?=[\s\x{00a0}\x{202f}]?€)/mu', '${1}' . $prix, substr($html, 0, $fin));
        if (is_string($tete)) $html = $tete . substr($html, $fin);
    }
} catch (Throwable $e) {

}
header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-cache');
echo $html;
