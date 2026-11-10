<?php
declare(strict_types=1);










require __DIR__ . '/lib/espace.php';

$chemin = trim((string) ($_GET['chemin'] ?? ''), '/');
$methode = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    menage_du_jour();
    switch ("$methode $chemin") {
        case 'GET infos':
            if (!est_robot()) {
                $page = page_visitee($_GET['p'] ?? null);
                $source = source_visite($_GET['r'] ?? null, $_GET['q'] ?? null);
                if ($page !== null) apres_reponse(fn () => compter_visite($page, $source));

                $v = (string) ($_GET['v'] ?? '');
                if ($v === 'n' || $v === 'r') apres_reponse(fn () => compter_visite('(visiteurs)', $v === 'n' ? 'nouveau' : 'revenu'));
            }
            envoyer_alertes_en_attente();
            repondre(infos_publiques());


        case 'POST contact':
            origine_refusee();
            recevoir_contact();

        case 'POST alerte':
            origine_refusee();
            $b = corps_json();
            if (!$b) refus('illisible');
            if (robot($b)) repondre(['ok' => true]);
            $email = email_valide($b['email'] ?? null);
            if (!$email) refus('email');
            if (inscrire_alerte($email, langue_de($b['langue'] ?? null)) === 'trop') refus('trop', 429);
            repondre(['ok' => true]);

        case 'POST alerte/confirmer':
            origine_refusee();
            $b = corps_json() ?? [];
            if (!confirmer_alerte((string) ($b['j'] ?? ''))) refus('lien', 404);
            repondre(['ok' => true]);

        case 'POST alerte/desinscrire':
            origine_refusee();
            $b = corps_json() ?? [];
            $j = (string) ($b['j'] ?? ($_GET['j'] ?? ''));

            if (!desinscrire_alerte($j) && !preg_match('/^[0-9a-f]{32}$/', $j)) refus('lien', 404);
            repondre(['ok' => true]);

        case 'GET entreprises':
            $q = texte($_GET['q'] ?? null, 100);
            if (mb_strlen($q) < 3) repondre(['entreprises' => []]);
            if (!sous_la_limite('an:' . empreinte_ip(), 400) || !sous_la_limite('annuaire-jour', 6000)) refus('trop', 429);
            repondre(['entreprises' => chercher_entreprises($q)]);

        default:
            refus('inconnu', 404);
    }
} catch (Throwable $e) {
    erreur_serveur($e);
}
