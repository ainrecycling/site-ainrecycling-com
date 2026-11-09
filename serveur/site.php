<?php
declare(strict_types=1);

// /api/site/… (redirigé ici par .htaccess) : ce que tout visiteur du site peut demander, sans compte (8 nov. 2026).
//   GET  infos                  prix du jour, fin de sa garantie, annonces (congés, tournée…) ; compte la page vue
//                               (jour, page, site d'où vient le visiteur : sans cookie, sans adresse IP)
//   POST alerte                 inscription à l'alerte prix → e-mail de confirmation
//   POST alerte/confirmer       { j : jeton du lien de l'e-mail }
//   POST alerte/desinscrire     { j } depuis la page du site, ou ?j=… envoyé par la boîte mail (« se désabonner »)
//   GET  entreprises?q=…        annuaire officiel des entreprises (recherche-entreprises.api.gouv.fr), interrogé par le
//                               serveur du site : le navigateur du visiteur ne parle qu'à ainrecycling.com

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
            }
            envoyer_alertes_en_attente();
            repondre(infos_publiques());

        // Formulaires Contact et Devis : la demande part directement chez Malik, avec les photos (4e revue, n° 144 et 146)
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
            // déjà désinscrit : même réponse (le lien a pu servir deux fois)
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
