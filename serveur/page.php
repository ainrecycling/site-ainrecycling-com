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
    $p = prix_site();
    $kg = (float) $p['kg'];
    $depot = (float) $p['depot'];
    $fin = strpos($html, '</head>');


    if ($fin !== false && (abs($kg - PRIX_PAGES) > 0.001 || abs($depot - (PRIX_PAGES + ECART_DEPOT)) > 0.001)) {
        $virgule = str_starts_with($f, 'en/') ? '.' : ',';
        $ecrire = fn (float $x) => rtrim(rtrim(number_format($x, 2, $virgule, ''), '0'), $virgule);
        $nouveaux = [(string) (int) PRIX_PAGES => $ecrire($kg), (string) (int) (PRIX_PAGES + ECART_DEPOT) => $ecrire($depot)];
        $tete = preg_replace_callback('/(^|[^\d.,])(' . implode('|', array_keys($nouveaux)) . ')(?=[\s\x{00a0}\x{202f}]?€)/mu',
            fn ($m) => $m[1] . $nouveaux[$m[2]], substr($html, 0, $fin));

        if (is_string($tete)) $html = (string) preg_replace('/<html\b/', '<html data-prix-tete', $tete, 1) . substr($html, $fin);
    }
} catch (Throwable $e) {

}
header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-cache');
echo $html;
