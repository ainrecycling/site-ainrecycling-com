// Ain Recycling – interactions du site vitrine (sans dépendance)
(function () {
  // Textes affichés par le script, dans la langue de la page
  var TEXTES = {
    fr: { entreprise: 'Entreprise', siret: 'SIRET', volume: 'Quantité par mois', enlevement: 'Enlèvement sur place',
      devisSouhait: 'Je souhaite un devis pour la reprise de notre carbure.', quantite: 'Quantité à enlever', contenant: 'Contenants',
      acces: 'Accès pour le camion', lieu: 'Lieu', contact: 'Contact', telephone: 'Téléphone', semaine: 'Semaine souhaitée',
      sujetDevis: 'Demande de devis carbure – ', semaineDu: 'Semaine du {date}',
      ouvrir: 'Ouvrir le menu', fermer: 'Fermer le menu', bonjour: 'Bonjour,', souhait: 'Je souhaite une estimation pour du carbure de tungstène.',
      nom: 'Nom', profil: 'Profil', matiere: 'Matière', poids: 'Poids estimé', nonPrecise: 'non précisé', facon: 'Façon de vendre',
      photos: '(Photos jointes)', sujet: 'Demande d\'estimation carbure – ', locale: 'fr-FR',
      element: 'élément {n} sur {t}' },
    de: { entreprise: 'Unternehmen', siret: 'SIRET', volume: 'Menge pro Monat', enlevement: 'Abholung vor Ort',
      devisSouhait: 'ich bitte um ein Angebot für die Rücknahme unseres Hartmetalls.', quantite: 'Abzuholende Menge', contenant: 'Behälter',
      acces: 'Zufahrt für den Lkw', lieu: 'Standort', contact: 'Ansprechpartner', telephone: 'Telefon', semaine: 'Gewünschte Woche',
      sujetDevis: 'Angebotsanfrage Hartmetall – ', semaineDu: 'Woche vom {date}',
      ouvrir: 'Menü öffnen', fermer: 'Menü schließen', bonjour: 'Guten Tag,', souhait: 'ich bitte um eine Schätzung für Wolframkarbid.',
      nom: 'Name', profil: 'Profil', matiere: 'Material', poids: 'Geschätztes Gewicht', nonPrecise: 'nicht angegeben', facon: 'Verkaufsart',
      photos: '(Fotos im Anhang)', sujet: 'Anfrage Hartmetall-Schätzung – ', locale: 'de-DE',
      element: 'Element {n} von {t}' },
    en: { entreprise: 'Company', siret: 'SIRET', volume: 'Quantity per month', enlevement: 'Collection on site',
      devisSouhait: 'I would like a quote for taking back our carbide.', quantite: 'Quantity to collect', contenant: 'Containers',
      acces: 'Truck access', lieu: 'Location', contact: 'Contact', telephone: 'Phone', semaine: 'Preferred week',
      sujetDevis: 'Carbide quote request – ', semaineDu: 'Week of {date}',
      ouvrir: 'Open menu', fermer: 'Close menu', bonjour: 'Hello,', souhait: 'I would like a quote for tungsten carbide.',
      nom: 'Name', profil: 'Profile', matiere: 'Material', poids: 'Estimated weight', nonPrecise: 'not specified', facon: 'How I want to sell',
      photos: '(Photos attached)', sujet: 'Carbide quote request – ', locale: 'en-GB',
      element: 'item {n} of {t}' },
    it: { entreprise: 'Azienda', siret: 'SIRET', volume: 'Quantità al mese', enlevement: 'Ritiro in sede',
      devisSouhait: 'desidero un preventivo per il ritiro del nostro metallo duro.', quantite: 'Quantità da ritirare', contenant: 'Contenitori',
      acces: 'Accesso per il camion', lieu: 'Luogo', contact: 'Referente', telephone: 'Telefono', semaine: 'Settimana desiderata',
      sujetDevis: 'Richiesta di preventivo metallo duro – ', semaineDu: 'Settimana del {date}',
      ouvrir: 'Apri il menu', fermer: 'Chiudi il menu', bonjour: 'Buongiorno,', souhait: 'desidero una stima per del carburo di tungsteno.',
      nom: 'Nome', profil: 'Profilo', matiere: 'Materiale', poids: 'Peso stimato', nonPrecise: 'non indicato', facon: 'Modalità di vendita',
      photos: '(Foto allegate)', sujet: 'Richiesta di stima carburo – ', locale: 'it-IT',
      element: 'elemento {n} di {t}' },
    es: { entreprise: 'Empresa', siret: 'SIRET', volume: 'Cantidad al mes', enlevement: 'Recogida in situ',
      devisSouhait: 'Quisiera un presupuesto para la recogida de nuestro carburo.', quantite: 'Cantidad a recoger', contenant: 'Recipientes',
      acces: 'Acceso para el camión', lieu: 'Lugar', contact: 'Contacto', telephone: 'Teléfono', semaine: 'Semana deseada',
      sujetDevis: 'Solicitud de presupuesto de carburo – ', semaineDu: 'Semana del {date}',
      ouvrir: 'Abrir el menú', fermer: 'Cerrar el menú', bonjour: 'Buenos días:', souhait: 'Quisiera una estimación para carburo de tungsteno.',
      nom: 'Nombre', profil: 'Perfil', matiere: 'Material', poids: 'Peso estimado', nonPrecise: 'no indicado', facon: 'Forma de venta',
      photos: '(Fotos adjuntas)', sujet: 'Solicitud de estimación de carburo – ', locale: 'es-ES',
      element: 'elemento {n} de {t}' }
  };
  var T = TEXTES[document.documentElement.lang] || TEXTES.fr;

  // Espace client : messages de la page (les codes d'erreur viennent du serveur du site, serveur/espace.php)
  var ESPACE = {
    fr: { email: 'Indiquez une adresse e-mail valide.', trop: 'Trop de demandes : réessayez dans un quart d\'heure.',
      reseau: 'Pas de connexion internet : réessayez.', serveur: 'Service indisponible pour le moment : réessayez plus tard.',
      origine: 'Demande refusée : rechargez la page.', illisible: 'Demande illisible : rechargez la page.',
      code_faux: 'Ce code n\'est pas le bon : vérifiez-le.', code_expire: 'Ce code n\'est plus valable : demandez-en un nouveau.',
      bloque: 'Trop d\'essais : demandez un nouveau code.', code6: 'Le code comporte 6 chiffres.',
      connexion: 'Vous n\'êtes plus connecté : reconnectez-vous.', nom: 'Indiquez votre nom et votre prénom.',
      adresse: 'Indiquez votre adresse complète, avec un code postal à 5 chiffres.', telephone: 'Ce numéro de téléphone n\'est pas valide.',
      siret: 'Indiquez le nom de l\'entreprise et son SIRET (14 chiffres).', titulaire: 'Indiquez le nom du titulaire du compte.',
      iban: 'Cet IBAN n\'est pas valide : vérifiez-le.', piece_type: 'Choisissez le type de pièce.',
      numero: 'Indiquez le numéro de la pièce, tel qu\'il est écrit dessus.', expiration: 'La date de fin de validité n\'est pas correcte.',
      piece_expiree: 'Cette pièce n\'est plus valable : déposez une pièce en cours de validité.',
      photo: 'Cette photo n\'a pas pu être lue : réessayez.', photo_lourde: 'Photo trop lourde : réessayez.',
      recto: 'Ajoutez la photo du recto.', verso: 'Ajoutez la photo du verso.',
      colis: 'Indiquez le poids de chaque colis : 20 kg au maximum.', rib: 'Pour être payé par virement, enregistrez d\'abord votre RIB.',
      attestation: 'Cochez l\'attestation pour envoyer la demande.', incomplet: 'Complétez d\'abord vos coordonnées et votre pièce d\'identité.',
      supprime: 'Votre compte et vos documents sont supprimés.', enregistre: 'Enregistré.', aCompleter: 'À compléter',
      pourVirement: 'Pour être payé par virement', deposee: '{type}, déposée le {date}',
      pret: 'Votre compte est prêt : vous pouvez demander un envoi par colis.', reste: 'Complétez votre compte pour demander votre premier envoi.',
      demandeRecue: 'Demande reçue', etiquetteEnvoyee: 'Étiquette envoyée le {date}', colisKg: '{n} colis · {kg} kg',
      virement: 'Virement', cheque: 'Chèque', confirmer: 'Supprimer votre compte, votre pièce d\'identité et vos demandes ? C\'est définitif.',
      bordereau: 'Bordereau d\'envoi', expediteur: 'Expéditeur', colisTitre: 'Colis', colisN: 'Colis {n}', matiere: 'Matière',
      poids: 'Poids estimé', total: 'Total estimé', paiement: 'Paiement', glisser: 'À glisser dans chaque colis.' },
    de: { email: 'Geben Sie eine gültige E-Mail-Adresse an.', trop: 'Zu viele Anfragen: Versuchen Sie es in einer Viertelstunde erneut.',
      reseau: 'Keine Internetverbindung: Versuchen Sie es erneut.', serveur: 'Dienst momentan nicht verfügbar: Versuchen Sie es später erneut.',
      origine: 'Anfrage abgelehnt: Laden Sie die Seite neu.', illisible: 'Anfrage unlesbar: Laden Sie die Seite neu.',
      code_faux: 'Dieser Code ist falsch: Prüfen Sie ihn.', code_expire: 'Dieser Code ist nicht mehr gültig: Fordern Sie einen neuen an.',
      bloque: 'Zu viele Versuche: Fordern Sie einen neuen Code an.', code6: 'Der Code hat 6 Ziffern.',
      connexion: 'Sie sind nicht mehr angemeldet: Melden Sie sich erneut an.', nom: 'Geben Sie Ihren Nachnamen und Vornamen an.',
      adresse: 'Geben Sie Ihre vollständige Adresse mit 5-stelliger Postleitzahl an.', telephone: 'Diese Telefonnummer ist ungültig.',
      siret: 'Geben Sie den Namen des Unternehmens und seine SIRET-Nummer (14 Ziffern) an.', titulaire: 'Geben Sie den Namen des Kontoinhabers an.',
      iban: 'Diese IBAN ist ungültig: Prüfen Sie sie.', piece_type: 'Wählen Sie die Art des Ausweises.',
      numero: 'Geben Sie die Nummer des Ausweises an, wie sie darauf steht.', expiration: 'Das Ablaufdatum ist nicht korrekt.',
      piece_expiree: 'Dieser Ausweis ist nicht mehr gültig: Laden Sie einen gültigen Ausweis hoch.',
      photo: 'Dieses Foto konnte nicht gelesen werden: Versuchen Sie es erneut.', photo_lourde: 'Foto zu groß: Versuchen Sie es erneut.',
      recto: 'Fügen Sie das Foto der Vorderseite hinzu.', verso: 'Fügen Sie das Foto der Rückseite hinzu.',
      colis: 'Geben Sie das Gewicht jedes Pakets an: höchstens 20 kg.', rib: 'Für eine Zahlung per Überweisung speichern Sie zuerst Ihre Bankverbindung.',
      attestation: 'Kreuzen Sie die Erklärung an, um die Anfrage zu senden.', incomplet: 'Vervollständigen Sie zuerst Ihre Kontaktdaten und Ihren Ausweis.',
      supprime: 'Ihr Konto und Ihre Dokumente sind gelöscht.', enregistre: 'Gespeichert.', aCompleter: 'Zu ergänzen',
      pourVirement: 'Für die Zahlung per Überweisung', deposee: '{type}, hochgeladen am {date}',
      pret: 'Ihr Konto ist bereit: Sie können einen Versand per Paket anfragen.', reste: 'Vervollständigen Sie Ihr Konto, um Ihren ersten Versand anzufragen.',
      demandeRecue: 'Anfrage eingegangen', etiquetteEnvoyee: 'Etikett am {date} geschickt', colisKg: '{n} Paket(e) · {kg} kg',
      virement: 'Überweisung', cheque: 'Scheck', confirmer: 'Ihr Konto, Ihren Ausweis und Ihre Anfragen löschen? Das ist endgültig.',
      bordereau: 'Versandschein', expediteur: 'Absender', colisTitre: 'Paket', colisN: 'Paket {n}', matiere: 'Material',
      poids: 'Geschätztes Gewicht', total: 'Geschätztes Gesamtgewicht', paiement: 'Zahlung', glisser: 'In jedes Paket legen.' },
    en: { email: 'Enter a valid email address.', trop: 'Too many requests: try again in a quarter of an hour.',
      reseau: 'No internet connection: try again.', serveur: 'Service unavailable for now: try again later.',
      origine: 'Request refused: reload the page.', illisible: 'Unreadable request: reload the page.',
      code_faux: 'This code is not right: check it.', code_expire: 'This code is no longer valid: ask for a new one.',
      bloque: 'Too many attempts: ask for a new code.', code6: 'The code has 6 digits.',
      connexion: 'You are no longer logged in: log in again.', nom: 'Enter your surname and first name.',
      adresse: 'Enter your full address, with a 5-digit postcode.', telephone: 'This phone number is not valid.',
      siret: 'Enter the company name and its SIRET number (14 digits).', titulaire: 'Enter the account holder\'s name.',
      iban: 'This IBAN is not valid: check it.', piece_type: 'Choose the type of ID.',
      numero: 'Enter the ID number as written on it.', expiration: 'The expiry date is not correct.',
      piece_expiree: 'This ID has expired: upload a valid ID.',
      photo: 'This photo could not be read: try again.', photo_lourde: 'Photo too large: try again.',
      recto: 'Add the photo of the front.', verso: 'Add the photo of the back.',
      colis: 'Enter the weight of each parcel: 20 kg maximum.', rib: 'To be paid by bank transfer, first save your bank details.',
      attestation: 'Tick the declaration to send the request.', incomplet: 'First complete your contact details and your ID.',
      supprime: 'Your account and documents have been deleted.', enregistre: 'Saved.', aCompleter: 'To complete',
      pourVirement: 'To be paid by bank transfer', deposee: '{type}, uploaded on {date}',
      pret: 'Your account is ready: you can request a parcel shipment.', reste: 'Complete your account to request your first shipment.',
      demandeRecue: 'Request received', etiquetteEnvoyee: 'Label sent on {date}', colisKg: '{n} parcel(s) · {kg} kg',
      virement: 'Bank transfer', cheque: 'Cheque', confirmer: 'Delete your account, your ID and your requests? This cannot be undone.',
      bordereau: 'Shipping slip', expediteur: 'Sender', colisTitre: 'Parcel', colisN: 'Parcel {n}', matiere: 'Material',
      poids: 'Estimated weight', total: 'Estimated total', paiement: 'Payment', glisser: 'Put in each parcel.' },
    it: { email: 'Indicate un indirizzo e-mail valido.', trop: 'Troppe richieste: riprovate tra un quarto d\'ora.',
      reseau: 'Nessuna connessione internet: riprovate.', serveur: 'Servizio non disponibile al momento: riprovate più tardi.',
      origine: 'Richiesta rifiutata: ricaricate la pagina.', illisible: 'Richiesta illeggibile: ricaricate la pagina.',
      code_faux: 'Questo codice non è corretto: controllatelo.', code_expire: 'Questo codice non è più valido: chiedetene uno nuovo.',
      bloque: 'Troppi tentativi: chiedete un nuovo codice.', code6: 'Il codice è di 6 cifre.',
      connexion: 'Non siete più connessi: accedete di nuovo.', nom: 'Indicate cognome e nome.',
      adresse: 'Indicate l\'indirizzo completo, con un codice postale di 5 cifre.', telephone: 'Questo numero di telefono non è valido.',
      siret: 'Indicate il nome dell\'azienda e il suo SIRET (14 cifre).', titulaire: 'Indicate il nome dell\'intestatario del conto.',
      iban: 'Questo IBAN non è valido: controllatelo.', piece_type: 'Scegliete il tipo di documento.',
      numero: 'Indicate il numero del documento, come è scritto sopra.', expiration: 'La data di scadenza non è corretta.',
      piece_expiree: 'Questo documento è scaduto: caricate un documento valido.',
      photo: 'Non è stato possibile leggere questa foto: riprovate.', photo_lourde: 'Foto troppo pesante: riprovate.',
      recto: 'Aggiungete la foto del fronte.', verso: 'Aggiungete la foto del retro.',
      colis: 'Indicate il peso di ogni pacco: massimo 20 kg.', rib: 'Per essere pagati con bonifico, registrate prima il vostro IBAN.',
      attestation: 'Spuntate la dichiarazione per inviare la richiesta.', incomplet: 'Completate prima i vostri recapiti e il documento d\'identità.',
      supprime: 'Il vostro account e i vostri documenti sono stati cancellati.', enregistre: 'Registrato.', aCompleter: 'Da completare',
      pourVirement: 'Per essere pagati con bonifico', deposee: '{type}, caricato il {date}',
      pret: 'Il vostro account è pronto: potete richiedere una spedizione con pacco.', reste: 'Completate il vostro account per richiedere la prima spedizione.',
      demandeRecue: 'Richiesta ricevuta', etiquetteEnvoyee: 'Etichetta inviata il {date}', colisKg: '{n} pacco/pacchi · {kg} kg',
      virement: 'Bonifico', cheque: 'Assegno', confirmer: 'Cancellare il vostro account, il documento d\'identità e le richieste? È definitivo.',
      bordereau: 'Distinta di spedizione', expediteur: 'Mittente', colisTitre: 'Pacco', colisN: 'Pacco {n}', matiere: 'Materiale',
      poids: 'Peso stimato', total: 'Totale stimato', paiement: 'Pagamento', glisser: 'Da mettere in ogni pacco.' },
    es: { email: 'Indique un correo electrónico válido.', trop: 'Demasiadas solicitudes: inténtelo de nuevo dentro de un cuarto de hora.',
      reseau: 'Sin conexión a internet: inténtelo de nuevo.', serveur: 'Servicio no disponible por ahora: inténtelo más tarde.',
      origine: 'Solicitud rechazada: recargue la página.', illisible: 'Solicitud ilegible: recargue la página.',
      code_faux: 'Este código no es correcto: compruébelo.', code_expire: 'Este código ya no es válido: pida uno nuevo.',
      bloque: 'Demasiados intentos: pida un código nuevo.', code6: 'El código tiene 6 cifras.',
      connexion: 'Ya no tiene la sesión iniciada: vuelva a conectarse.', nom: 'Indique sus apellidos y su nombre.',
      adresse: 'Indique su dirección completa, con un código postal de 5 cifras.', telephone: 'Este número de teléfono no es válido.',
      siret: 'Indique el nombre de la empresa y su SIRET (14 cifras).', titulaire: 'Indique el nombre del titular de la cuenta.',
      iban: 'Este IBAN no es válido: compruébelo.', piece_type: 'Elija el tipo de documento.',
      numero: 'Indique el número del documento, tal como figura en él.', expiration: 'La fecha de caducidad no es correcta.',
      piece_expiree: 'Este documento ha caducado: suba un documento en vigor.',
      photo: 'No se ha podido leer esta foto: inténtelo de nuevo.', photo_lourde: 'Foto demasiado pesada: inténtelo de nuevo.',
      recto: 'Añada la foto del anverso.', verso: 'Añada la foto del reverso.',
      colis: 'Indique el peso de cada paquete: 20 kg como máximo.', rib: 'Para cobrar por transferencia, guarde primero sus datos bancarios.',
      attestation: 'Marque la declaración para enviar la solicitud.', incomplet: 'Complete primero sus datos y su documento de identidad.',
      supprime: 'Su cuenta y sus documentos se han eliminado.', enregistre: 'Guardado.', aCompleter: 'Por completar',
      pourVirement: 'Para cobrar por transferencia', deposee: '{type}, subido el {date}',
      pret: 'Su cuenta está lista: puede solicitar un envío por paquete.', reste: 'Complete su cuenta para solicitar su primer envío.',
      demandeRecue: 'Solicitud recibida', etiquetteEnvoyee: 'Etiqueta enviada el {date}', colisKg: '{n} paquete(s) · {kg} kg',
      virement: 'Transferencia', cheque: 'Cheque', confirmer: '¿Eliminar su cuenta, su documento de identidad y sus solicitudes? Es definitivo.',
      bordereau: 'Albarán de envío', expediteur: 'Remitente', colisTitre: 'Paquete', colisN: 'Paquete {n}', matiere: 'Material',
      poids: 'Peso estimado', total: 'Total estimado', paiement: 'Pago', glisser: 'Para meter en cada paquete.' }
  };

  // Textes des nouveautés du 8 novembre 2026 (propositions 49 à 60) : prix du jour piloté par Malik, garantie de 7 jours
  // (jamais après la fin du mois), annonces en haut des pages, alerte prix, annuaire des entreprises.
  var SITE = {
    fr: { jusquau: 'jusqu\'au {date}', duAu: 'Du {debut} au {fin}', leJour: 'Le {date}',
      conges: 'Fermé du {debut} au {fin}.', conges1: 'Fermé le {debut}.', fermeture: 'Fermé exceptionnellement du {debut} au {fin}.',
      fermeture1: 'Fermé exceptionnellement le {debut}.', reprise: 'Vos demandes seront traitées dès le {date}.',
      tournee: 'Tournée {villes} du {debut} au {fin}.', tournee1: 'Tournée {villes} le {debut}.', reserver: 'Réserver un passage', annonce: 'Annonce',
      alerteOk: 'C\'est noté : confirmez avec le lien que nous venons de vous envoyer par e-mail.',
      alerteConfirmer: 'Confirmer votre alerte prix ?', alerteOui: 'Oui, me prévenir', alerteActive: 'Alerte prix activée : nous vous écrirons quand notre prix monte.',
      alerteStop: 'Ne plus recevoir l\'alerte prix ?', alerteStopOui: 'Me désinscrire', alerteFinie: 'C\'est fait : vous ne recevrez plus l\'alerte prix.',
      lien: 'Ce lien n\'est plus valable.', email: 'Indiquez une adresse e-mail valide.', trop: 'Trop de demandes : réessayez demain.',
      reseau: 'Pas de connexion internet : réessayez.', serveur: 'Service indisponible pour le moment : réessayez plus tard.',
      garanti: 'Prix garanti : {prix} €/kg jusqu\'au {date}', garantiFini: 'Garantie terminée le {date} : prix du jour au dépôt du colis',
      scanne: 'Scanné à l\'arrivée', annuaire: 'Entreprises françaises · annuaire officiel de l\'État', annuaireVide: 'Aucune entreprise française trouvée.',
      annuaireN: '{n} entreprises trouvées : flèches pour choisir.', annuaireRempli: 'Rempli : {nom}.' },
    de: { jusquau: 'bis {date}', duAu: 'Vom {debut} bis {fin}', leJour: 'Am {date}',
      conges: 'Geschlossen vom {debut} bis {fin}.', conges1: 'Geschlossen am {debut}.', fermeture: 'Ausnahmsweise geschlossen vom {debut} bis {fin}.',
      fermeture1: 'Ausnahmsweise geschlossen am {debut}.', reprise: 'Ihre Anfragen bearbeiten wir ab dem {date}.',
      tournee: 'Tour {villes} vom {debut} bis {fin}.', tournee1: 'Tour {villes} am {debut}.', reserver: 'Abholung reservieren', annonce: 'Hinweis',
      alerteOk: 'Notiert: Bestätigen Sie mit dem Link, den wir Ihnen gerade per E-Mail geschickt haben.',
      alerteConfirmer: 'Ihren Preisalarm bestätigen?', alerteOui: 'Ja, benachrichtigen', alerteActive: 'Preisalarm aktiviert: Wir schreiben Ihnen, wenn unser Preis steigt.',
      alerteStop: 'Den Preisalarm nicht mehr erhalten?', alerteStopOui: 'Abbestellen', alerteFinie: 'Erledigt: Sie erhalten den Preisalarm nicht mehr.',
      lien: 'Dieser Link ist nicht mehr gültig.', email: 'Geben Sie eine gültige E-Mail-Adresse an.', trop: 'Zu viele Anfragen: Versuchen Sie es morgen erneut.',
      reseau: 'Keine Internetverbindung: Versuchen Sie es erneut.', serveur: 'Dienst momentan nicht verfügbar: Versuchen Sie es später erneut.',
      garanti: 'Garantierter Preis: {prix} €/kg bis zum {date}', garantiFini: 'Garantie am {date} abgelaufen: Tagespreis bei Abgabe des Pakets',
      scanne: 'Wird bei Eingang gescannt', annuaire: 'Französische Unternehmen · amtliches Verzeichnis', annuaireVide: 'Kein französisches Unternehmen gefunden.',
      annuaireN: '{n} Unternehmen gefunden: Pfeiltasten zum Auswählen.', annuaireRempli: 'Ausgefüllt: {nom}.' },
    en: { jusquau: 'until {date}', duAu: 'From {debut} to {fin}', leJour: 'On {date}',
      conges: 'Closed from {debut} to {fin}.', conges1: 'Closed on {debut}.', fermeture: 'Exceptionally closed from {debut} to {fin}.',
      fermeture1: 'Exceptionally closed on {debut}.', reprise: 'Your requests will be handled from {date}.',
      tournee: '{villes} round from {debut} to {fin}.', tournee1: '{villes} round on {debut}.', reserver: 'Book a collection', annonce: 'Notice',
      alerteOk: 'Done: confirm with the link we have just emailed you.',
      alerteConfirmer: 'Confirm your price alert?', alerteOui: 'Yes, alert me', alerteActive: 'Price alert on: we will write to you when our price goes up.',
      alerteStop: 'Stop receiving the price alert?', alerteStopOui: 'Unsubscribe', alerteFinie: 'Done: you will no longer receive the price alert.',
      lien: 'This link is no longer valid.', email: 'Enter a valid email address.', trop: 'Too many requests: try again tomorrow.',
      reseau: 'No internet connection: try again.', serveur: 'Service unavailable for now: try again later.',
      garanti: 'Guaranteed price: {prix} €/kg until {date}', garantiFini: 'Guarantee ended on {date}: price of the day when the parcel is dropped off',
      scanne: 'Scanned on arrival', annuaire: 'French companies · official government register', annuaireVide: 'No French company found.',
      annuaireN: '{n} companies found: use the arrow keys to choose.', annuaireRempli: 'Filled in: {nom}.' },
    it: { jusquau: 'fino al {date}', duAu: 'Dal {debut} al {fin}', leJour: 'Il {date}',
      conges: 'Chiuso dal {debut} al {fin}.', conges1: 'Chiuso il {debut}.', fermeture: 'Chiusura straordinaria dal {debut} al {fin}.',
      fermeture1: 'Chiusura straordinaria il {debut}.', reprise: 'Le vostre richieste saranno trattate dal {date}.',
      tournee: 'Giro {villes} dal {debut} al {fin}.', tournee1: 'Giro {villes} il {debut}.', reserver: 'Prenotare un ritiro', annonce: 'Avviso',
      alerteOk: 'Fatto: confermate con il link che vi abbiamo appena inviato per e-mail.',
      alerteConfirmer: 'Confermare il vostro avviso di prezzo?', alerteOui: 'Sì, avvisatemi', alerteActive: 'Avviso di prezzo attivo: vi scriveremo quando il nostro prezzo sale.',
      alerteStop: 'Non ricevere più l\'avviso di prezzo?', alerteStopOui: 'Annullare l\'iscrizione', alerteFinie: 'Fatto: non riceverete più l\'avviso di prezzo.',
      lien: 'Questo link non è più valido.', email: 'Indicate un indirizzo e-mail valido.', trop: 'Troppe richieste: riprovate domani.',
      reseau: 'Nessuna connessione internet: riprovate.', serveur: 'Servizio non disponibile al momento: riprovate più tardi.',
      garanti: 'Prezzo garantito: {prix} €/kg fino al {date}', garantiFini: 'Garanzia scaduta il {date}: prezzo del giorno alla consegna del pacco',
      scanne: 'Scansionato all\'arrivo', annuaire: 'Aziende francesi · registro ufficiale dello Stato', annuaireVide: 'Nessuna azienda francese trovata.',
      annuaireN: '{n} aziende trovate: frecce per scegliere.', annuaireRempli: 'Compilato: {nom}.' },
    es: { jusquau: 'hasta el {date}', duAu: 'Del {debut} al {fin}', leJour: 'El {date}',
      conges: 'Cerrado del {debut} al {fin}.', conges1: 'Cerrado el {debut}.', fermeture: 'Cierre excepcional del {debut} al {fin}.',
      fermeture1: 'Cierre excepcional el {debut}.', reprise: 'Sus solicitudes se tramitarán a partir del {date}.',
      tournee: 'Ruta {villes} del {debut} al {fin}.', tournee1: 'Ruta {villes} el {debut}.', reserver: 'Reservar una recogida', annonce: 'Aviso',
      alerteOk: 'Anotado: confirme con el enlace que le acabamos de enviar por correo electrónico.',
      alerteConfirmer: '¿Confirmar su alerta de precio?', alerteOui: 'Sí, avisarme', alerteActive: 'Alerta de precio activada: le escribiremos cuando suba nuestro precio.',
      alerteStop: '¿Dejar de recibir la alerta de precio?', alerteStopOui: 'Darme de baja', alerteFinie: 'Hecho: ya no recibirá la alerta de precio.',
      lien: 'Este enlace ya no es válido.', email: 'Indique un correo electrónico válido.', trop: 'Demasiadas solicitudes: inténtelo mañana.',
      reseau: 'Sin conexión a internet: inténtelo de nuevo.', serveur: 'Servicio no disponible por ahora: inténtelo más tarde.',
      garanti: 'Precio garantizado: {prix} €/kg hasta el {date}', garantiFini: 'Garantía terminada el {date}: precio del día al entregar el paquete',
      scanne: 'Escaneado a la llegada', annuaire: 'Empresas francesas · registro oficial del Estado', annuaireVide: 'No se ha encontrado ninguna empresa francesa.',
      annuaireN: '{n} empresas encontradas: flechas para elegir.', annuaireRempli: 'Rellenado: {nom}.' }
  };
  var LANGUE = document.documentElement.lang;
  var S = SITE[LANGUE] || SITE.fr;
  var remplacer = function (t, v) { return t.replace(/\{(\w+)\}/g, function (m, k) { return v[k] !== undefined ? v[k] : m; }); };

  var entete = document.getElementById('entete');
  var menu = document.getElementById('menu');
  var menuBouton = document.getElementById('menu-bouton');

  // En-tête vitré dès qu'on défile
  function majEntete() { entete.classList.toggle('defile', window.scrollY > 12); }
  majEntete();
  window.addEventListener('scroll', majEntete, { passive: true });

  // Menu mobile
  function fermerMenu() {
    if (!menu || !menuBouton) return;
    menu.classList.remove('ouvert');
    menuBouton.setAttribute('aria-expanded', 'false');
    menuBouton.setAttribute('aria-label', T.ouvrir);
  }
  if (menuBouton) menuBouton.addEventListener('click', function () {
    var ouvert = menu.classList.toggle('ouvert');
    menuBouton.setAttribute('aria-expanded', String(ouvert));
    menuBouton.setAttribute('aria-label', ouvert ? T.fermer : T.ouvrir);
  });
  if (menu) menu.addEventListener('click', function (e) { if (e.target.closest('a')) fermerMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fermerMenu(); });

  // Apparition au défilement
  var elements = document.querySelectorAll('.apparait');
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('vu'); obs.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    elements.forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 80 + 'ms';
      obs.observe(el);
    });
  } else {
    elements.forEach(function (el) { el.classList.add('vu'); });
  }

  var calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ===== Prix du jour, garantie et annonces (8 nov. 2026, propositions 50, 54 et 55) =====
  // Malik règle le prix et les annonces depuis sa page /gestion/ ; chaque page les lit sur le serveur du site
  // (/api/site/infos). Le prix écrit dans les pages (PRIX_PAGES) est remplacé partout par le prix du jour s'il a changé
  // depuis la dernière mise en ligne, et les montants « 2 kg = 94 € » sont recalculés. La même demande compte la page vue
  // (la page et le nom du site d'où l'on vient, rien d'autre : ni cookie, ni adresse IP).
  var PRIX_PAGES = 47; // le même que PRIX_PAGES de serveur/lib/site.php
  var infos = null;
  var infosPretes = new Promise(function (resoudre) {
    if (!window.fetch || location.protocol === 'file:') { resoudre(null); return; }
    var ref = '';
    try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) { ref = ''; }
    var qr = new URLSearchParams(location.search).get('qr') || '';
    var fini = false;
    var finir = function (x) { if (!fini) { fini = true; resoudre(x); } };
    setTimeout(function () { finir(null); }, 1500);
    fetch('/api/site/infos?p=' + encodeURIComponent(location.pathname) + '&r=' + encodeURIComponent(ref) + (qr ? '&q=' + encodeURIComponent(qr) : ''),
      { credentials: 'omit', cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { infos = d && d.prix ? d : null; appliquerInfos(); finir(infos); }, function () { finir(null); });
  });

  // jours en heure de Paris (« 2026-11-08 ») et dates écrites dans la langue de la page
  var jourParis = function (d) { return (d || new Date()).toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' }); };
  var dateDe = function (ymd) { return new Date(ymd + 'T12:00:00'); };
  var dateLongue = function (ymd) {
    var s = dateDe(ymd).toLocaleDateString(T.locale, { day: 'numeric', month: 'long' });
    return LANGUE === 'fr' ? s.replace(/^1 /, '1er ') : s;
  };
  var dateCourte = function (ymd) { return dateDe(ymd).toLocaleDateString(T.locale, { day: 'numeric', month: 'short' }); };
  // début d'une période : le jour seul si elle finit le même mois (« du 23 au 27 novembre », « vom 23. bis 27. November »)
  var debutPeriode = function (debut, fin) {
    if (debut.slice(0, 7) !== fin.slice(0, 7)) return dateLongue(debut);
    var j = Number(debut.slice(8));
    return LANGUE === 'fr' && j === 1 ? '1er' : j + (LANGUE === 'de' ? '.' : '');
  };
  var plusJours = function (ymd, n) { var d = dateDe(ymd); d.setDate(d.getDate() + n); return jourParis(d); };
  // fin de la garantie d'une demande faite ce jour-là : 7 jours après, jamais après le dernier jour du mois
  var garantiJusqu = function (ymd) {
    var fin = plusJours(ymd, 7), d = dateDe(ymd);
    var finMois = jourParis(new Date(d.getFullYear(), d.getMonth() + 1, 0, 12));
    return fin < finMois ? fin : finMois;
  };
  // jour ouvré après une fermeture (ni samedi, ni dimanche, ni jour férié en France)
  var feries = function (an) {
    var a = an % 19, b = Math.floor(an / 100), c = an % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
      g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
      l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
      mois = Math.floor((h + l - 7 * m + 114) / 31), jour = ((h + l - 7 * m + 114) % 31) + 1;
    var liste = ['01-01', '05-01', '05-08', '07-14', '08-15', '11-01', '11-11', '12-25'].map(function (x) { return an + '-' + x; });
    [1, 39, 50].forEach(function (n) { liste.push(jourParis(new Date(an, mois - 1, jour + n, 12))); });
    return liste;
  };
  var reprise = function (fin) {
    var j = fin;
    for (var n = 0; n < 15; n++) {
      j = plusJours(j, 1);
      var semaine = dateDe(j).getDay();
      if (semaine !== 0 && semaine !== 6 && feries(Number(j.slice(0, 4))).indexOf(j) < 0) return j;
    }
    return plusJours(fin, 1);
  };
  var ecrirePrix = function (n) {
    var s = String(Math.round(n * 100) / 100);
    return LANGUE === 'en' ? s : s.replace('.', ',');
  };
  var ecrireMontant = function (n) {
    var c = Math.round(n * 100), ent = Math.floor(c / 100), dec = c % 100;
    return String(ent).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (dec ? (LANGUE === 'en' ? '.' : ',') + String(dec).padStart(2, '0') : '');
  };

  // le tampon du ticket : « Prix garanti jusqu'au 15 nov. » pour une demande faite aujourd'hui (sans le serveur aussi)
  var majTampon = function () {
    var fin = infos ? infos.prix.garanti_jusqu : garantiJusqu(jourParis());
    document.querySelectorAll('[data-garanti]').forEach(function (el) { el.textContent = remplacer(S.jusquau, { date: dateCourte(fin) }); });
  };
  majTampon();

  function appliquerInfos() {
    if (!infos) return;
    majTampon();
    var kg = Number(infos.prix.kg);
    if (kg > 0 && Math.abs(kg - PRIX_PAGES) > 0.001) remplacerPrix(kg);
    afficherAnnonces(infos.annonces || []);
  }

  // Le prix écrit dans les pages devient celui du jour : textes, titres, descriptions, montants calculés.
  function remplacerPrix(kg) {
    var nouveau = ecrirePrix(kg);
    var rePrix = new RegExp('(^|[^\\d.,])' + PRIX_PAGES + '(?=[\\s\\u00a0\\u202f]?€)', 'g');
    var reMontant = /(\d+(?:[.,]\d+)?)([\s ]?)kg([\s ]?)=([\s ]?)\d[\d\s  ]*(?:[.,]\d+)?(?=[\s  ]?€)/g;
    var refaire = function (t) {
      return t.replace(reMontant, function (m, n, a, b, c) { return n + a + 'kg' + b + '=' + c + ecrireMontant(parseFloat(n.replace(',', '.')) * kg); })
        .replace(rePrix, function (m, avant) { return avant + nouveau; });
    };
    // chiffres qui ont déjà défilé avec l'ancien prix (prix du jour arrivé tard) : remis en texte simple
    document.querySelectorAll('.roulant').forEach(function (r) {
      var lu = r.previousSibling;
      if (lu && lu.classList && lu.classList.contains('sr-only')) { r.parentNode.replaceChild(document.createTextNode(lu.textContent), r); lu.remove(); }
    });
    var marcheur = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) { return n.parentNode && /^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentNode.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }
    });
    var noeuds = [];
    while (marcheur.nextNode()) noeuds.push(marcheur.currentNode);
    noeuds.forEach(function (n) { var t = refaire(n.nodeValue); if (t !== n.nodeValue) n.nodeValue = t; });
    document.querySelectorAll('[data-kg]').forEach(function (el) { el.textContent = ecrireMontant(parseFloat(el.getAttribute('data-kg')) * kg) + ' €'; });
    document.querySelectorAll('[aria-label], [title], [alt]').forEach(function (el) {
      ['aria-label', 'title', 'alt'].forEach(function (a) { var v = el.getAttribute(a); if (v && v.indexOf('€') >= 0) el.setAttribute(a, refaire(v)); });
    });
    document.title = refaire(document.title);
    document.querySelectorAll('meta[name="description"], meta[property="og:title"], meta[property="og:description"]').forEach(function (m) {
      m.setAttribute('content', refaire(m.getAttribute('content') || ''));
    });
  }

  // Annonce en haut de toutes les pages (congés, fermeture, tournée), et prochaine tournée sous la carte de l'accueil
  function afficherAnnonces(liste) {
    var auj = jourParis();
    var texte = function (a) {
      var v = { debut: debutPeriode(a.debut, a.fin), fin: dateLongue(a.fin), villes: a.villes || '' }, un = a.debut === a.fin;
      if (a.type === 'tournee') return remplacer(un ? S.tournee1 : S.tournee, v);
      return remplacer(a.type === 'conges' ? (un ? S.conges1 : S.conges) : (un ? S.fermeture1 : S.fermeture), v) + ' '
        + remplacer(S.reprise, { date: dateLongue(reprise(a.fin)) });
    };
    // en haut : les fermetures dès qu'elles sont annoncées, une tournée dans les 14 jours qui viennent (2 annonces au plus)
    var visibles = liste.filter(function (a) { return a.fin >= auj && (a.type !== 'tournee' || a.debut <= plusJours(auj, 14)); }).slice(0, 2);
    var avant = document.querySelector('.annonces-site');
    if (avant) avant.remove();
    if (visibles.length) {
      var boite = document.createElement('aside');
      boite.className = 'annonces-site';
      boite.setAttribute('aria-label', S.annonce);
      visibles.forEach(function (a) {
        var ligne = document.createElement('div'), p = document.createElement('p');
        ligne.className = 'annonce-site conteneur' + (a.type === 'tournee' ? ' annonce-tournee' : '');
        ligne.innerHTML = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (a.type === 'tournee'
          ? '<path d="M10 17h4V5H2v12h3M14 9h4l4 4v4h-3M7.5 20a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM17.5 20a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"></path>'
          : '<rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path>') + '</svg>';
        p.textContent = texte(a) + ' ';
        if (a.type === 'tournee') {
          var lien = document.createElement('a');
          lien.href = 'professionnels.html#devis';
          lien.textContent = S.reserver;
          p.appendChild(lien);
        }
        ligne.appendChild(p);
        boite.appendChild(ligne);
      });
      var repere = document.querySelector('.barre-info') || document.getElementById('entete');
      if (repere) repere.parentNode.insertBefore(boite, repere);
    }
    // sous la carte de l'accueil : la prochaine tournée annoncée
    var bloc = document.querySelector('[data-tournee]');
    var prochaine = liste.filter(function (a) { return a.type === 'tournee' && a.fin >= auj; })[0];
    if (bloc && prochaine) {
      bloc.querySelector('[data-tournee-villes]').textContent = prochaine.villes;
      var date = bloc.querySelector('[data-tournee-date]');
      date.textContent = prochaine.debut === prochaine.fin ? remplacer(S.leJour, { date: dateLongue(prochaine.debut) })
        : remplacer(S.duAu, { debut: debutPeriode(prochaine.debut, prochaine.fin), fin: dateLongue(prochaine.fin) });
      date.hidden = false;
    }
  }

  // Prix au kilo : les chiffres défilent comme un compteur quand le prix apparaît à l'écran
  // (idée du composant « Number Ticker » de 21st.dev, refait sans bibliothèque). Le vrai texte reste lu par les lecteurs d'écran.
  function rouler(el) {
    var texte = el.firstChild;
    if (!texte || texte.nodeType !== 3 || !/\d/.test(texte.nodeValue)) return;
    var lh = parseFloat(getComputedStyle(el).lineHeight) || el.getBoundingClientRect().height;
    var lisible = document.createElement('span');
    lisible.className = 'sr-only';
    lisible.textContent = texte.nodeValue;
    var visuel = document.createElement('span');
    visuel.className = 'roulant';
    visuel.setAttribute('aria-hidden', 'true');
    visuel.style.setProperty('--lh', lh + 'px');
    var bandes = [];
    // les chiffres défilent ; le reste (espaces, « € ») reste fixe, regroupé pour garder les espaces
    texte.nodeValue.match(/\d|\D+/g).forEach(function (c) {
      if (!/\d/.test(c)) { var fixe = document.createElement('span'); fixe.textContent = c; visuel.appendChild(fixe); return; }
      var rouleau = document.createElement('span');
      rouleau.className = 'rouleau';
      var bande = document.createElement('span');
      bande.className = 'rouleau-bande';
      for (var k = 0; k < 20; k++) { var chiffre = document.createElement('span'); chiffre.textContent = k % 10; bande.appendChild(chiffre); }
      bande.style.transitionDelay = bandes.length * 0.09 + 's';
      rouleau.appendChild(bande);
      visuel.appendChild(rouleau);
      bandes.push([bande, 10 + Number(c)]); // un tour complet puis le bon chiffre
    });
    el.replaceChild(visuel, texte);
    el.insertBefore(lisible, visuel);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        bandes.forEach(function (b) { b[0].style.transform = 'translateY(' + (-b[1] * lh) + 'px)'; });
      });
    });
  }
  var prixRoulants = document.querySelectorAll('.hero-prix dd, .offre-prix dd, .facon-prix b');
  // les chiffres ne défilent qu'une fois le prix du jour connu (1,5 s au plus), pour défiler vers le bon prix
  infosPretes.then(function () {
    if (calme || !prixRoulants.length || !('IntersectionObserver' in window)) return;
    var obsPrix = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (en) { if (en.isIntersecting) { obsPrix.unobserve(en.target); rouler(en.target); } });
    }, { threshold: .6 });
    prixRoulants.forEach(function (el) { obsPrix.observe(el); });
  });

  // Questions fréquentes : ouverture et fermeture en douceur
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var resume = item.querySelector('summary');
    var reponse = item.querySelector('.reponse');
    resume.addEventListener('click', function (e) {
      if (calme || !reponse.animate) return; // comportement normal du navigateur
      e.preventDefault();
      if (item.open) {
        var h = reponse.offsetHeight;
        reponse.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 260, easing: 'ease-in' })
          .onfinish = function () { item.open = false; };
      } else {
        item.open = true;
        var cible = reponse.offsetHeight;
        reponse.animate([{ height: '0px', opacity: 0 }, { height: cible + 'px', opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)' });
      }
    });
  });

  // Téléphone : les cartes posées côte à côte sur ordinateur (ce que nous rachetons, les trois façons de vendre, les
  // étapes du cycle du carbure) défilent de côté, une à la fois, avec des points dessous. « Par colis » est au milieu au
  // départ ; dans le cycle, la plaquette dorée de la boucle va se poser sur l'étape affichée.
  var telephone = window.matchMedia('(max-width: 640px)');
  document.querySelectorAll('[data-defile]').forEach(function (rangee) {
    var cartes = [].slice.call(rangee.children);
    var boucle = rangee.closest('.boucle');
    var points = document.createElement('div');
    points.className = 'points';
    var boutons = cartes.map(function (carte, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', T.element.replace('{n}', i + 1).replace('{t}', cartes.length));
      b.addEventListener('click', function () { aller(i, true); });
      points.appendChild(b);
      return b;
    });
    rangee.parentNode.insertBefore(points, rangee.nextSibling);
    var ici = -1, angle = 0;
    function marquer(i) {
      if (i === ici) return;
      if (boucle && ici >= 0) { // par le plus court chemin autour de la boucle
        var n = cartes.length, d = ((i - ici) % n + n) % n;
        angle += (d > n / 2 ? d - n : d) * 360 / n;
        boucle.style.setProperty('--angle', angle + 'deg');
      }
      ici = i;
      boutons.forEach(function (b, k) { b.setAttribute('aria-current', String(k === i)); });
    }
    function aller(i, doux) {
      var c = cartes[i];
      rangee.scrollTo({ left: c.offsetLeft - (rangee.clientWidth - c.offsetWidth) / 2, behavior: doux && !calme ? 'smooth' : 'auto' });
    }
    function suivre() {
      var milieu = rangee.scrollLeft + rangee.clientWidth / 2, mieux = 0, ecart = Infinity;
      cartes.forEach(function (c, k) { var e = Math.abs(c.offsetLeft + c.offsetWidth / 2 - milieu); if (e < ecart) { ecart = e; mieux = k; } });
      marquer(mieux);
    }
    function preparer() {
      var defile = telephone.matches && rangee.scrollWidth > rangee.clientWidth + 1;
      // une rangée qui défile sans rien de cliquable dedans doit pouvoir être atteinte au clavier
      if (defile && !rangee.querySelector('a, button')) rangee.tabIndex = 0; else rangee.removeAttribute('tabindex');
      if (!defile) return;
      var depart = rangee.querySelector('[data-defile-depart]');
      if (depart && ici < 0) aller(cartes.indexOf(depart), false);
      suivre();
    }
    rangee.addEventListener('scroll', aChaqueImage(suivre), { passive: true });
    if (telephone.addEventListener) telephone.addEventListener('change', preparer);
    window.addEventListener('load', preparer);
    preparer();
  });

  // Téléphone : barre d'actions en bas de l'écran une fois le haut de page passé,
  // cachée quand le formulaire (contact ou demande d'envoi) est à l'écran
  var barreMobile = document.getElementById('barre-mobile');
  if (barreMobile) {
    document.body.classList.add('avec-barre-mobile');
    var contact = document.getElementById('contact') || document.getElementById('demande') || document.getElementById('devis');
    var contactVisible = false;
    if (contact && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { contactVisible = en[0].isIntersecting; majBarre(); }, { threshold: .15 }).observe(contact);
    }
    function majBarre() { barreMobile.classList.toggle('visible', window.scrollY > 560 && !contactVisible); }
    window.addEventListener('scroll', majBarre, { passive: true });
    majBarre();
  }

  // Étapes de l'envoi par colis : le composant « Timeline » d'Aceternity (21st.dev, récupéré le 28/10/2026), refait sans
  // bibliothèque. Le rayon vert descend dans la ligne au fil de la lecture, avec les mêmes réglages que le composant :
  // vide quand le haut du bloc (titre compris) arrive à 10 % de l'écran, plein quand son bas arrive à 50 %, en fondu sur
  // les premiers 10 %. Une étape s'allume quand le rayon atteint son point. Avec « moins d'animations », tout est plein.
  var frise = document.getElementById('frise');
  if (frise) {
    var friseBloc = frise.parentNode;
    var friseLigne = frise.querySelector('.frise-ligne');
    var friseRayon = frise.querySelector('.frise-rayon');
    var friseEtapes = [].slice.call(frise.querySelectorAll('.frise-etape'));
    var majFrise = function () {
      var h = window.innerHeight, r = friseBloc.getBoundingClientRect();
      var p = calme ? 1 : Math.max(0, Math.min(1, (h * .1 - r.top) / Math.max(1, r.height - h * .4)));
      friseRayon.style.height = (p * 100).toFixed(2) + '%';
      friseRayon.style.opacity = Math.min(1, p / .1).toFixed(3);
      var l = friseLigne.getBoundingClientRect(), bout = l.top + p * l.height;
      friseEtapes.forEach(function (et) {
        var pt = et.querySelector('.frise-point').getBoundingClientRect();
        et.classList.toggle('atteinte', p >= 1 || pt.top + pt.height / 2 <= bout);
      });
    };
    window.addEventListener('scroll', aChaqueImage(majFrise), { passive: true });
    window.addEventListener('resize', aChaqueImage(majFrise));
    window.addEventListener('load', majFrise);
    majFrise();
  }

  // Formulaire : prépare un e-mail déjà rédigé
  var form = document.getElementById('formulaire');
  if (form) {
    var nom = form.querySelector('#f-nom');
    var erreurNom = form.querySelector('#f-nom-erreur');
    nom.addEventListener('input', function () {
      if (nom.value.trim()) { nom.removeAttribute('aria-invalid'); erreurNom.hidden = true; }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!nom.value.trim()) {
        nom.setAttribute('aria-invalid', 'true');
        nom.setAttribute('aria-describedby', 'f-nom-erreur');
        erreurNom.hidden = false;
        nom.focus();
        return;
      }
      var f = new FormData(form);
      var poids = String(f.get('poids') || '').trim();
      var sep = document.documentElement.lang === 'fr' ? ' : ' : ': ';
      var profil = form.querySelector('input[name="profil"]:checked');
      var lignes = [
        T.bonjour,
        '',
        T.souhait,
        '',
        T.nom + sep + f.get('nom'),
        T.profil + sep + (profil ? profil.nextElementSibling.textContent : ''),
        T.matiere + sep + f.get('matiere'),
        T.poids + sep + (poids ? poids + ' kg' : T.nonPrecise),
        T.facon + sep + f.get('facon'),
      ];
      // proposition 26 : un professionnel dit son entreprise, son volume et s'il veut un enlèvement
      if (profil && profil.value === 'Professionnel') {
        var coche = function (n) { var c = form.querySelector('input[name="' + n + '"]:checked'); return c ? c.nextElementSibling.textContent : ''; };
        [['entreprise', f.get('entreprise')], ['siret', f.get('siret')], ['volume', coche('volume')], ['enlevement', coche('enlevement')]].forEach(function (l) {
          var v = String(l[1] || '').trim();
          if (v) lignes.splice(lignes.length - 3, 0, T[l[0]] + sep + v);
        });
      }
      var message = String(f.get('message') || '').trim();
      if (message) lignes.push('', message);
      lignes.push('', T.photos, '');
      var sujet = T.sujet + f.get('nom');
      window.location.href = 'mailto:contact@ainrecycling.com?subject=' + encodeURIComponent(sujet) +
        '&body=' + encodeURIComponent(lignes.join('\n'));
    });
  }

  // Contact : « Prendre rendez-vous » et « Organiser un enlèvement » de l'accueil arrivent avec la façon de vendre choisie
  var faconChamp = document.getElementById('f-facon');
  var faconVoulue = { depot: 0, colis: 1, tournee: 2 }[new URLSearchParams(location.search).get('facon')];
  if (faconChamp && faconVoulue !== undefined) faconChamp.selectedIndex = faconVoulue;

  // Contact : les questions des professionnels n'apparaissent que si « Professionnel » est choisi (proposition 26)
  var champsPro = document.getElementById('champs-pro');
  if (form && champsPro) {
    var majPro = function () { var p = form.querySelector('input[name="profil"]:checked'); champsPro.hidden = !(p && p.value === 'Professionnel'); };
    form.querySelectorAll('input[name="profil"]').forEach(function (r) { r.addEventListener('change', majPro); });
    majPro();
  }

  // Prix du jour daté sur le ticket du haut (proposition 5) : la date du jour, dans la langue de la page
  document.querySelectorAll('[data-prix-du-jour]').forEach(function (el) {
    el.textContent = '· ' + new Date().toLocaleDateString(T.locale, { weekday: 'long', day: 'numeric', month: 'long' });
  });

  // Demande de devis ou d'enlèvement des professionnels (proposition 27) : un e-mail ou un message WhatsApp déjà rédigé
  var devis = document.getElementById('form-devis');
  if (devis) {
    var dEntreprise = devis.querySelector('#d-entreprise');
    var dErreur = devis.querySelector('#d-entreprise-erreur');
    var dVia = 'mail';
    devis.querySelectorAll('button[type="submit"]').forEach(function (b) { b.addEventListener('click', function () { dVia = b.value; }); });
    dEntreprise.addEventListener('input', function () {
      if (dEntreprise.value.trim()) { dEntreprise.removeAttribute('aria-invalid'); dErreur.hidden = true; }
    });
    devis.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!dEntreprise.value.trim()) {
        dEntreprise.setAttribute('aria-invalid', 'true');
        dEntreprise.setAttribute('aria-describedby', 'd-entreprise-erreur');
        dErreur.hidden = false;
        dEntreprise.focus();
        return;
      }
      var via = (e.submitter && e.submitter.value) || dVia;
      var f = new FormData(devis);
      var sep = document.documentElement.lang === 'fr' ? ' : ' : ': ';
      var choix = function (n) {
        return [].map.call(devis.querySelectorAll('input[name="' + n + '"]:checked'), function (c) { return c.nextElementSibling.textContent; }).join(', ');
      };
      var lignes = [T.bonjour, '', T.devisSouhait, ''];
      [['entreprise', f.get('entreprise')], ['siret', f.get('siret')], ['lieu', f.get('lieu')], ['quantite', choix('quantite')],
        ['contenant', choix('contenant')], ['acces', choix('acces')], ['semaine', f.get('semaine')], ['contact', f.get('contact')],
        ['telephone', f.get('telephone')]].forEach(function (l) {
        var v = String(l[1] || '').trim();
        if (v) lignes.push(T[l[0]] + sep + v);
      });
      var message = String(f.get('message') || '').trim();
      if (message) lignes.push('', message);
      var texte = lignes.join('\n');
      if (via === 'whatsapp') window.location.href = 'https://wa.me/33761119523?text=' + encodeURIComponent(texte);
      else window.location.href = 'mailto:contact@ainrecycling.com?subject=' + encodeURIComponent(T.sujetDevis + f.get('entreprise')) +
        '&body=' + encodeURIComponent(texte + '\n');
    });
  }

  // Questions : recherche et catégories (proposition 28). Sans script, toutes les questions restent affichées.
  var faqOutils = document.querySelector('[data-faq-outils]');
  if (faqOutils) {
    var faqItems = [].slice.call(document.querySelectorAll('#faq .faq-item'));
    var faqVide = document.querySelector('[data-faq-vide]');
    var faqChamp = document.getElementById('faq-cherche');
    var faqBoutons = [].slice.call(faqOutils.querySelectorAll('[data-cat]'));
    var faqCat = '';
    var simple = function (t) { return String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); };
    var faqTextes = faqItems.map(function (it) { return simple(it.textContent); });
    var filtrer = function () {
      var mots = simple(faqChamp.value).split(/\s+/).filter(Boolean), vus = 0;
      faqItems.forEach(function (it, i) {
        var ok = (!faqCat || (' ' + it.getAttribute('data-cat') + ' ').indexOf(' ' + faqCat + ' ') >= 0) &&
          mots.every(function (m) { return faqTextes[i].indexOf(m) >= 0; });
        it.hidden = !ok;
        if (ok) vus++;
      });
      faqVide.hidden = vus > 0;
    };
    faqBoutons.forEach(function (b) {
      b.addEventListener('click', function () {
        faqCat = b.getAttribute('data-cat');
        faqBoutons.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        filtrer();
      });
    });
    faqChamp.addEventListener('input', filtrer);
    faqOutils.hidden = false;
  }

  // Prochaine tournée sous la carte (proposition 38) : depuis le 8 nov. 2026, c'est une annonce « Tournée » que Malik
  // ajoute sur sa page /gestion/ (afficherAnnonces, plus haut) ; sans tournée à venir, le texte de la page reste.

  // Alerte prix (proposition 56) : « Prévenez-moi quand le prix monte ». Inscription, puis confirmation par le lien de
  // l'e-mail (?alerte=confirmer&j=…) ou désinscription (?alerte=stop&j=…), qui ouvrent l'accueil sur ce bloc.
  var alerte = document.getElementById('alerte');
  if (alerte) (function () {
    var form = alerte.querySelector('form'), msg = alerte.querySelector('.msg-alerte'), ouvertA = Date.now();
    var dire = function (texte, ok) { msg.hidden = !texte; msg.textContent = texte || ''; msg.classList.toggle('ok', !!ok); };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var champ = form.querySelector('[name=email]'), email = champ.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { champ.setAttribute('aria-invalid', 'true'); dire(S.email); champ.focus(); return; }
      champ.removeAttribute('aria-invalid');
      form.querySelector('button').disabled = true;
      fetch('/api/site/alerte', { method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, langue: LANGUE, site: form.querySelector('[name=site]').value, duree: Date.now() - ouvertA }) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return r.ok ? j : { erreur: j.erreur || 'serveur' }; }); },
          function () { return { erreur: 'reseau' }; })
        .then(function (r) {
          form.querySelector('button').disabled = false;
          if (r.erreur) return dire(S[r.erreur] || S.serveur);
          form.reset();
          dire(S.alerteOk, true);
        });
    });
    // lien de l'e-mail : un appui pour confirmer ou se désinscrire (un lien ouvert tout seul par une messagerie ne fait rien)
    var params = new URLSearchParams(location.search), action = params.get('alerte'), jeton = params.get('j') || '';
    if ((action !== 'confirmer' && action !== 'stop') || !/^[0-9a-f]{32}$/.test(jeton)) return;
    history.replaceState(null, '', location.pathname + '#alerte');
    var question = document.createElement('div'), p = document.createElement('p'), b = document.createElement('button');
    question.className = 'alerte-question';
    p.textContent = action === 'confirmer' ? S.alerteConfirmer : S.alerteStop;
    b.type = 'button';
    b.className = 'btn btn-primaire';
    b.textContent = action === 'confirmer' ? S.alerteOui : S.alerteStopOui;
    question.appendChild(p);
    question.appendChild(b);
    form.hidden = true;
    form.parentNode.insertBefore(question, form);
    alerte.scrollIntoView({ block: 'center' });
    b.addEventListener('click', function () {
      b.disabled = true;
      fetch('/api/site/alerte/' + (action === 'confirmer' ? 'confirmer' : 'desinscrire'), { method: 'POST', credentials: 'omit',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ j: jeton }) })
        .then(function (r) { return r.ok ? {} : r.json().catch(function () { return {}; }).then(function (j) { return { erreur: j.erreur || 'serveur' }; }); },
          function () { return { erreur: 'reseau' }; })
        .then(function (r) {
          b.disabled = false;
          if (r.erreur) return dire(S[r.erreur] || S.serveur);
          question.remove();
          form.hidden = action === 'stop';
          dire(action === 'confirmer' ? S.alerteActive : S.alerteFinie, true);
          msg.focus();
        });
    });
    b.focus({ preventScroll: true });
  })();

  // « Fin d'année : videz vos bacs avant l'inventaire » (proposition 59) : bandeau de la page des pros, visible du
  // 1er novembre au 19 décembre de chaque année (data-saison="11-01/12-19"), retiré tout seul ensuite.
  document.querySelectorAll('[data-saison]').forEach(function (el) {
    var p = el.getAttribute('data-saison').split('/'), md = jourParis().slice(5);
    el.hidden = !(md >= p[0] && md <= p[1]);
  });

  // L'entreprise remplie toute seule (proposition 60) : en tapant le début de son nom ou son SIRET, la liste des
  // entreprises françaises s'ouvre (annuaire officiel de l'État, interrogé par le serveur du site : /api/site/entreprises) ;
  // un choix remplit le nom, le SIRET et le lieu. Liste « combobox » au clavier : flèches, Entrée, Échap.
  function annuaire(champ, remplir) {
    if (!champ || !window.fetch) return;
    var id = champ.id + '-annuaire', liste = document.createElement('ul'), annonce = document.createElement('p');
    var resultats = [], actif = -1, minuterie = 0, derniere = '', requete = 0;
    liste.id = id;
    liste.className = 'annuaire';
    liste.setAttribute('role', 'listbox');
    liste.setAttribute('aria-label', S.annuaire);
    liste.hidden = true;
    annonce.className = 'sr-only';
    annonce.setAttribute('role', 'status');
    champ.setAttribute('role', 'combobox');
    champ.setAttribute('aria-autocomplete', 'list');
    champ.setAttribute('aria-expanded', 'false');
    champ.setAttribute('aria-controls', id);
    champ.parentNode.insertBefore(liste, champ.nextSibling);
    champ.parentNode.insertBefore(annonce, liste.nextSibling);
    var fermer = function () {
      liste.hidden = true; actif = -1;
      champ.setAttribute('aria-expanded', 'false');
      champ.removeAttribute('aria-activedescendant');
    };
    var marquer = function (i) {
      actif = i;
      [].forEach.call(liste.querySelectorAll('[role=option]'), function (o, k) { o.setAttribute('aria-selected', String(k === i)); });
      if (i >= 0) { champ.setAttribute('aria-activedescendant', id + '-' + i); document.getElementById(id + '-' + i).scrollIntoView({ block: 'nearest' }); }
      else champ.removeAttribute('aria-activedescendant');
    };
    var choisir = function (i) {
      var x = resultats[i];
      if (!x) return;
      champ.value = x.nom;
      derniere = x.nom;
      remplir(x);
      fermer();
      annonce.textContent = remplacer(S.annuaireRempli, { nom: [x.nom, x.ville, x.siret].filter(Boolean).join(', ') });
      champ.dispatchEvent(new Event('input', { bubbles: true }));
    };
    var montrer = function () {
      liste.textContent = '';
      resultats.forEach(function (x, i) {
        var li = document.createElement('li'), b = document.createElement('b'), s = document.createElement('span');
        li.id = id + '-' + i;
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', 'false');
        b.textContent = x.nom;
        s.textContent = [x.cp && x.ville ? x.ville + ' (' + x.cp.slice(0, 2) + ')' : x.ville, x.siret ? 'SIRET ' + x.siret.replace(/^(\d{3})(\d{3})(\d{3})(\d{5})$/, '$1 $2 $3 $4') : ''].filter(Boolean).join(' · ');
        li.appendChild(b); li.appendChild(s);
        li.addEventListener('mousedown', function (e) { e.preventDefault(); });
        li.addEventListener('click', function () { choisir(i); });
        liste.appendChild(li);
      });
      var pied = document.createElement('li');
      pied.className = 'annuaire-pied';
      pied.setAttribute('role', 'presentation');
      pied.textContent = resultats.length ? S.annuaire : S.annuaireVide;
      liste.appendChild(pied);
      liste.hidden = false;
      champ.setAttribute('aria-expanded', 'true');
      annonce.textContent = resultats.length ? remplacer(S.annuaireN, { n: resultats.length }) : S.annuaireVide;
      marquer(-1);
    };
    champ.addEventListener('input', function () {
      clearTimeout(minuterie);
      var q = champ.value.trim();
      if (q === derniere) return;
      if (q.length < 3) { fermer(); return; }
      minuterie = setTimeout(function () {
        var n = ++requete;
        fetch('/api/site/entreprises?q=' + encodeURIComponent(q), { credentials: 'omit' })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (d) {
            if (n !== requete || !d || document.activeElement !== champ) return;
            resultats = (d.entreprises || []).slice(0, 6);
            montrer();
          }, function () {});
      }, 350);
    });
    champ.addEventListener('keydown', function (e) {
      if (liste.hidden) return;
      var n = resultats.length;
      if (e.key === 'ArrowDown' && n) { e.preventDefault(); marquer((actif + 1) % n); }
      else if (e.key === 'ArrowUp' && n) { e.preventDefault(); marquer(actif <= 0 ? n - 1 : actif - 1); }
      else if (e.key === 'Enter' && actif >= 0) { e.preventDefault(); choisir(actif); }
      else if (e.key === 'Escape') { e.preventDefault(); fermer(); }
    });
    champ.addEventListener('blur', function () { setTimeout(fermer, 150); });
  }
  var siVide = function (champ, valeur) { if (champ && valeur && !champ.value.trim()) { champ.value = valeur; champ.dispatchEvent(new Event('input', { bubbles: true })); } };
  annuaire(document.getElementById('d-entreprise'), function (x) {
    siVide(document.getElementById('d-siret'), x.siret);
    siVide(document.getElementById('d-lieu'), [x.cp, x.ville].filter(Boolean).join(' '));
  });
  annuaire(document.getElementById('f-entreprise'), function (x) { siVide(document.getElementById('f-siret'), x.siret); });
  annuaire(document.getElementById('x-entreprise'), function (x) {
    var f = document.getElementById('f-coordonnees');
    siVide(document.getElementById('x-siret'), x.siret);
    if (f) { siVide(f.elements.adresse, x.adresse); siVide(f.elements.cp, x.cp); siVide(f.elements.ville, x.ville); }
  });

  // Espace client : connexion par un code reçu par e-mail, puis le compte (coordonnées, pièce d'identité, RIB) et les
  // demandes d'envoi par colis. Le serveur est celui du site chez OVH (serveur/espace.php, en PHP, joint par l'adresse
  // /api/espace du .htaccess) : même adresse que le site, cookie du site. Les erreurs arrivent en codes courts, dits ici
  // dans la langue de la page (ESPACE plus haut). Les photos de la pièce sont réduites ici en JPEG avant l'envoi.
  var connexion = document.getElementById('connexion');
  var espace = document.getElementById('espace-sections');
  if (connexion && espace) (function () {
    var E = ESPACE[document.documentElement.lang] || ESPACE.fr;
    var ouverture = Date.now(), compte = null, envois = [], dernier = null, photos = {};
    var accueil = document.getElementById('espace-accueil'), avantages = document.getElementById('espace-avantages');
    var bandeau = document.getElementById('espace-connecte');
    var nombre = new Intl.NumberFormat(T.locale, { maximumFractionDigits: 1 });
    var jour = function (iso) { return new Date(iso).toLocaleDateString(T.locale, { day: 'numeric', month: 'long', year: 'numeric' }); };
    var api = function (methode, chemin, corps) {
      var o = { method: methode, credentials: 'same-origin', headers: {} };
      if (corps instanceof FormData) o.body = corps;
      else if (corps) { o.headers['Content-Type'] = 'application/json'; o.body = JSON.stringify(corps); }
      return fetch('/api/espace/' + chemin, o).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          j.status = r.status;
          if (!r.ok && !j.erreur) j.erreur = 'serveur';
          return j;
        });
      }, function () { return { erreur: 'reseau', status: 0 }; });
    };
    var message = function (form) { return form.querySelector('.msg-espace'); };
    var dire = function (el, code, ok) {
      el.hidden = !code;
      el.textContent = code ? (E[code] || E.serveur) : '';
      el.classList.toggle('ok', !!ok);
      el.setAttribute('role', ok ? 'status' : 'alert');
    };
    var occupe = function (form, oui) {
      form.querySelectorAll('button').forEach(function (b) { b.disabled = oui; });
      form.setAttribute('aria-busy', String(oui));
    };
    var cocher = function (radio) { radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles: true })); };
    var recharger = function (suite) { location.replace(location.pathname + (suite || '')); };

    // ---------- connexion : l'adresse, puis le code ----------
    var etapeEmail = connexion.querySelector('[data-etape-connexion="email"]');
    var etapeCode = connexion.querySelector('[data-etape-connexion="code"]');
    var cxEmail = document.getElementById('cx-email'), cxCode = document.getElementById('cx-code'), msgCx = message(connexion);
    var demanderCode = function () {
      var email = cxEmail.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        dire(msgCx, 'email');
        cxEmail.setAttribute('aria-invalid', 'true');
        cxEmail.focus();
        return;
      }
      cxEmail.removeAttribute('aria-invalid');
      occupe(connexion, true);
      api('POST', 'code', { email: email, langue: document.documentElement.lang, site: connexion.querySelector('[name=site]').value, duree: Date.now() - ouverture })
        .then(function (r) {
          occupe(connexion, false);
          if (r.erreur) return dire(msgCx, r.erreur);
          dire(msgCx, '');
          connexion.querySelector('[data-email]').textContent = email;
          etapeEmail.hidden = true;
          etapeCode.hidden = false;
          cxCode.value = '';
          cxCode.focus();
        });
    };
    connexion.addEventListener('submit', function (e) {
      e.preventDefault();
      if (etapeCode.hidden) return demanderCode();
      var code = cxCode.value.replace(/\s/g, '');
      if (!/^\d{6}$/.test(code)) { dire(msgCx, 'code6'); cxCode.focus(); return; }
      occupe(connexion, true);
      api('POST', 'connexion', { email: cxEmail.value.trim(), code: code, langue: document.documentElement.lang }).then(function (r) {
        occupe(connexion, false);
        if (r.erreur) { dire(msgCx, r.erreur); cxCode.select(); return; }
        dire(msgCx, '');
        afficher(r, true);
      });
    });
    connexion.querySelector('[data-renvoyer]').addEventListener('click', demanderCode);
    connexion.querySelector('[data-changer]').addEventListener('click', function () {
      etapeCode.hidden = true;
      etapeEmail.hidden = false;
      dire(msgCx, '');
      cxEmail.focus();
    });

    // ---------- le compte ----------
    var sections = {};
    espace.querySelectorAll('[data-section]').forEach(function (d) { sections[d.getAttribute('data-section')] = d; });
    var fc = document.getElementById('f-coordonnees'), fp = document.getElementById('f-piece'), fr = document.getElementById('f-rib');
    var fe = document.getElementById('f-envoi'), ok = espace.querySelector('[data-envoi-ok]');
    var resume = function (nom, etat, texte) {
      var d = sections[nom];
      d.classList.toggle('fait', etat === 'fait');
      d.classList.toggle('manque', etat === 'manque');
      d.querySelector('.carte-espace-resume').textContent = texte;
    };
    var nomType = function (valeur) { // le type de pièce dans la langue de la page
      var o = [].filter.call(fp.elements.type.options, function (x) { return x.value === valeur; })[0];
      return o ? o.textContent : valeur;
    };
    var majPro = function () { fc.querySelector('[data-pro]').hidden = !fc.querySelector('[name=profil][value=professionnel]').checked; };
    var majRib = function () {
      espace.querySelector('[data-sans-rib]').hidden = !(compte && !compte.rib && fe.querySelector('[name=paiement]:checked').value === 'Virement');
    };
    function remplir() {
      var c = compte, m = c.manque, p = c.piece;
      ['nom', 'prenom', 'entreprise', 'siret', 'adresse', 'cp', 'ville', 'telephone'].forEach(function (k) { fc.elements[k].value = c[k] || ''; });
      cocher(fc.querySelector('[name=profil][value="' + c.profil + '"]'));
      majPro();
      var coordOk = m.indexOf('coordonnees') < 0;
      resume('coordonnees', coordOk ? 'fait' : 'manque', coordOk ? [c.prenom + ' ' + c.nom.toUpperCase(), c.cp + ' ' + c.ville].join(' · ') : E.aCompleter);

      if (p) { fp.elements.type.value = p.type; fp.elements.numero.value = p.numero; fp.elements.expiration.value = p.expiration || ''; }
      var expiree = m.indexOf('piece_expiree') >= 0, pieceOk = p && m.indexOf('piece') < 0 && !expiree;
      resume('piece', pieceOk ? 'fait' : (c.profil === 'professionnel' && !p ? '' : 'manque'),
        p ? E.deposee.replace('{type}', nomType(p.type)).replace('{date}', jour(p.depose_le)) + (expiree ? ' · ' + E.piece_expiree : '') : E.aCompleter);
      ['recto', 'verso'].forEach(function (face) {
        var depot = fp.querySelector('[data-face="' + face + '"]'), img = depot.querySelector('.depot-apercu');
        if (photos[face] || !(p && p[face])) return;
        img.src = '/api/espace/piece?face=' + face + '&v=' + encodeURIComponent(p.depose_le);
        img.hidden = false;
        depot.classList.add('rempli');
      });

      fr.elements.titulaire.value = c.rib ? c.rib.titulaire : '';
      fr.elements.iban.value = '';
      fr.elements.iban.placeholder = c.rib ? c.rib.iban : 'FR76 …';
      resume('rib', c.rib ? 'fait' : '', c.rib ? c.rib.iban : E.pourVirement);

      bandeau.querySelector('.prenom').textContent = c.prenom || '';
      bandeau.querySelector('[data-email]').textContent = c.email;
      bandeau.querySelector('[data-etat-compte]').textContent = m.length ? E.reste : E.pret;
      espace.querySelector('[data-envoi-bloque]').hidden = !m.length;
      fe.hidden = m.length > 0 || !ok.hidden;
      majRib();
      lister();
    }
    function ouvrirSuivante() { // la première partie à compléter s'ouvre, les autres se referment
      var m = compte.manque, suivante = m.indexOf('coordonnees') >= 0 ? 'coordonnees' : (m.length ? 'piece' : null);
      Object.keys(sections).forEach(function (k) { sections[k].open = k === suivante; });
    }
    function lister() {
      var ul = espace.querySelector('[data-envois]');
      ul.textContent = '';
      envois.forEach(function (e) {
        var li = document.createElement('li'), tete = document.createElement('div'), ref = document.createElement('b');
        var etat = document.createElement('span'), detail = document.createElement('p');
        li.className = 'mon-envoi' + (e.traite_le ? ' traite' : '');
        tete.className = 'mon-envoi-tete';
        ref.textContent = e.reference;
        etat.className = 'mon-envoi-etat';
        etat.textContent = e.traite_le ? E.etiquetteEnvoyee.replace('{date}', jour(e.traite_le)) : E.demandeRecue;
        detail.textContent = [jour(e.cree_le), E.colisKg.replace('{n}', e.colis.length).replace('{kg}', nombre.format(e.total)),
          e.paiement === 'Chèque' ? E.cheque : E.virement].join(' · ');
        tete.appendChild(ref);
        tete.appendChild(etat);
        li.appendChild(tete);
        li.appendChild(detail);
        // prix garanti de la demande (proposition 50) : jusqu'à sa date de fin, pour un colis déposé au plus tard ce jour-là
        if (e.prix_kg && e.garanti_jusqu) {
          var g = document.createElement('p'), fini = e.garanti_jusqu < jourParis();
          g.className = 'mon-envoi-garanti' + (fini ? ' fini' : '');
          g.textContent = fini ? remplacer(S.garantiFini, { date: dateLongue(e.garanti_jusqu) })
            : remplacer(S.garanti, { prix: ecrirePrix(e.prix_kg), date: dateLongue(e.garanti_jusqu) });
          li.appendChild(g);
        }
        ul.appendChild(li);
      });
      espace.querySelector('[data-aucun-envoi]').hidden = envois.length > 0;
    }
    function afficher(r, arrivee) {
      compte = r.compte;
      if (r.envois) envois = r.envois;
      accueil.hidden = avantages.hidden = true;
      bandeau.hidden = espace.hidden = false;
      remplir();
      chargerQr(); // le QR code du bordereau, prêt avant l'impression
      if (!arrivee) return;
      ouvrirSuivante();
      var h1 = bandeau.querySelector('h1');
      h1.tabIndex = -1;
      if (location.hash === '#envoi' && !compte.manque.length) document.getElementById('envoi').scrollIntoView();
      else window.scrollTo(0, 0);
      h1.focus({ preventScroll: true });
    }

    // une partie du compte enregistrée : le serveur renvoie le compte à jour
    var enregistrer = function (form, preparer) {
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var msg = message(form), d = preparer();
        occupe(form, true);
        api(d.methode, d.chemin, d.corps).then(function (r) {
          occupe(form, false);
          if (r.status === 401) return recharger();
          if (r.erreur) return dire(msg, r.erreur);
          compte = r.compte;
          if (form === fp) photos = {};
          remplir();
          dire(msg, 'enregistre', true);
          var avant = compte.manque.length;
          if (avant) setTimeout(function () { dire(msg, ''); ouvrirSuivante(); }, 900);
        });
      });
    };
    fc.addEventListener('change', function (e) { if (e.target.name === 'profil') majPro(); });
    enregistrer(fc, function () {
      var o = { section: 'coordonnees' };
      ['profil', 'nom', 'prenom', 'entreprise', 'siret', 'adresse', 'cp', 'ville', 'telephone'].forEach(function (k) { o[k] = k === 'profil' ? fc.querySelector('[name=profil]:checked').value : fc.elements[k].value; });
      return { methode: 'PUT', chemin: 'compte', corps: o };
    });
    // photos de la pièce : réduites à 2 000 px en JPEG avant l'envoi (quelques centaines de Ko)
    var reduire = function (fichier) {
      return new Promise(function (resoudre, refuser) {
        var url = URL.createObjectURL(fichier), img = new Image();
        img.onload = function () {
          var k = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight)), toile = document.createElement('canvas');
          toile.width = Math.round(img.naturalWidth * k);
          toile.height = Math.round(img.naturalHeight * k);
          toile.getContext('2d').drawImage(img, 0, 0, toile.width, toile.height);
          URL.revokeObjectURL(url);
          toile.toBlob(function (b) { if (b) resoudre(b); else refuser(); }, 'image/jpeg', .85);
        };
        img.onerror = function () { URL.revokeObjectURL(url); refuser(); };
        img.src = url;
      });
    };
    fp.querySelectorAll('.depot input[type=file]').forEach(function (champ) {
      champ.addEventListener('change', function () {
        var fichier = champ.files && champ.files[0], depot = champ.closest('.depot'), face = depot.getAttribute('data-face');
        if (!fichier) return;
        reduire(fichier).then(function (b) {
          photos[face] = b;
          var img = depot.querySelector('.depot-apercu');
          img.src = URL.createObjectURL(b);
          img.hidden = false;
          depot.classList.add('rempli');
          dire(message(fp), '');
        }, function () { dire(message(fp), 'photo'); });
      });
    });
    enregistrer(fp, function () {
      var f = new FormData();
      f.append('type', fp.elements.type.value);
      f.append('numero', fp.elements.numero.value);
      f.append('expiration', fp.elements.expiration.value);
      ['recto', 'verso'].forEach(function (face) { if (photos[face]) f.append(face, photos[face], face + '.jpg'); });
      return { methode: 'POST', chemin: 'piece', corps: f };
    });
    enregistrer(fr, function () {
      return { methode: 'PUT', chemin: 'compte', corps: { section: 'rib', titulaire: fr.elements.titulaire.value, iban: fr.elements.iban.value } };
    });

    // ---------- demande d'envoi par colis : 1 à 5 colis de 20 kg au plus ----------
    var liste = fe.querySelector('[data-colis]'), modele = document.getElementById('modele-colis');
    var lirePoids = function (v) { var n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : 0; };
    var majTotal = function () {
      var t = 0;
      liste.querySelectorAll('[name=poids]').forEach(function (i) { t += lirePoids(i.value); });
      fe.querySelector('[data-total]').textContent = nombre.format(Math.round(t * 10) / 10) + ' kg';
    };
    var numeroter = function () {
      [].forEach.call(liste.children, function (el, i) {
        var champs = el.querySelectorAll('.champ');
        el.querySelector('.colis-titre').textContent = E.colisN.replace('{n}', i + 1);
        champs[0].querySelector('label').htmlFor = champs[0].querySelector('select').id = 'colis-matiere-' + i;
        champs[1].querySelector('label').htmlFor = champs[1].querySelector('input').id = 'colis-poids-' + i;
        el.querySelector('.bouton-retirer').hidden = liste.children.length < 2;
      });
      fe.querySelector('[data-ajouter-colis]').hidden = liste.children.length >= 5;
      majTotal();
    };
    var ajouterColis = function () {
      if (liste.children.length >= 5) return;
      liste.appendChild(modele.content.firstElementChild.cloneNode(true));
      numeroter();
    };
    liste.addEventListener('input', majTotal);
    liste.addEventListener('click', function (e) {
      var b = e.target.closest('.bouton-retirer');
      if (b) { b.closest('.colis').remove(); numeroter(); }
    });
    fe.querySelector('[data-ajouter-colis]').addEventListener('click', function () {
      ajouterColis();
      liste.lastElementChild.querySelector('[name=poids]').focus();
    });
    fe.addEventListener('change', function (e) { if (e.target.name === 'paiement') majRib(); });
    ajouterColis();
    fe.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var msg = message(fe);
      var colis = [].map.call(liste.children, function (el) {
        return { matiere: el.querySelector('[name=matiere]').value, poids: lirePoids(el.querySelector('[name=poids]').value) };
      });
      if (colis.some(function (x) { return !(x.poids > 0) || x.poids > 20; })) return dire(msg, 'colis');
      var paiement = fe.querySelector('[name=paiement]:checked').value;
      if (paiement === 'Virement' && !compte.rib) return dire(msg, 'rib');
      if (!fe.elements.attestation.checked) return dire(msg, 'attestation');
      occupe(fe, true);
      api('POST', 'envoi', { colis: colis, paiement: paiement, message: fe.elements.message.value, attestation: true }).then(function (r) {
        occupe(fe, false);
        if (r.status === 401) return recharger();
        if (r.erreur) return dire(msg, r.erreur);
        dire(msg, '');
        dernier = r.envoi;
        envois.unshift(r.envoi);
        lister();
        fe.hidden = true;
        ok.querySelector('[data-reference]').textContent = r.envoi.reference;
        ok.hidden = false;
        ok.focus();
      });
    });
    espace.querySelector('[data-nouvel-envoi]').addEventListener('click', function () {
      ok.hidden = true;
      fe.reset();
      cocher(fe.querySelector('[name=paiement][value=Virement]'));
      liste.textContent = '';
      ajouterColis();
      fe.hidden = false;
      liste.querySelector('[name=poids]').focus();
    });
    // bordereau : une page à glisser dans le colis, avec la référence en gros, le prix garanti et un QR code que Malik
    // scanne à l'arrivée : il ouvre la demande sur sa page /gestion/ (proposition 52). Styles d'impression de #bordereau ;
    // le QR code est dessiné ici par qrcode-generator (Kazuhiko Arase, licence MIT, vendor/qrcode/), chargé à la demande.
    var chargerQr = function () {
      if (window.qrcode) return Promise.resolve(window.qrcode);
      return new Promise(function (resoudre) {
        var s = document.createElement('script'), base = document.querySelector('script[src$="site.js"]');
        s.src = new URL('vendor/qrcode/qrcode.js', base ? base.src : location.href).href;
        s.onload = function () { resoudre(window.qrcode || null); };
        s.onerror = function () { resoudre(null); };
        document.head.appendChild(s);
      });
    };
    espace.querySelector('[data-imprimer]').addEventListener('click', function () {
      var e = dernier, c = compte, b = document.getElementById('bordereau');
      var x = function (s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
      chargerQr().then(function (qrcode) {
        var lignes = e.colis.map(function (l, i) {
          return '<tr><td>' + x(E.colisN.replace('{n}', i + 1)) + '</td><td>' + x(l.matiere) + '</td><td>' + x(nombre.format(l.poids)) + ' kg</td></tr>';
        }).join('');
        var qr = '';
        if (qrcode) {
          var q = qrcode(0, 'M');
          q.addData('https://ainrecycling.com/gestion/#' + e.reference);
          q.make();
          qr = '<div class="qr-b">' + q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }) + '<span>' + x(S.scanne) + '</span></div>';
        }
        var garanti = e.prix_kg && e.garanti_jusqu
          ? '<p class="garanti-b">' + x(remplacer(S.garanti, { prix: ecrirePrix(e.prix_kg), date: dateDe(e.garanti_jusqu).toLocaleDateString(T.locale, { day: 'numeric', month: 'long', year: 'numeric' }) })) + '</p>' : '';
        b.innerHTML = '<div class="tete-b"><div><img src="' + x(document.querySelector('.logo img').src) + '" alt="Ain Recycling">' +
          '<h1>' + x(E.bordereau) + '</h1><p class="ref-b">' + x(e.reference) + '</p><p>' + x(E.glisser) + '</p></div>' + qr + '</div>' + garanti +
          '<div class="bloc-b"><b>' + x(E.expediteur) + '</b><br>' + x(c.prenom + ' ' + c.nom.toUpperCase()) +
          (c.entreprise ? '<br>' + x(c.entreprise) : '') + '<br>' + x(c.adresse) + '<br>' + x(c.cp + ' ' + c.ville) + '<br>' + x(c.email) + '</div>' +
          '<table><thead><tr><th>' + x(E.colisTitre) + '</th><th>' + x(E.matiere) + '</th><th>' + x(E.poids) + '</th></tr></thead><tbody>' + lignes +
          '<tr><th colspan="2">' + x(E.total) + '</th><th>' + x(nombre.format(e.total)) + ' kg</th></tr></tbody></table>' +
          '<p>' + x(E.paiement) + ' : ' + x(e.paiement === 'Chèque' ? E.cheque : E.virement) + '</p>';
        document.body.classList.add('impression-bordereau');
        window.addEventListener('afterprint', function () { document.body.classList.remove('impression-bordereau'); }, { once: true });
        window.print();
      });
    });

    // ---------- se déconnecter, supprimer le compte ----------
    bandeau.querySelector('[data-deconnexion]').addEventListener('click', function () {
      api('DELETE', 'connexion').then(function () { recharger(); });
    });
    espace.querySelector('[data-supprimer]').addEventListener('click', function () {
      if (!window.confirm(E.confirmer)) return;
      api('DELETE', 'compte').then(function (r) {
        if (r.erreur && r.status !== 401) return window.alert(E[r.erreur] || E.serveur);
        recharger('?compte=supprime');
      });
    });

    // à l'ouverture : déjà connecté ? (cookie du site, lu par le serveur seulement)
    if (new URLSearchParams(location.search).get('compte') === 'supprime') dire(msgCx, 'supprime', true);
    api('GET', 'compte').then(function (r) { if (!r.erreur && r.compte) afficher(r, true); });
  })();

  var annee = document.getElementById('annee');
  if (annee) annee.textContent = new Date().getFullYear();

  // ===== Effets du tour de 21st.dev (27 octobre 2026, version 11) : chacun refait à la main d'après un composant vu sur
  // 21st.dev (nom entre guillemets) ; liste complète du tour dans ../21st-composants/TOUR-21ST.md. Avec « moins
  // d'animations », rien ne bouge ; ce qui suit la souris n'est pas monté sur un écran tactile.
  var souris = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function aChaqueImage(fn) {
    var attente = false;
    return function () {
      if (attente) return;
      attente = true;
      requestAnimationFrame(function () { attente = false; fn(); });
    };
  }

  // Barre de lecture en haut de l'écran : le composant « Scroll Progress » (cnippet-dev, 21st.dev, récupéré le
  // 02/11/2026 ; code d'origine dans 21st-composants/cnippet-dev__scroll-progress), refait sans bibliothèque. Sa
  // longueur suit la part de la page déjà lue à travers son ressort (raideur 200, amortissement 50, masse 1 : sans
  // rebond, elle fait 90 % du chemin en une demi-seconde) ; elle se pose sans glisser à l'ouverture, au retour sur la
  // page et avec « moins d'animations ».
  var lecture = document.createElement('div');
  lecture.className = 'lecture';
  lecture.setAttribute('aria-hidden', 'true');
  lecture.appendChild(document.createElement('span'));
  document.body.appendChild(lecture);
  var lu = -1, luVitesse = 0, luCible = 0, luBoucle = 0, luAvant = 0;
  var poserLecture = function () { lecture.firstChild.style.transform = 'scaleX(' + lu.toFixed(4) + ')'; };
  var ressortLecture = function (t) {
    var dt = luAvant ? Math.min(.05, (t - luAvant) / 1000) : 1 / 60; luAvant = t;
    for (var k = 0, m = Math.ceil(dt / .004), h = dt / m; k < m; k++) { luVitesse += (-200 * (lu - luCible) - 50 * luVitesse) * h; lu += luVitesse * h; }
    if (Math.abs(lu - luCible) < .001 && Math.abs(luVitesse) < .01) { lu = luCible; luVitesse = 0; luBoucle = 0; } else luBoucle = requestAnimationFrame(ressortLecture);
    poserLecture();
  };
  var majLecture = function (direct) {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    luCible = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    if (direct === true || calme || lu < 0) { if (luBoucle) cancelAnimationFrame(luBoucle); luBoucle = 0; lu = luCible; luVitesse = 0; poserLecture(); }
    else if (!luBoucle) { luAvant = 0; luBoucle = requestAnimationFrame(ressortLecture); }
  };
  window.addEventListener('scroll', aChaqueImage(majLecture), { passive: true });
  window.addEventListener('resize', aChaqueImage(majLecture));
  window.addEventListener('pageshow', function () { majLecture(true); });
  majLecture(true);

  // Menu : le composant « Tubelight Navbar » d'ayushmxxn (21st.dev, récupéré le 07/11/2026 ; code d'origine dans
  // 21st-composants/ayushmxxn__tubelight-navbar), refait sans bibliothèque. Une « lampe » (fond pâle tout arrondi, petit
  // tube vert et son halo au-dessus) marque la page affichée ; elle glisse sur le ressort du composant (dans style.css)
  // vers le lien survolé ou pris au clavier, et revient sur la page affichée quand on quitte le menu. Le composant change
  // d'onglet au clic ; ici un clic ouvre une autre page, d'où le survol. Menu en ligne (ordinateur) seulement ; avec
  // « moins d'animations », elle saute directement.
  var liensMenu = menu ? [].slice.call(menu.querySelectorAll('a:not(.btn)')) : [];
  if (liensMenu.length && window.matchMedia) {
    var menuEnLigne = window.matchMedia('(min-width: 1181px)');
    var lampe = document.createElement('span');
    lampe.className = 'menu-lampe';
    lampe.setAttribute('aria-hidden', 'true');
    lampe.innerHTML = '<span class="menu-lampe-tube"><span></span><span></span><span></span></span>';
    menu.insertBefore(lampe, menu.firstChild);
    menu.classList.add('a-lampe');
    var lienPage = menu.querySelector('a[aria-current="page"]:not(.btn)');
    var lienLampe = null;
    var poserLampe = function (lien, sansGlisser) {
      if (lienLampe && lienLampe !== lien) lienLampe.classList.remove('sous-lampe');
      if (!lien || !menuEnLigne.matches) { lampe.classList.remove('allumee'); lienLampe = null; return; }
      // éteinte (première fois, page hors du menu), elle s'allume sur place au lieu d'arriver du bord du menu
      if (sansGlisser || !lampe.classList.contains('allumee')) lampe.style.transition = 'none';
      lampe.style.width = lien.offsetWidth + 'px';
      lampe.style.height = lien.offsetHeight + 'px';
      lampe.style.transform = 'translate(' + lien.offsetLeft + 'px, ' + lien.offsetTop + 'px)';
      if (lampe.style.transition) { lampe.getBoundingClientRect(); lampe.style.transition = ''; }
      lampe.classList.add('allumee');
      lien.classList.add('sous-lampe');
      lienLampe = lien;
    };
    liensMenu.forEach(function (a) {
      a.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') poserLampe(a); });
      a.addEventListener('focus', function () {
        try { if (!a.matches(':focus-visible')) return; } catch (x) { /* navigateur sans :focus-visible */ }
        poserLampe(a);
      });
    });
    menu.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') poserLampe(lienPage); });
    menu.addEventListener('focusout', function (e) { if (!menu.contains(e.relatedTarget)) poserLampe(lienPage); });
    var replacerLampe = function () { poserLampe(lienPage, true); };
    window.addEventListener('resize', aChaqueImage(replacerLampe));
    window.addEventListener('pageshow', replacerLampe);
    if (document.fonts) document.fonts.ready.then(replacerLampe);
    replacerLampe();
  }

  // Surligneur : le composant « Text Highlighter » de danielpetho (21st.dev, récupéré le 30/10/2026), refait sans
  // bibliothèque. Chaque texte surligné s'observe lui-même : l'aplat passe dès qu'un dixième du texte est à l'écran,
  // une seule fois (le mouvement lui-même est dans style.css).
  var aSurligner = document.querySelectorAll('.hero h1 span, .page-hero h1 span, .facon-prix b');
  if ('IntersectionObserver' in window && !calme) {
    var obsSurligne = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('surligne-vu');
        obsSurligne.unobserve(e.target);
      });
    }, { threshold: .1 });
    aSurligner.forEach(function (el) { obsSurligne.observe(el); });
  } else aSurligner.forEach(function (el) { el.classList.add('surligne-vu'); });

  // Bande « carbure » en 5 langues : le composant « Scroll Velocity Text » de cnippet-dev (21st.dev, récupéré le
  // 30/10/2026), refait sans bibliothèque, avec deux rangées en sens contraire comme sa démo « Opposing Rows ». Chaque
  // rangée avance d'1 % de sa longueur par seconde ; la vitesse de défilement de la page, lissée par un ressort (raideur
  // 400, amortissement 50), l'accélère jusqu'à 6 fois, et remonter la page inverse le sens. Les mots viennent de
  // data-mots (jamais traduits). Avec « moins d'animations », la bande ne bouge pas.
  var bandeCarbure = document.querySelector('.bande-carbure');
  if (bandeCarbure) {
    var rangsBande = ['data-mots', 'data-mots-2'].map(function (attr, n) {
      var rang = document.createElement('div');
      rang.className = 'bande-carbure-rang';
      var piste = document.createElement('div');
      piste.className = 'bande-carbure-piste';
      var bloc = document.createElement('div');
      bloc.className = 'bande-carbure-bout';
      (bandeCarbure.getAttribute(attr) || '').split('|').forEach(function (m, i) {
        if (!m) return;
        var s = document.createElement('span');
        s.className = 'bande-carbure-mot' + (i % 2 ? ' creux' : '');
        s.textContent = m;
        var sep = document.createElement('span');
        sep.className = 'bande-carbure-sep';
        bloc.appendChild(s);
        bloc.appendChild(sep);
      });
      piste.appendChild(bloc);
      rang.appendChild(piste);
      bandeCarbure.appendChild(rang);
      // sens 1 : la rangée file vers la gauche ; -1 : vers la droite
      return { rang: rang, piste: piste, bloc: bloc, sensBase: n ? -1 : 1, sens: n ? -1 : 1, x: 0, largeur: 0 };
    }).filter(function (r) { return r.bloc.children.length; });
    var placerRang = function (r) {
      var l = r.largeur || 1, d = ((r.x % l) + l) % l;
      r.piste.style.transform = 'translate3d(' + (-d).toFixed(1) + 'px,0,0)';
    };
    // autant de copies du bloc qu'il en faut pour couvrir la rangée, plus deux (comme le composant)
    var mesurerBande = function () {
      rangsBande.forEach(function (r) {
        r.largeur = r.bloc.scrollWidth;
        var copies = r.largeur > 0 ? Math.max(3, Math.ceil(r.rang.offsetWidth / r.largeur) + 2) : 1;
        while (r.piste.children.length > copies) r.piste.removeChild(r.piste.lastChild);
        while (r.piste.children.length < copies) {
          var copie = r.bloc.cloneNode(true);
          copie.setAttribute('aria-hidden', 'true');
          r.piste.appendChild(copie);
        }
        placerRang(r);
      });
    };
    mesurerBande();
    if ('ResizeObserver' in window) {
      var obsBande = new ResizeObserver(mesurerBande);
      rangsBande.forEach(function (r) { obsBande.observe(r.rang); obsBande.observe(r.bloc); });
    } else window.addEventListener('resize', mesurerBande);
    if (document.fonts) document.fonts.ready.then(mesurerBande);
    if (!calme && 'IntersectionObserver' in window) {
      var boucleBande = 0, tBande = 0, yBande = 0, vLisse = 0, vRessort = 0;
      var avancer = function (t) {
        boucleBande = requestAnimationFrame(avancer);
        var dt = tBande ? Math.min(.04, (t - tBande) / 1000) : 0;
        tBande = t;
        if (!dt) return;
        // vitesse de défilement de la page (px/s), suivie par le ressort
        var y = window.scrollY, brute = (y - yBande) / dt;
        yBande = y;
        for (var reste = dt, h; reste > 0; reste -= h) {
          h = Math.min(reste, .008);
          vRessort += (400 * (brute - vLisse) - 50 * vRessort) * h;
          vLisse += vRessort * h;
        }
        var facteur = Math.min(5, Math.abs(vLisse) / 1000 * 5);
        rangsBande.forEach(function (r) {
          if (facteur > .1) r.sens = r.sensBase * (vLisse < 0 ? -1 : 1);
          if (r.largeur <= 0) return;
          r.x += r.sens * r.largeur / 100 * (1 + facteur) * dt;
          placerRang(r);
        });
      };
      new IntersectionObserver(function (en) {
        if (en[0].isIntersecting && !boucleBande) { tBande = 0; yBande = window.scrollY; boucleBande = requestAnimationFrame(avancer); }
        else if (!en[0].isIntersecting && boucleBande) { cancelAnimationFrame(boucleBande); boucleBande = 0; }
      }).observe(bandeCarbure);
    }
  }

  // Tôle perforée : le composant « Interactive Grid » (Théo Balick, balick sur 21st.dev, licence MIT ; récupéré le
  // 06/11/2026, code d'origine dans ../21st-composants/balick__interactive-grid), refait sans React (dessin dans
  // style.css, .grille-tole). Comme l'original : à chaque mouvement de la souris sur le bloc, la case qu'elle survole
  // s'allume (et le reste tant qu'elle y est) et la précédente s'éteint ; en quittant le bloc, plus rien n'est allumé.
  // Adapté : seules les cases touchées sont dessinées (l'original dessine toutes les cases du bloc, plus de 500 ici) et
  // retirées une fois éteintes ; leurs trous (motif SVG) tombent pile sur ceux de la tôle (--perfore : un trou tous les
  // 16 px, en quinconce). Souris seulement.
  var SVG = 'http://www.w3.org/2000/svg', CASE = 48;
  if (souris) document.querySelectorAll('.hero, .page-hero, #recyclage').forEach(function (bloc, n) {
    if (getComputedStyle(bloc).position === 'static') bloc.style.position = 'relative';
    bloc.classList.add('tole-vivante');
    var grille = document.createElementNS(SVG, 'svg');
    grille.setAttribute('class', 'grille-tole');
    grille.setAttribute('aria-hidden', 'true');
    grille.innerHTML = '<defs><pattern id="trous-allumes-' + n + '" width="16" height="16" patternUnits="userSpaceOnUse">' +
      '<rect width="16" height="16" fill="rgba(35,162,106,.07)"/>' + [[8, 8], [0, 0], [16, 0], [0, 16], [16, 16]].map(function (p) {
        return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.6" fill="rgba(35,162,106,.85)"/>';
      }).join('') + '</pattern></defs>';
    bloc.insertBefore(grille, bloc.firstChild);
    var cases = {}, active = null;
    var eteindre = function (cle) {
      var c = cases[cle];
      if (!c) return;
      c.classList.remove('allumee');
      setTimeout(function () { if (!c.classList.contains('allumee')) { c.remove(); if (cases[cle] === c) delete cases[cle]; } }, 1100);
    };
    bloc.addEventListener('pointermove', function (e) {
      var r = grille.getBoundingClientRect();
      var col = Math.floor((e.clientX - r.left) / CASE), rang = Math.floor((e.clientY - r.top) / CASE);
      var cle = col >= 0 && rang >= 0 && col < Math.ceil(r.width / CASE) ? col + ',' + rang : null;
      if (cle === active) return;
      if (active) eteindre(active);
      active = cle;
      if (!cle) return;
      var c = cases[cle];
      if (!c) {
        c = cases[cle] = document.createElementNS(SVG, 'rect');
        c.setAttribute('x', col * CASE);
        c.setAttribute('y', rang * CASE);
        c.setAttribute('width', CASE);
        c.setAttribute('height', CASE);
        c.setAttribute('fill', 'url(#trous-allumes-' + n + ')');
        grille.appendChild(c);
      }
      c.classList.add('allumee');
    });
    bloc.addEventListener('pointerleave', function () { if (active) eteindre(active); active = null; });
  });

  // Cartes : le composant « Glowing Effect » (Aceternity UI de Manu Arora, manuarora700 sur 21st.dev, licence MIT ; récupéré
  // le 04/11/2026, code d'origine dans ../21st-composants/aceternity__glowing-effect), refait sans React ni motion (dessin
  // dans style.css, .lueur-bord). Comme l'original, avec les réglages de sa démo : à chaque mouvement de la souris (et quand
  // la page défile), chaque carte regarde si la souris est à moins de 64 px d'elle (et pas pile en son centre) ; si oui,
  // l'arc s'allume et glisse en 2 s vers l'angle de la souris vu du centre de la carte, avec la même courbe (0,16 ; 1 ;
  // 0,3 ; 1 : très vite au début, puis tout doucement) ; un nouveau mouvement repart de là où en est l'arc.
  // Corrigé : l'arc prend toujours le chemin le plus court (le reste d'une division en JavaScript peut être négatif : il
  // faisait parfois plus d'un tour). Ajouté : tout s'éteint quand la souris sort de la fenêtre ; avec « moins
  // d'animations », l'arc se pose directement. La carte « Par colis » garde seulement son Border Beam (deux effets sur le
  // même bord, c'était trop).
  if (souris) (function () {
    var cartes = [].map.call(document.querySelectorAll('.offre, .facon:not(.facon-colis), .engagement, .conseil, .frise-carte'), function (carte) {
      if (getComputedStyle(carte).position === 'static') carte.style.position = 'relative';
      var bord = document.createElement('span');
      bord.className = 'lueur-bord';
      bord.setAttribute('aria-hidden', 'true');
      carte.appendChild(bord);
      return { carte: carte, bord: bord, actif: false, angle: 0, de: 0, vers: 0, depart: 0 };
    });
    if (!cartes.length) return;
    var px = -1e4, py = -1e4, mesure = 0, tour = 0;
    // la courbe (0,16 ; 1 ; 0,3 ; 1) : pour une part du temps x, la part du chemin parcourue
    var bezier = function (t, a, b) { return 3 * (1 - t) * (1 - t) * t * a + 3 * (1 - t) * t * t * b + t * t * t; };
    var courbe = function (x) {
      var bas = 0, haut = 1, t = x;
      for (var i = 0; i < 24; i++) { t = (bas + haut) / 2; if (bezier(t, 0.16, 0.3) < x) bas = t; else haut = t; }
      return bezier(t, 1, 1);
    };
    var tourner = function (maintenant) {
      tour = 0;
      var encore = false;
      cartes.forEach(function (c) {
        if (c.angle === c.vers) return;
        var p = Math.min(1, Math.max(0, (maintenant - c.depart) / 2000));
        c.angle = p < 1 ? c.de + (c.vers - c.de) * courbe(p) : c.vers;
        c.bord.style.setProperty('--debut', c.angle.toFixed(2));
        if (p < 1) encore = true;
      });
      if (encore) tour = requestAnimationFrame(tourner);
    };
    var mesurer = function () {
      mesure = 0;
      var boites = cartes.map(function (c) { return c.carte.getBoundingClientRect(); }); // toutes les mesures d'abord
      var maintenant = performance.now();
      cartes.forEach(function (c, i) {
        var r = boites[i], cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var actif = Math.hypot(px - cx, py - cy) >= 0.5 * Math.min(r.width, r.height) * 0.01 &&
          px > r.left - 64 && px < r.right + 64 && py > r.top - 64 && py < r.bottom + 64;
        if (actif !== c.actif) { c.actif = actif; c.bord.style.setProperty('--actif', actif ? '1' : '0'); }
        if (!actif) return;
        var cible = Math.atan2(py - cy, px - cx) * 180 / Math.PI + 90;
        c.de = c.angle;
        c.vers = c.angle + (((cible - c.angle + 180) % 360 + 360) % 360 - 180);
        c.depart = maintenant;
        if (calme) { c.angle = c.de = c.vers; c.bord.style.setProperty('--debut', c.angle.toFixed(2)); }
      });
      if (!calme && !tour) tour = requestAnimationFrame(tourner);
    };
    var demander = function () { if (!mesure) mesure = requestAnimationFrame(mesurer); };
    document.body.addEventListener('pointermove', function (e) { px = e.clientX; py = e.clientY; demander(); }, { passive: true });
    window.addEventListener('scroll', demander, { passive: true });
    document.documentElement.addEventListener('pointerleave', function () { px = py = -1e4; demander(); });
  })();

  // Carte « Par colis » : le composant « Border Beam » (larsen66 sur 21st.dev, bibliothèque border-beam de Jakub Antalik,
  // licence MIT ; récupéré le 01/11/2026, code d'origine dans ../21st-composants/larsen66__border-beam), refait sans React
  // (dessin dans style.css). Comme son réglage « active » : l'arc apparaît, tourne, puis s'efface. Adapté : il fait un peu
  // plus de deux tours quand la carte arrive à l'écran, au survol ou au clavier, puis s'efface (un effet qui bouge plus de
  // 5 secondes à côté d'un texte doit pouvoir s'arrêter) ; rien avec « moins d'animations ».
  if (!calme) document.querySelectorAll('.facon-colis').forEach(function (carte) {
    var faisceau = document.createElement('span');
    faisceau.className = 'faisceau';
    faisceau.setAttribute('aria-hidden', 'true');
    faisceau.appendChild(document.createElement('span')).className = 'faisceau-halo';
    carte.style.position = 'relative';
    carte.appendChild(faisceau);
    var fin = 0;
    var eteindre = function () {
      clearTimeout(fin);
      if (!faisceau.classList.contains('actif')) return;
      faisceau.classList.remove('actif');
      faisceau.classList.add('s-efface');
    };
    var allumer = function () {
      clearTimeout(fin);
      faisceau.classList.remove('s-efface');
      faisceau.classList.add('actif');
      fin = setTimeout(eteindre, 4500);
    };
    faisceau.addEventListener('animationend', function (e) {
      if (e.target === faisceau && e.animationName === 'faisceau-sortie') faisceau.classList.remove('s-efface');
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) allumer();
        else { clearTimeout(fin); faisceau.classList.remove('actif', 's-efface'); }
      }, { threshold: .35 }).observe(carte);
    } else allumer();
    carte.addEventListener('pointerenter', allumer);
    carte.addEventListener('focusin', allumer);
  });

  // Choix entre deux options : le composant « Segmented Control » (ddoemonn, 21st.dev, récupéré le 01/11/2026, code
  // d'origine dans ../21st-composants/ddoemonn__segmented-control), refait sans React ni bibliothèque. Les vrais boutons
  // radio restent dessous ; une pastille glisse vers celui qui est coché, sur le même ressort que le composant (raideur
  // 520, amortissement 34, masse 0,45), et une copie des libellés glisse en sens inverse dedans pour que le texte change
  // de couleur exactement au bord de la pastille. Début / Fin au clavier comme le composant ; avec « moins
  // d'animations », la pastille saute directement.
  document.querySelectorAll('.choix').forEach(function (choix) {
    var options = [].filter.call(choix.children, function (el) { return el.tagName === 'LABEL'; });
    var radios = options.map(function (l) { return l.querySelector('input[type="radio"]'); });
    var n = options.length;
    if (n < 2 || radios.some(function (r) { return !r || !r.nextElementSibling; })) return;
    var pouce = document.createElement('div');
    pouce.className = 'choix-pouce';
    pouce.setAttribute('aria-hidden', 'true');
    var masque = pouce.appendChild(document.createElement('div'));
    masque.className = 'choix-masque';
    var copie = masque.appendChild(document.createElement('div'));
    copie.className = 'choix-copie';
    radios.forEach(function (r) { copie.appendChild(r.nextElementSibling.cloneNode(true)); });
    choix.appendChild(pouce);
    choix.style.setProperty('--n', n);
    choix.classList.add('segmente');

    var pos = -1, vitesse = 0, cible = 0, boucle = 0, avant = 0;
    var poser = function () {
      pouce.style.transform = 'translateX(' + (pos * 100).toFixed(3) + '%)';
      masque.style.transform = 'translateX(' + (-pos * 100).toFixed(3) + '%)';
    };
    var coche = function () {
      for (var i = 0; i < n; i++) if (radios[i].checked) return i;
      return 0;
    };
    var ressort = function (t) {
      var dt = avant ? Math.min(.05, (t - avant) / 1000) : 1 / 60;
      avant = t;
      // petits pas de 4 ms au plus pour que le ressort reste juste, même à 30 images par seconde
      for (var k = 0, m = Math.ceil(dt / .004), h = dt / m; k < m; k++) {
        vitesse += (-520 * (pos - cible) - 34 * vitesse) / .45 * h;
        pos += vitesse * h;
      }
      if (Math.abs(pos - cible) < .001 && Math.abs(vitesse) < .01) { pos = cible; vitesse = 0; boucle = 0; }
      else boucle = requestAnimationFrame(ressort);
      poser();
    };
    var suivre = function (anime) {
      cible = coche();
      if (!anime || calme || pos < 0) {
        if (boucle) cancelAnimationFrame(boucle);
        boucle = 0; pos = cible; vitesse = 0; poser();
      } else if (!boucle) { avant = 0; boucle = requestAnimationFrame(ressort); }
    };
    choix.addEventListener('change', function () { suivre(true); });
    choix.addEventListener('keydown', function (e) {
      if (e.key !== 'Home' && e.key !== 'End') return;
      var r = radios[e.key === 'Home' ? 0 : n - 1];
      e.preventDefault();
      r.focus();
      if (r.checked) return;
      r.checked = true;
      r.dispatchEvent(new Event('input', { bubbles: true }));
      r.dispatchEvent(new Event('change', { bubbles: true }));
    });
    window.addEventListener('pageshow', function () { suivre(false); });
    suivre(false);
  });

  // Bande « Vous avez du carbure à vendre ? » : les pièces flottent et suivent la souris. Le vrai composant « Parallax
  // Floating » de Daniel Petho (fancycomponents.dev ; 21st.dev, id de démo 656, licence MIT, récupéré le 08/11/2026,
  // https://21st.dev/@danielpetho/components/parallax-floating ; code d'origine dans
  // 21st-composants/danielpetho__parallax-floating), refait sans React ni bibliothèque. Comme le composant : à chaque
  // image, chaque pièce vise la position de la souris multipliée par (profondeur × sensibilité ÷ 20) et ne fait que 5 %
  // du chemin restant (« easingFactor » 0,05), déplacée en translate3d ; la souris compte même hors de la bande. Comme la
  // démo : sensibilité négative (les pièces partent à l'opposé de la souris) et pièces qui apparaissent une à une (0,5 s,
  // 0,15 s d'écart). Adapté : souris comptée depuis le centre de la bande et non depuis son coin en haut à gauche (les
  // pièces restent autour de leur place), sensibilité -0,6 au lieu de -1 (elles ne passent pas sur le texte), boucle
  // arrêtée hors de l'écran et une fois les pièces arrivées. Souris seulement ; rien avec « moins d'animations ».
  var flottants = document.querySelector('.flottants');
  if (flottants) {
    var bandeAppel = flottants.parentNode;
    var pieces = [].slice.call(flottants.querySelectorAll('.flottant')).map(function (f) {
      return { el: f, profondeur: parseFloat(f.getAttribute('data-profondeur')) || 1, x: 0, y: 0 };
    });
    if (!calme && 'IntersectionObserver' in window) {
      flottants.classList.add('a-venir');
      var bandeVue = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        bandeVue.disconnect();
        pieces.forEach(function (p, i) { p.el.style.transitionDelay = (i * 0.15).toFixed(2) + 's'; });
        flottants.classList.remove('a-venir');
      }, { threshold: 0.15 });
      bandeVue.observe(bandeAppel);
    }
    if (souris && !calme && 'IntersectionObserver' in window) {
      var SENSIBILITE = -0.6, AMORTI = 0.05;
      var sx = 0, sy = 0, bandeEnVue = false, imageFlot = 0;
      var flotter = function () {
        imageFlot = 0;
        var encore = false;
        pieces.forEach(function (p) {
          var force = p.profondeur * SENSIBILITE / 20;
          var ex = sx * force - p.x, ey = sy * force - p.y;
          p.x += ex * AMORTI;
          p.y += ey * AMORTI;
          if (Math.abs(ex) > 0.1 || Math.abs(ey) > 0.1) encore = true;
          p.el.style.transform = 'translate3d(' + p.x.toFixed(2) + 'px, ' + p.y.toFixed(2) + 'px, 0)';
        });
        if (encore && bandeEnVue) imageFlot = requestAnimationFrame(flotter);
      };
      var relancerFlot = function () { if (!imageFlot && bandeEnVue) imageFlot = requestAnimationFrame(flotter); };
      window.addEventListener('mousemove', function (e) {
        if (!bandeEnVue) return;
        var r = bandeAppel.getBoundingClientRect();
        sx = e.clientX - (r.left + r.width / 2);
        sy = e.clientY - (r.top + r.height / 2);
        relancerFlot();
      }, { passive: true });
      new IntersectionObserver(function (es) { bandeEnVue = es[0].isIntersecting; relancerFlot(); }).observe(bandeAppel);
    }
  }

  // Texte qui s'éclaire mot à mot pendant qu'on le lit : le composant « Reading Text Reveal » de waleedkibhen (21st.dev,
  // récupéré le 31/10/2026, https://21st.dev/@waleedkibhen/components/reading-text-reveal), refait sans React. Une ligne
  // de lecture à 62 % de la hauteur de l'écran : les mots s'allument dans l'ordre à mesure que le texte la passe, et
  // l'avance rattrape le défilement en douceur (12 % de l'écart à chaque image), mot après mot, même après un grand coup
  // de molette. Pas de découpage avec « moins d'animations » : le texte reste à l'encre.
  var aReveler = document.querySelector('#recyclage .intro');
  if (aReveler && !calme) {
    var mots = [];
    [].slice.call(aReveler.childNodes).forEach(function (n) {
      if (n.nodeType !== 3) return;
      var frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(function (bout) {
        if (!bout) return;
        if (/^\s+$/.test(bout)) { frag.appendChild(document.createTextNode(bout)); return; }
        var s = document.createElement('span');
        s.className = 'mot';
        s.textContent = bout;
        mots.push(s);
        frag.appendChild(s);
      });
      aReveler.replaceChild(frag, n);
    });
    aReveler.classList.add('revele');
    var LIGNE_YEUX = .62, cible = 0, avance = 0, nLus = -1, boucleMots = 0, imagePrec = 0;
    var allumer = function (n) {
      if (n === nLus) return;
      nLus = n;
      mots.forEach(function (m, i) { m.classList.toggle('lu', i < n); });
    };
    var rattraper = function (t) {
      // 12 % de l'écart par image à 60 images/s comme le composant, et la même allure sur un écran à 120 Hz
      var dt = imagePrec ? Math.min(.1, (t - imagePrec) / 1000) : 1 / 60;
      imagePrec = t;
      avance += (cible - avance) * (1 - Math.pow(.88, dt * 60));
      if (Math.abs(cible - avance) > .001) {
        allumer(Math.floor(avance * mots.length));
        boucleMots = requestAnimationFrame(rattraper);
      } else {
        avance = cible;
        boucleMots = 0;
        allumer(Math.floor(cible * mots.length));
      }
    };
    var majRevele = function () {
      // 0 quand le haut du texte arrive sur la ligne de lecture, 1 quand son bas l'a passée
      var r = aReveler.getBoundingClientRect();
      cible = Math.max(0, Math.min(1, (window.innerHeight * LIGNE_YEUX - r.top) / Math.max(1, r.height)));
      if (boucleMots) return;
      if (Math.abs(cible - avance) > .001) { imagePrec = 0; boucleMots = requestAnimationFrame(rattraper); }
      else allumer(Math.floor(cible * mots.length));
    };
    window.addEventListener('scroll', majRevele, { passive: true });
    window.addEventListener('resize', majRevele);
    majRevele();
  }

  // Photos des cartes : le composant « MagnifierLens » (Zhouqi Bao, baozhouqi sur 21st.dev, sans licence indiquée : voir
  // sa NOTE.md ; récupéré le 06/11/2026, code d'origine dans ../21st-composants/baozhouqi__magnifier-lens), refait sans
  // React ni framer-motion (dessin dans style.css, .loupe et .loupe-verre). Comme l'original : une copie de la photo,
  // agrandie autour du point visé, découpée en rond sous la souris, avec le verre par-dessus ; à l'entrée, elle grandit de
  // 58 % à 100 % ; à la sortie, elle rétrécit à 80 % en s'effaçant (0,3 s, ease-out). Ordinateur seulement ; avec « moins
  // d'animations », elle apparaît et disparaît sans changer de taille.
  if (souris) document.querySelectorAll('.offre-photo').forEach(function (cadre) {
    var img = cadre.querySelector('img');
    if (!img) return;
    var loupe = document.createElement('span');
    loupe.className = 'loupe';
    loupe.setAttribute('aria-hidden', 'true');
    var copie = loupe.appendChild(img.cloneNode(false));
    copie.alt = '';
    var verre = document.createElement('span');
    verre.className = 'loupe-verre';
    verre.setAttribute('aria-hidden', 'true');
    cadre.classList.add('avec-loupe');
    cadre.append(loupe, verre);
    var ex = 0, ey = 0;
    var placer = function () {
      var r = cadre.getBoundingClientRect();
      cadre.style.setProperty('--lx', (ex - r.left).toFixed(1) + 'px');
      cadre.style.setProperty('--ly', (ey - r.top).toFixed(1) + 'px');
    };
    var suivre = aChaqueImage(placer);
    var animer = function (images) {
      [loupe, verre].forEach(function (el) { el.animate(images, { duration: 300, easing: 'ease-out', fill: 'forwards' }); });
    };
    cadre.addEventListener('pointerenter', function (e) {
      ex = e.clientX; ey = e.clientY; placer();
      animer([{ opacity: 0, scale: calme ? 1 : 0.58 }, { opacity: 1, scale: 1 }]);
    });
    cadre.addEventListener('pointermove', function (e) { ex = e.clientX; ey = e.clientY; suivre(); });
    cadre.addEventListener('pointerleave', function () { animer([{ opacity: 0, scale: calme ? 1 : 0.8 }]); });
  });

  // Pied de page : le composant « Halftone Wordmark Footer » de kedhareswer (21st.dev, récupéré le 29/10/2026), refait
  // sans React. « AIN RECYCLING » en très grand, coupé par le bas, imprimé en points de trame sur un canevas qui couvre
  // tout le pied de page : chaque point est d'autant plus gros que la lettre couvre sa case. Les points s'écartent autour
  // de la souris sur des ressorts et verdissent quand on les pousse ; un clic ou un toucher envoie une onde dans les
  // lettres ; grain d'impression sur tout le fond. Mêmes calculs que le composant (ressort, onde, taille et couleur des
  // points) ; il ne dessine que quand quelque chose bouge et que le pied de page est à l'écran. Avec « moins
  // d'animations », le mot est dessiné mais ne bouge pas.
  var pied = document.querySelector('.pied:not(.pied-simple)');
  var trame = pied ? document.createElement('canvas') : null;
  var ctxT = trame && trame.getContext ? trame.getContext('2d') : null;
  if (ctxT && 'ResizeObserver' in window && 'IntersectionObserver' in window) {
    var MOT = 'AIN RECYCLING', POIDS = 600, ROGNE = .2, GRAIN = .5, RAYON = 80;
    var bandeMot = document.createElement('div');
    bandeMot.className = 'pied-mot';
    bandeMot.setAttribute('aria-hidden', 'true');
    trame.className = 'pied-trame';
    trame.setAttribute('aria-hidden', 'true');
    pied.insertBefore(trame, pied.firstChild);
    pied.appendChild(bandeMot);
    pied.classList.add('avec-mot');
    var stylePied = getComputedStyle(pied);
    var police = stylePied.getPropertyValue('--police').trim() || 'sans-serif';
    var rvb = function (hex, defaut) {
      var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || '').trim());
      if (!m) return defaut;
      var c = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1];
      return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
    };
    var encre = rvb(stylePied.getPropertyValue('--pied-encre'), [142, 167, 220]);
    var chaud = rvb(stylePied.getPropertyValue('--pied-chaud'), [147, 212, 177]);
    var encreTexte = 'rgb(' + encre.join(',') + ')', fondPied = stylePied.backgroundColor;
    var lT = 0, hT = 0, dprT = 1, pxT = -1e5, pyT = -1e5, rafT = 0, visibleT = true, eveilT = true;
    var onde = { x: 0, y: 0, t: -1 }, pts = new Float32Array(0), nbPts = 0, motifGrain = null;
    // grain d'impression : une tuile de bruit tirée une fois, posée sur chaque image
    var grain = document.createElement('canvas');
    grain.width = grain.height = 256;
    var ctxGrain = grain.getContext('2d'), bruit = ctxGrain.createImageData(256, 256);
    for (var q = 0; q < bruit.data.length; q += 4) {
      bruit.data[q] = bruit.data[q + 1] = bruit.data[q + 2] = Math.random() * 255;
      bruit.data[q + 3] = Math.random() < .5 ? 0 : 255;
    }
    ctxGrain.putImageData(bruit, 0, 0);

    var mettreEnPage = function () {
      lT = Math.max(1, Math.round(pied.getBoundingClientRect().width));
      // le mot à la taille qui remplit la largeur (un peu plus : ses bords sont rognés)
      var masque = document.createElement('canvas');
      var m = masque.getContext('2d', { willReadFrequently: true });
      m.font = POIDS + ' 100px ' + police;
      var taille = Math.min(lT, 1920) * 1.02 / Math.max(1, m.measureText(MOT).width) * 100;
      m.font = POIDS + ' ' + taille + 'px ' + police;
      var cap = m.measureText(MOT).actualBoundingBoxAscent || taille * .72;
      // coupé par le bas du pied de page ; mais quand le bas est réservé à la barre de boutons du téléphone, le mot
      // s'arrêterait au milieu de rien : il est alors entier
      var rogne = parseFloat(getComputedStyle(pied).paddingBottom) > 0 ? 0 : ROGNE;
      // bande réservée au mot sous le texte du pied de page : sa partie visible et un peu d'air au-dessus
      var hb = Math.max(1, Math.round(cap * (1 - rogne) + Math.min(56, cap * .3)));
      bandeMot.style.height = hb + 'px';
      var rp = pied.getBoundingClientRect();
      hT = Math.max(1, Math.round(rp.height));
      var haut0 = Math.round(bandeMot.getBoundingClientRect().top - rp.top);
      dprT = Math.min(window.devicePixelRatio || 1, 2);
      trame.width = Math.round(lT * dprT);
      trame.height = Math.round(hT * dprT);
      // le mot sur un masque de la taille de la bande, coupé par son bas
      masque.width = lT;
      masque.height = hb;
      m.font = POIDS + ' ' + taille + 'px ' + police;
      m.fillStyle = '#000';
      m.textBaseline = 'alphabetic';
      m.fillText(MOT, (lT - m.measureText(MOT).width) / 2, hb + cap * rogne);
      var img = m.getImageData(0, 0, lT, hb).data;
      // un point par case (couverture lue sur 3 × 3 pixels) ; cases plus petites sur un petit écran, sinon les lettres
      // seraient trop grossières
      var pas = lT < 640 ? 3 : lT < 1100 ? 4 : 6, tmp = [];
      for (var gy = 0; gy < Math.ceil(hb / pas); gy++) {
        for (var gx = 0; gx < Math.ceil(lT / pas); gx++) {
          var somme = 0;
          for (var sy = 0; sy < 3; sy++) {
            for (var sx = 0; sx < 3; sx++) {
              var x = Math.min(lT - 1, Math.floor(gx * pas + (sx + .5) * pas / 3));
              var y = Math.min(hb - 1, Math.floor(gy * pas + (sy + .5) * pas / 3));
              somme += img[(y * lT + x) * 4 + 3];
            }
          }
          var couv = somme / (9 * 255);
          if (couv < .06) continue;
          var hx = gx * pas + pas / 2, hy = haut0 + gy * pas + pas / 2;
          tmp.push(hx, hy, 0, 0, hx, hy, Math.sqrt(Math.min(1, couv)) * pas * .56);
        }
      }
      pts = new Float32Array(tmp);
      nbPts = tmp.length / 7;
      motifGrain = ctxT.createPattern(grain, 'repeat');
      eveilT = true;
    };

    var dessinerTrame = function (t) {
      ctxT.setTransform(dprT, 0, 0, dprT, 0, 0);
      ctxT.fillStyle = fondPied;
      ctxT.fillRect(0, 0, lT, hT);
      var r = calme ? 0 : RAYON, age = onde.t < 0 ? 1e9 : t - onde.t, rOnde = age * .9, bouge = false;
      for (var i = 0; i < nbPts; i++) {
        var j = i * 7, x = pts[j], y = pts[j + 1], vx = pts[j + 2], vy = pts[j + 3], hx = pts[j + 4], hy = pts[j + 5];
        if (!calme) {
          // l'onde du clic : une couronne qui s'élargit et repousse les points qu'elle traverse
          if (age < 900) {
            var ox = hx - onde.x, oy = hy - onde.y, od = Math.sqrt(ox * ox + oy * oy) + .001;
            var couronne = 1 - Math.min(1, Math.abs(od - rOnde) / 26);
            if (couronne > 0) { var fo = couronne * 3.2 * (1 - age / 900); vx += ox / od * fo; vy += oy / od * fo; }
          }
          // la souris repousse, le ressort ramène chaque point à sa place
          var dx = x - pxT, dy = y - pyT, d2 = dx * dx + dy * dy;
          if (r > 0 && d2 < r * r) { var d = Math.sqrt(d2) + .001, f = (1 - d / r) * 2.6; vx += dx / d * f; vy += dy / d * f; }
          vx = (vx + (hx - x) * .05) * .84;
          vy = (vy + (hy - y) * .05) * .84;
          x += vx;
          y += vy;
          if (Math.abs(vx) + Math.abs(vy) > .02 || Math.abs(x - hx) + Math.abs(y - hy) > .05) bouge = true;
          else { x = hx; y = hy; vx = 0; vy = 0; }
          pts[j] = x; pts[j + 1] = y; pts[j + 2] = vx; pts[j + 3] = vy;
        }
        // plus un point est poussé loin de sa place, plus il verdit
        var k = Math.min(1, Math.sqrt((x - hx) * (x - hx) + (y - hy) * (y - hy)) / 28);
        ctxT.fillStyle = k > .02 ? 'rgb(' + Math.round(encre[0] + (chaud[0] - encre[0]) * k) + ',' +
          Math.round(encre[1] + (chaud[1] - encre[1]) * k) + ',' + Math.round(encre[2] + (chaud[2] - encre[2]) * k) + ')' : encreTexte;
        ctxT.beginPath();
        ctxT.arc(x, y, pts[j + 6], 0, 6.2832);
        ctxT.fill();
      }
      if (motifGrain) {
        ctxT.globalAlpha = GRAIN * .09;
        ctxT.globalCompositeOperation = 'overlay';
        ctxT.fillStyle = motifGrain;
        ctxT.fillRect(0, 0, lT, hT);
        ctxT.globalAlpha = 1;
        ctxT.globalCompositeOperation = 'source-over';
      }
      // il s'endort quand tout est revenu en place et que rien ne pousse
      eveilT = bouge || age < 900 || pxT > -1e4;
    };

    var boucleT = function (t) {
      rafT = 0;
      if (!visibleT) return;
      dessinerTrame(t);
      if (eveilT) rafT = requestAnimationFrame(boucleT);
    };
    var reveillerT = function () {
      eveilT = true;
      if (!rafT && visibleT) rafT = requestAnimationFrame(boucleT);
    };
    var localT = function (e) { var b = trame.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
    if (!calme) {
      pied.addEventListener('pointermove', function (e) { var p = localT(e); pxT = p[0]; pyT = p[1]; reveillerT(); });
      pied.addEventListener('pointerleave', function () { pxT = pyT = -1e5; reveillerT(); });
      pied.addEventListener('pointerdown', function (e) {
        if (e.target.closest('a, button')) return;
        var p = localT(e);
        onde = { x: p[0], y: p[1], t: performance.now() };
        reveillerT();
      });
    }
    var refaire = function () { mettreEnPage(); dessinerTrame(performance.now()); reveillerT(); };
    refaire();
    // la mise en page change la hauteur du pied de page : elle se fait à l'image suivante, pas pendant l'observation
    var attenteT = false;
    new ResizeObserver(function () {
      if (attenteT) return;
      attenteT = true;
      requestAnimationFrame(function () { attenteT = false; refaire(); });
    }).observe(pied);
    new IntersectionObserver(function (en) { visibleT = en[0].isIntersecting; if (visibleT) reveillerT(); }).observe(pied);
    // le mot est refait dans la vraie police dès qu'elle est chargée
    if (document.fonts) {
      document.fonts.load(POIDS + ' 100px "IBM Plex Sans"').then(refaire, function () {});
      document.fonts.ready.then(refaire);
    }
  }
})();
