<?php
declare(strict_types=1);







require __DIR__ . '/lib/espace.php';

$chemin = trim((string) ($_GET['chemin'] ?? ''), '/');
$methode = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    $cle = (string) reglage('cle_appli', '');
    $donnee = (string) ($_SERVER['HTTP_X_CLE_APPLI'] ?? '');
    if (strlen($cle) < 32 || !hash_equals($cle, $donnee)) refus('cle', 401);

    menage_du_jour();

    switch ("$methode $chemin") {

        case 'GET demandes':
            $etat = in_array($_GET['etat'] ?? '', ['a_traiter', 'toutes'], true) ? $_GET['etat'] : 'en_cours';
            repondre(['envois' => demandes_pour_malik($etat)]);



        case 'POST demandes':
            $b = corps_json() ?? [];
            $action = (string) ($b['action'] ?? '');
            $numero = (string) ($b['numero'] ?? '');
            if ($action === 'bon' && !preg_match('/^AR-\d{4}-\d{4,6}$/', $numero)) refus('numero');
            $connues = ['traite', 'remettre', 'bon', 'sans_bon', 'recu', 'sans_recu', 'pese', 'sans_pese', 'paye', 'sans_paye'];
            if (!in_array($action, $connues, true)) refus('action', 404);

            $e = marquer_envoi((string) ($b['envoi'] ?? ''), $action, texte($b['par'] ?? 'appli', 40) ?: 'appli', $numero,
                is_array($b['valeurs'] ?? null) ? $b['valeurs'] : []);
            if (!$e) refus($action === 'pese' ? 'poids' : 'introuvable', $action === 'pese' ? 400 : 404);
            prevenir_etape($e, $action);
            repondre(['envoi' => $e]);


        case 'POST compte':
            $b = corps_json() ?? [];
            $c = lire_compte((string) ($b['compte'] ?? ''));
            if (!$c) refus('introuvable', 404);
            $v = (string) ($b['vendeur_id'] ?? '');
            if (($b['action'] ?? '') !== 'vendeur' || ($v !== '' && !preg_match('/^[0-9a-f-]{36}$/', $v))) refus('action');
            $c['vendeur_id'] = $v !== '' ? $v : null;
            enregistrer_compte($c);
            repondre(['ok' => true]);


        case 'GET piece':
            $c = lire_compte((string) ($_GET['compte'] ?? ''));
            $face = (string) ($_GET['face'] ?? '');
            $octets = $c && in_array($face, ['recto', 'verso'], true) ? lire_photo($c['id'], $c['piece'][$face] ?? null) : null;
            if ($octets === null) refus('absente', 404);
            servir_photo($octets);

        default:
            refus('inconnu', 404);
    }
} catch (Throwable $e) {
    erreur_serveur($e);
}
