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

  // Menu replié (tablette, téléphone) : une feuille sous l'en-tête, sur toute la largeur (9 nov. 2026, proposition 109) ;
  // la page derrière ne défile plus tant qu'il est ouvert
  function fermerMenu() {
    if (!menu || !menuBouton) return;
    menu.classList.remove('ouvert');
    if (entete) entete.classList.remove('menu-ouvert');
    document.documentElement.classList.remove('menu-ouvert-page');
    menuBouton.setAttribute('aria-expanded', 'false');
    menuBouton.setAttribute('aria-label', T.ouvrir);
  }
  if (menuBouton) menuBouton.addEventListener('click', function () {
    if (menu.classList.contains('ouvert')) return fermerMenu();
    document.documentElement.style.setProperty('--haut-menu', Math.max(0, Math.round(entete.getBoundingClientRect().bottom)) + 'px');
    menu.classList.add('ouvert');
    entete.classList.add('menu-ouvert');
    document.documentElement.classList.add('menu-ouvert-page');
    menuBouton.setAttribute('aria-expanded', 'true');
    menuBouton.setAttribute('aria-label', T.fermer);
  });
  if (menu) menu.addEventListener('click', function (e) { if (e.target.closest('a')) fermerMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { fermerMenu(); fermerMenuCompte(); } });
  window.addEventListener('resize', function () { if (window.innerWidth > 1180) fermerMenu(); });

  // Compte dans l'en-tête (9 nov. 2026, propositions 67 et 73) : « Se connecter » et « Créer un compte » ; une fois connecté,
  // les initiales et le prénom, avec un petit menu. Le prénom est gardé dans le navigateur par la page du compte (rien de
  // secret : la connexion elle-même reste le cookie lu par le serveur) et effacé à la déconnexion.
  var TC = ({
    fr: { monCompte: 'Mon compte', demandes: 'Mes demandes', envoyer: 'Envoyer un colis', profil: 'Mon profil', sortir: 'Se déconnecter', fermerAnnonce: 'Fermer l\'annonce', menuCompte: 'Menu de mon compte' },
    de: { monCompte: 'Mein Konto', demandes: 'Meine Anfragen', envoyer: 'Paket senden', profil: 'Mein Profil', sortir: 'Abmelden', fermerAnnonce: 'Hinweis schließen', menuCompte: 'Menü meines Kontos' },
    en: { monCompte: 'My account', demandes: 'My requests', envoyer: 'Send a parcel', profil: 'My profile', sortir: 'Sign out', fermerAnnonce: 'Close notice', menuCompte: 'My account menu' },
    it: { monCompte: 'Il mio account', demandes: 'Le mie richieste', envoyer: 'Inviare un pacco', profil: 'Il mio profilo', sortir: 'Esci', fermerAnnonce: 'Chiudi l\'avviso', menuCompte: 'Menu del mio account' },
    es: { monCompte: 'Mi cuenta', demandes: 'Mis solicitudes', envoyer: 'Enviar un paquete', profil: 'Mi perfil', sortir: 'Cerrar sesión', fermerAnnonce: 'Cerrar el aviso', menuCompte: 'Menú de mi cuenta' },
  })[document.documentElement.lang] || null;
  if (!TC) TC = { monCompte: 'Mon compte', demandes: 'Mes demandes', envoyer: 'Envoyer un colis', profil: 'Mon profil', sortir: 'Se déconnecter', fermerAnnonce: 'Fermer l\'annonce', menuCompte: 'Menu de mon compte' };
  var IC = function (d) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"></path></svg>'; };
  var compteLu = function () { try { return JSON.parse(localStorage.getItem('ain-compte') || 'null'); } catch (e) { return null; } };
  function memoCompte(c) {
    try {
      if (c && c.prenom) localStorage.setItem('ain-compte', JSON.stringify({ prenom: String(c.prenom).slice(0, 40), nom: String(c.nom || '').slice(0, 1) }));
      else localStorage.removeItem('ain-compte');
    } catch (e) { /* navigateur sans mémoire : l'en-tête garde « Se connecter » */ }
    majCompteEntete();
  }
  var lienCompte = document.querySelector('[data-compte-lien]');
  var menuCompte = null;
  function fermerMenuCompte() {
    if (!menuCompte) return;
    menuCompte.remove(); menuCompte = null;
    if (lienCompte) lienCompte.setAttribute('aria-expanded', 'false');
  }
  function seDeconnecter() {
    fetch('/api/espace/connexion', { method: 'DELETE', credentials: 'same-origin' }).catch(function () {}).then(function () {
      memoCompte(null);
      location.href = 'espace-client.html';
    });
  }
  function majCompteEntete() {
    var c = compteLu();
    var blocMenu = document.querySelector('[data-compte-menu]');
    var creer = document.querySelector('.entete-actions .btn-creer');
    if (!lienCompte) return;
    var x = function (s) { return String(s).replace(/[&<>"]/g, function (k) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[k]; }); };
    if (c && c.prenom) {
      var ini = (c.prenom.charAt(0) + (c.nom || '')).toUpperCase();
      lienCompte.classList.add('connecte');
      lienCompte.setAttribute('aria-haspopup', 'menu');
      lienCompte.setAttribute('aria-expanded', 'false');
      lienCompte.setAttribute('aria-label', TC.menuCompte);
      lienCompte.innerHTML = '<span class="initiales" aria-hidden="true">' + x(ini) + '</span><span class="prenom">' + x(c.prenom) + '</span>' + IC('m6 9 6 6 6-6').replace('class="ic"', 'class="ic chevron"');
      if (creer) creer.hidden = true;
      if (blocMenu) blocMenu.innerHTML = '<a href="espace-client.html" class="btn btn-primaire">' + x(TC.monCompte) + '</a><button type="button" class="btn btn-contour" data-sortir>' + x(TC.sortir) + '</button>';
    } else {
      lienCompte.classList.remove('connecte');
      lienCompte.removeAttribute('aria-haspopup'); lienCompte.removeAttribute('aria-expanded'); lienCompte.removeAttribute('aria-label');
      if (creer) creer.hidden = false;
    }
  }
  if (lienCompte) {
    majCompteEntete();
    lienCompte.addEventListener('click', function (e) {
      var c = compteLu();
      if (!c || !c.prenom) return; // pas connecté : le lien mène à la page de connexion
      e.preventDefault();
      if (menuCompte) return fermerMenuCompte();
      var x = function (s) { return String(s).replace(/[&<>"]/g, function (k) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[k]; }); };
      menuCompte = document.createElement('div');
      menuCompte.className = 'compte-menu';
      menuCompte.innerHTML = '<div class="qui"><b>' + x(c.prenom) + '</b><span>' + x(TC.monCompte) + '</span></div>'
        + '<a href="espace-client.html">' + IC('M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z') + x(TC.monCompte) + '</a>'
        + '<a href="espace-client.html#demandes">' + IC('M21 8 12 3 3 8v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8') + x(TC.demandes) + '</a>'
        + '<a href="espace-client.html#envoi">' + IC('M22 2 11 13M22 2l-7 20-4-9-9-4z') + x(TC.envoyer) + '</a>'
        + '<a href="espace-client.html#profil">' + IC('M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z') + x(TC.profil) + '</a>'
        + '<hr><button type="button" data-sortir>' + IC('M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9') + x(TC.sortir) + '</button>';
      lienCompte.parentNode.appendChild(menuCompte);
      lienCompte.setAttribute('aria-expanded', 'true');
      var premier = menuCompte.querySelector('a');
      if (premier) premier.focus();
    });
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-sortir]')) { e.preventDefault(); seDeconnecter(); return; }
      if (menuCompte && !e.target.closest('.compte-menu') && !e.target.closest('[data-compte-lien]')) fermerMenuCompte();
    });
  }

  // Pied de page : rubriques ouvertes sur ordinateur, repliées sur téléphone (un appui les ouvre) (proposition 107)
  var piedGroupes = document.querySelectorAll('.pied-groupe');
  if (piedGroupes.length) {
    var petitEcran = window.matchMedia('(max-width: 640px)');
    var majPied = function () { piedGroupes.forEach(function (d) { d.open = !petitEcran.matches; }); };
    majPied();
    if (petitEcran.addEventListener) petitEcran.addEventListener('change', majPied); else if (petitEcran.addListener) petitEcran.addListener(majPied);
    piedGroupes.forEach(function (d) {
      d.querySelector('summary').addEventListener('click', function (e) { if (!petitEcran.matches) e.preventDefault(); });
    });
  }

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
      // une croix ferme l'annonce pour la visite (proposition 104) ; sur téléphone, une ligne qu'un appui ouvre en entier
      var cle = visibles.map(function (a) { return a.type + a.debut + a.fin; }).join('|');
      var dejaFermee = '';
      try { dejaFermee = sessionStorage.getItem('annonce-fermee') || ''; } catch (e) { /* sans mémoire : l'annonce reste */ }
      var croix = document.createElement('button');
      croix.type = 'button';
      croix.className = 'annonce-fermer';
      croix.setAttribute('aria-label', TC.fermerAnnonce);
      croix.innerHTML = IC('M18 6 6 18M6 6l12 12');
      croix.addEventListener('click', function () {
        boite.remove();
        try { sessionStorage.setItem('annonce-fermee', cle); } catch (e) { /* rien */ }
      });
      boite.firstChild.appendChild(croix);
      boite.addEventListener('click', function (e) {
        var l = e.target.closest('.annonce-site');
        if (l && e.target.tagName === 'P') l.classList.toggle('deplie');
      });
      var repere = document.querySelector('.barre-info') || document.getElementById('entete');
      if (repere && dejaFermee !== cle) repere.parentNode.insertBefore(boite, repere);
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

  // Mon compte (3e revue, 9 nov. 2026) : textes écrits par site.js, dans les 5 langues (les textes de la page elle-même
  // sont traduits par outils/traduire.mjs)
  var COMPTE = {
    fr: { depuis: 'Client depuis {mois}', enCours: 'Ma demande en cours', etapes: ['Demande', 'Étiquette', 'Dépôt', 'Pesée', 'Paiement'],
      etats: ['Demande reçue', 'Étiquette envoyée', 'Colis reçu', 'Pesé', 'Payé'],
      longues: ['Demande reçue', 'Étiquette prépayée envoyée', 'Dépôt de votre colis', 'Réception et pesée filmée', 'Paiement'],
      p0: ['Nous préparons votre étiquette', 'Elle vous est envoyée par e-mail sous 24 h ouvrées. Vous pouvez déjà imprimer le bordereau.'],
      p1: ['À vous : déposez votre colis', 'Collez l\'étiquette reçue par e-mail et déposez le colis au plus tard le {date} pour garder votre prix.'],
      p2: ['Nous pesons votre colis', 'Devant la caméra : le colis fermé, puis le carbure seul. La vidéo et votre bon d\'achat suivent.'],
      p3: ['Votre paiement arrive', 'Sous 48 h ouvrées après la pesée, par {paiement}.'],
      imprimer: 'Imprimer le bordereau', voirSuivi: 'Voir le suivi', prixGaranti: 'Votre prix garanti', encore: 'encore {n} jours', encore1: 'dernier jour',
      garantiJusqu: 'Garanti jusqu\'au {date}, pour un colis déposé d\'ici là.', prixJour: 'Le prix du jour',
      prixJourTexte: 'Garanti 7 jours dès votre demande, jusqu\'à la fin du mois au plus tard.', venduEn: 'Vendu en {annee}',
      nVentes: 'ventes', nVente: 'vente', kgCarbure: 'de carbure', payes: 'payés', votreCompte: 'Votre compte', complet: 'Votre compte est complet à {p} %',
      coord: 'Coordonnées', piece: 'Pièce d\'identité', ribVir: 'RIB, pour être payé par virement', completer: 'Compléter mon compte',
      vide: ['Pas encore de demande', 'Préparez votre carbure dans un carton solide : en 3 minutes, la demande est faite et l\'étiquette est offerte.', 'Envoyer mon premier colis'],
      videEtapes: ['<b>Demande en ligne</b> · 3 minutes', '<b>Étiquette offerte</b> · sous 24 h ouvrées', '<b>Payé sous 48 h ouvrées</b> après la pesée filmée'],
      dernieres: 'Mes dernières ventes', toutVoir: 'Tout voir', ongletEnCours: 'En cours', ongletFinies: 'Terminées', aucuneEnCours: 'Aucune demande en cours.',
      aucuneFinie: 'Aucune demande terminée pour le moment.', retour: 'Mes demandes', envoyeeLe: 'Envoyée le {date}', suivi: 'Le suivi', envoi: 'Votre envoi',
      aFaire: 'À faire au plus tard le {date}', pesee: 'Le colis fermé, puis le carbure seul : la vidéo vous est envoyée',
      paiementSous: 'Sous 48 h ouvrées après la pesée, avec votre bon d\'achat', net: 'Poids net : {kg} kg', question: 'Une question sur cette demande ?',
      questionTexte: 'Malik vous répond du lundi au vendredi, de 8 h à 18 h.', questionWa: 'Bonjour, j\'ai une question sur ma demande {ref}.',
      ventesVide: 'Vos ventes apparaîtront ici après le paiement de votre premier colis.', brut: 'Poids brut (colis fermé)', netL: 'Poids net (carbure)',
      prix: 'Prix', montant: 'Montant', payeLe: 'Payé le {date}', bon: 'Bon d\'achat {n}', redemander: 'Redemander mon bon',
      redemande: 'C\'est demandé : Malik vous renvoie votre bon.', deja: 'Déjà redemandé aujourd\'hui : Malik vous le renvoie.',
      nom: 'Nom', entreprise: 'Entreprise', adresse: 'Adresse', tel: 'Téléphone', mail: 'E-mail', vide2: 'Non renseigné',
      valide: 'Valide', bientot: 'Expire bientôt', expiree: 'Expirée', valideJusqu: '{type} · valide jusqu\'au {date}', deposee: '{type} · déposée le {date}',
      titulaire: 'Titulaire : {nom}', voir: 'Voir en entier', cacher: 'Cacher', bulle: 'Enregistré', prevenirOk: 'Préférence enregistrée',
      telephone_whatsapp: 'Ajoutez d\'abord votre numéro de téléphone dans vos informations.', lien_expire: 'Ce lien n\'est plus valable : demandez un nouveau code.',
      supprimeGarde: 'Votre compte est fermé. Votre identité et votre pièce d\'identité restent gardées pour justifier vos ventes.',
      creerNom: 'Indiquez votre prénom et votre nom.', creerSiret: 'Indiquez le nom de l\'entreprise et son SIRET (14 chiffres).',
      cgu: 'Cochez la case pour accepter les conditions.', renvoyer: 'Renvoyer le code ({s} s)', renvoyerOk: 'Renvoyer le code',
      rColis: 'Colis', rColisTexte: '{n} colis · {kg} kg à peu près', rPaiement: 'Paiement', rEtiquette: 'Expéditeur sur l\'étiquette',
      rPrix: 'Prix garanti', rPrixTexte: '{prix} €/kg jusqu\'au {date}', modifier: 'Modifier', introuvable: 'Introuvable.', deja2: 'Déjà demandé aujourd\'hui.' },
    de: { depuis: 'Kunde seit {mois}', enCours: 'Meine laufende Anfrage', etapes: ['Anfrage', 'Etikett', 'Abgabe', 'Wiegung', 'Zahlung'],
      etats: ['Anfrage erhalten', 'Etikett verschickt', 'Paket erhalten', 'Gewogen', 'Bezahlt'],
      longues: ['Anfrage erhalten', 'Vorausbezahltes Etikett verschickt', 'Abgabe Ihres Pakets', 'Eingang und gefilmte Wiegung', 'Zahlung'],
      p0: ['Wir bereiten Ihr Etikett vor', 'Sie erhalten es innerhalb von 24 Std. (Werktage) per E-Mail. Den Versandschein können Sie schon drucken.'],
      p1: ['Jetzt sind Sie dran: Paket abgeben', 'Kleben Sie das per E-Mail erhaltene Etikett auf und geben Sie das Paket spätestens am {date} ab, damit Ihr Preis gilt.'],
      p2: ['Wir wiegen Ihr Paket', 'Vor der Kamera: das geschlossene Paket, dann das Hartmetall allein. Video und Ankaufsbeleg folgen.'],
      p3: ['Ihre Zahlung kommt', 'Innerhalb von 48 Std. (Werktage) nach der Wiegung, per {paiement}.'],
      imprimer: 'Versandschein drucken', voirSuivi: 'Verlauf ansehen', prixGaranti: 'Ihr garantierter Preis', encore: 'noch {n} Tage', encore1: 'letzter Tag',
      garantiJusqu: 'Garantiert bis {date}, für ein bis dahin abgegebenes Paket.', prixJour: 'Der Tagespreis',
      prixJourTexte: '7 Tage ab Ihrer Anfrage garantiert, längstens bis zum Monatsende.', venduEn: 'Verkauft {annee}',
      nVentes: 'Verkäufe', nVente: 'Verkauf', kgCarbure: 'Hartmetall', payes: 'bezahlt', votreCompte: 'Ihr Konto', complet: 'Ihr Konto ist zu {p} % vollständig',
      coord: 'Kontaktdaten', piece: 'Ausweis', ribVir: 'Bankverbindung, für eine Zahlung per Überweisung', completer: 'Konto vervollständigen',
      vide: ['Noch keine Anfrage', 'Packen Sie Ihr Hartmetall in einen stabilen Karton: In 3 Minuten ist die Anfrage gestellt und das Etikett kostenlos.', 'Mein erstes Paket senden'],
      videEtapes: ['<b>Online-Anfrage</b> · 3 Minuten', '<b>Kostenloses Etikett</b> · innerhalb von 24 Std. (Werktage)', '<b>Bezahlt innerhalb von 48 Std.</b> nach der gefilmten Wiegung'],
      dernieres: 'Meine letzten Verkäufe', toutVoir: 'Alle ansehen', ongletEnCours: 'Laufend', ongletFinies: 'Abgeschlossen', aucuneEnCours: 'Keine laufende Anfrage.',
      aucuneFinie: 'Noch keine abgeschlossene Anfrage.', retour: 'Meine Anfragen', envoyeeLe: 'Gesendet am {date}', suivi: 'Der Verlauf', envoi: 'Ihre Sendung',
      aFaire: 'Spätestens am {date}', pesee: 'Das geschlossene Paket, dann das Hartmetall allein: Sie erhalten das Video',
      paiementSous: 'Innerhalb von 48 Std. (Werktage) nach der Wiegung, mit Ihrem Ankaufsbeleg', net: 'Nettogewicht: {kg} kg', question: 'Eine Frage zu dieser Anfrage?',
      questionTexte: 'Malik antwortet Ihnen montags bis freitags von 8 bis 18 Uhr.', questionWa: 'Guten Tag, ich habe eine Frage zu meiner Anfrage {ref}.',
      ventesVide: 'Ihre Verkäufe erscheinen hier nach der Zahlung Ihres ersten Pakets.', brut: 'Bruttogewicht (geschlossenes Paket)', netL: 'Nettogewicht (Hartmetall)',
      prix: 'Preis', montant: 'Betrag', payeLe: 'Bezahlt am {date}', bon: 'Ankaufsbeleg {n}', redemander: 'Beleg erneut anfordern',
      redemande: 'Angefordert: Malik schickt Ihnen Ihren Beleg erneut.', deja: 'Heute schon angefordert: Malik schickt ihn Ihnen.',
      nom: 'Name', entreprise: 'Unternehmen', adresse: 'Adresse', tel: 'Telefon', mail: 'E-Mail', vide2: 'Nicht angegeben',
      valide: 'Gültig', bientot: 'Läuft bald ab', expiree: 'Abgelaufen', valideJusqu: '{type} · gültig bis {date}', deposee: '{type} · hochgeladen am {date}',
      titulaire: 'Kontoinhaber: {nom}', voir: 'Vollständig anzeigen', cacher: 'Verbergen', bulle: 'Gespeichert', prevenirOk: 'Einstellung gespeichert',
      telephone_whatsapp: 'Geben Sie zuerst Ihre Telefonnummer bei Ihren Angaben an.', lien_expire: 'Dieser Link ist nicht mehr gültig: Fordern Sie einen neuen Code an.',
      supprimeGarde: 'Ihr Konto ist geschlossen. Ihre Identität und Ihr Ausweis bleiben zum Nachweis Ihrer Verkäufe gespeichert.',
      creerNom: 'Geben Sie Ihren Vor- und Nachnamen an.', creerSiret: 'Geben Sie den Namen des Unternehmens und seine SIRET (14 Ziffern) an.',
      cgu: 'Kreuzen Sie das Kästchen an, um die Bedingungen zu akzeptieren.', renvoyer: 'Code erneut senden ({s} s)', renvoyerOk: 'Code erneut senden',
      rColis: 'Pakete', rColisTexte: '{n} Paket(e) · etwa {kg} kg', rPaiement: 'Zahlung', rEtiquette: 'Absender auf dem Etikett',
      rPrix: 'Garantierter Preis', rPrixTexte: '{prix} €/kg bis {date}', modifier: 'Ändern', introuvable: 'Nicht gefunden.', deja2: 'Heute schon angefordert.' },
    en: { depuis: 'Customer since {mois}', enCours: 'My current request', etapes: ['Request', 'Label', 'Drop-off', 'Weighing', 'Payment'],
      etats: ['Request received', 'Label sent', 'Parcel received', 'Weighed', 'Paid'],
      longues: ['Request received', 'Prepaid label sent', 'Dropping off your parcel', 'Receipt and filmed weighing', 'Payment'],
      p0: ['We are preparing your label', 'It will be emailed to you within 24 h (working days). You can already print the shipping slip.'],
      p1: ['Your turn: drop off your parcel', 'Stick on the label you received by email and drop the parcel off by {date} at the latest to keep your price.'],
      p2: ['We are weighing your parcel', 'On camera: the closed parcel, then the carbide on its own. The video and your purchase receipt will follow.'],
      p3: ['Your payment is on its way', 'Within 48 h (working days) after the weighing, by {paiement}.'],
      imprimer: 'Print the shipping slip', voirSuivi: 'See the tracking', prixGaranti: 'Your guaranteed price', encore: '{n} days left', encore1: 'last day',
      garantiJusqu: 'Guaranteed until {date}, for a parcel dropped off by then.', prixJour: 'Today\'s price',
      prixJourTexte: 'Guaranteed for 7 days from your request, until the end of the month at the latest.', venduEn: 'Sold in {annee}',
      nVentes: 'sales', nVente: 'sale', kgCarbure: 'of carbide', payes: 'paid', votreCompte: 'Your account', complet: 'Your account is {p}% complete',
      coord: 'Contact details', piece: 'ID document', ribVir: 'Bank details, to be paid by bank transfer', completer: 'Complete my account',
      vide: ['No request yet', 'Pack your carbide in a sturdy box: in 3 minutes the request is done and the label is free.', 'Send my first parcel'],
      videEtapes: ['<b>Online request</b> · 3 minutes', '<b>Free label</b> · within 24 h (working days)', '<b>Paid within 48 h</b> after the filmed weighing'],
      dernieres: 'My latest sales', toutVoir: 'See all', ongletEnCours: 'In progress', ongletFinies: 'Completed', aucuneEnCours: 'No request in progress.',
      aucuneFinie: 'No completed request yet.', retour: 'My requests', envoyeeLe: 'Sent on {date}', suivi: 'Tracking', envoi: 'Your shipment',
      aFaire: 'By {date} at the latest', pesee: 'The closed parcel, then the carbide on its own: the video is sent to you',
      paiementSous: 'Within 48 h (working days) after the weighing, with your purchase receipt', net: 'Net weight: {kg} kg', question: 'A question about this request?',
      questionTexte: 'Malik answers Monday to Friday, 8 am to 6 pm.', questionWa: 'Hello, I have a question about my request {ref}.',
      ventesVide: 'Your sales will appear here once your first parcel has been paid.', brut: 'Gross weight (closed parcel)', netL: 'Net weight (carbide)',
      prix: 'Price', montant: 'Amount', payeLe: 'Paid on {date}', bon: 'Purchase receipt {n}', redemander: 'Ask for my receipt again',
      redemande: 'Done: Malik will send you your receipt again.', deja: 'Already asked today: Malik will send it to you.',
      nom: 'Name', entreprise: 'Company', adresse: 'Address', tel: 'Phone', mail: 'Email', vide2: 'Not given',
      valide: 'Valid', bientot: 'Expires soon', expiree: 'Expired', valideJusqu: '{type} · valid until {date}', deposee: '{type} · uploaded on {date}',
      titulaire: 'Account holder: {nom}', voir: 'Show in full', cacher: 'Hide', bulle: 'Saved', prevenirOk: 'Preference saved',
      telephone_whatsapp: 'First add your phone number to your details.', lien_expire: 'This link is no longer valid: ask for a new code.',
      supprimeGarde: 'Your account is closed. Your identity and ID document are kept to justify your sales.',
      creerNom: 'Enter your first name and last name.', creerSiret: 'Enter the company name and its SIRET (14 digits).',
      cgu: 'Tick the box to accept the terms.', renvoyer: 'Send the code again ({s} s)', renvoyerOk: 'Send the code again',
      rColis: 'Parcels', rColisTexte: '{n} parcel(s) · about {kg} kg', rPaiement: 'Payment', rEtiquette: 'Sender on the label',
      rPrix: 'Guaranteed price', rPrixTexte: '{prix} €/kg until {date}', modifier: 'Change', introuvable: 'Not found.', deja2: 'Already asked today.' },
    it: { depuis: 'Cliente dal {mois}', enCours: 'La mia richiesta in corso', etapes: ['Richiesta', 'Etichetta', 'Consegna', 'Pesatura', 'Pagamento'],
      etats: ['Richiesta ricevuta', 'Etichetta inviata', 'Pacco ricevuto', 'Pesato', 'Pagato'],
      longues: ['Richiesta ricevuta', 'Etichetta prepagata inviata', 'Consegna del pacco', 'Ricevimento e pesatura filmata', 'Pagamento'],
      p0: ['Prepariamo la vostra etichetta', 'Vi viene inviata per e-mail entro 24 h (giorni lavorativi). Potete già stampare la distinta.'],
      p1: ['Tocca a voi: consegnate il pacco', 'Incollate l\'etichetta ricevuta per e-mail e consegnate il pacco entro il {date} per mantenere il prezzo.'],
      p2: ['Pesiamo il vostro pacco', 'Davanti alla telecamera: il pacco chiuso, poi il metallo duro da solo. Il video e il buono d\'acquisto seguono.'],
      p3: ['Il pagamento sta arrivando', 'Entro 48 h (giorni lavorativi) dopo la pesatura, tramite {paiement}.'],
      imprimer: 'Stampare la distinta', voirSuivi: 'Vedere il tracciamento', prixGaranti: 'Il vostro prezzo garantito', encore: 'ancora {n} giorni', encore1: 'ultimo giorno',
      garantiJusqu: 'Garantito fino al {date}, per un pacco consegnato entro quella data.', prixJour: 'Il prezzo del giorno',
      prixJourTexte: 'Garantito 7 giorni dalla richiesta, al più tardi fino alla fine del mese.', venduEn: 'Venduto nel {annee}',
      nVentes: 'vendite', nVente: 'vendita', kgCarbure: 'di metallo duro', payes: 'pagati', votreCompte: 'Il vostro account', complet: 'Il vostro account è completo al {p}%',
      coord: 'Recapiti', piece: 'Documento d\'identità', ribVir: 'IBAN, per essere pagati con bonifico', completer: 'Completare l\'account',
      vide: ['Ancora nessuna richiesta', 'Preparate il metallo duro in una scatola robusta: in 3 minuti la richiesta è fatta e l\'etichetta è gratuita.', 'Inviare il mio primo pacco'],
      videEtapes: ['<b>Richiesta online</b> · 3 minuti', '<b>Etichetta gratuita</b> · entro 24 h (giorni lavorativi)', '<b>Pagati entro 48 h</b> dopo la pesatura filmata'],
      dernieres: 'Le mie ultime vendite', toutVoir: 'Vedere tutto', ongletEnCours: 'In corso', ongletFinies: 'Concluse', aucuneEnCours: 'Nessuna richiesta in corso.',
      aucuneFinie: 'Ancora nessuna richiesta conclusa.', retour: 'Le mie richieste', envoyeeLe: 'Inviata il {date}', suivi: 'Il tracciamento', envoi: 'La vostra spedizione',
      aFaire: 'Al più tardi il {date}', pesee: 'Il pacco chiuso, poi il metallo duro da solo: il video vi viene inviato',
      paiementSous: 'Entro 48 h (giorni lavorativi) dopo la pesatura, con il buono d\'acquisto', net: 'Peso netto: {kg} kg', question: 'Una domanda su questa richiesta?',
      questionTexte: 'Malik risponde dal lunedì al venerdì, dalle 8 alle 18.', questionWa: 'Buongiorno, ho una domanda sulla mia richiesta {ref}.',
      ventesVide: 'Le vostre vendite appariranno qui dopo il pagamento del primo pacco.', brut: 'Peso lordo (pacco chiuso)', netL: 'Peso netto (metallo duro)',
      prix: 'Prezzo', montant: 'Importo', payeLe: 'Pagato il {date}', bon: 'Buono d\'acquisto {n}', redemander: 'Richiedere di nuovo il buono',
      redemande: 'Fatto: Malik vi rimanda il buono.', deja: 'Già richiesto oggi: Malik ve lo rimanda.',
      nom: 'Nome', entreprise: 'Azienda', adresse: 'Indirizzo', tel: 'Telefono', mail: 'E-mail', vide2: 'Non indicato',
      valide: 'Valido', bientot: 'Scade presto', expiree: 'Scaduto', valideJusqu: '{type} · valido fino al {date}', deposee: '{type} · caricato il {date}',
      titulaire: 'Intestatario: {nom}', voir: 'Vedere per intero', cacher: 'Nascondere', bulle: 'Salvato', prevenirOk: 'Preferenza salvata',
      telephone_whatsapp: 'Aggiungete prima il vostro numero di telefono nei vostri dati.', lien_expire: 'Questo link non è più valido: chiedete un nuovo codice.',
      supprimeGarde: 'Il vostro account è chiuso. La vostra identità e il documento restano conservati per giustificare le vendite.',
      creerNom: 'Indicate nome e cognome.', creerSiret: 'Indicate il nome dell\'azienda e il suo SIRET (14 cifre).',
      cgu: 'Spuntate la casella per accettare le condizioni.', renvoyer: 'Rinviare il codice ({s} s)', renvoyerOk: 'Rinviare il codice',
      rColis: 'Pacchi', rColisTexte: '{n} pacco/i · circa {kg} kg', rPaiement: 'Pagamento', rEtiquette: 'Mittente sull\'etichetta',
      rPrix: 'Prezzo garantito', rPrixTexte: '{prix} €/kg fino al {date}', modifier: 'Modificare', introuvable: 'Non trovato.', deja2: 'Già richiesto oggi.' },
    es: { depuis: 'Cliente desde {mois}', enCours: 'Mi solicitud en curso', etapes: ['Solicitud', 'Etiqueta', 'Entrega', 'Pesaje', 'Pago'],
      etats: ['Solicitud recibida', 'Etiqueta enviada', 'Paquete recibido', 'Pesado', 'Pagado'],
      longues: ['Solicitud recibida', 'Etiqueta prepagada enviada', 'Entrega de su paquete', 'Recepción y pesaje filmado', 'Pago'],
      p0: ['Preparamos su etiqueta', 'Se la enviamos por correo electrónico en 24 h (días laborables). Ya puede imprimir la hoja de envío.'],
      p1: ['Le toca: entregue su paquete', 'Pegue la etiqueta recibida por correo y entregue el paquete a más tardar el {date} para conservar su precio.'],
      p2: ['Pesamos su paquete', 'Delante de la cámara: el paquete cerrado y luego el metal duro solo. El vídeo y su justificante de compra le llegarán.'],
      p3: ['Su pago está en camino', 'En 48 h (días laborables) tras el pesaje, por {paiement}.'],
      imprimer: 'Imprimir la hoja de envío', voirSuivi: 'Ver el seguimiento', prixGaranti: 'Su precio garantizado', encore: 'quedan {n} días', encore1: 'último día',
      garantiJusqu: 'Garantizado hasta el {date}, para un paquete entregado antes de esa fecha.', prixJour: 'El precio del día',
      prixJourTexte: 'Garantizado 7 días desde su solicitud, como máximo hasta final de mes.', venduEn: 'Vendido en {annee}',
      nVentes: 'ventas', nVente: 'venta', kgCarbure: 'de metal duro', payes: 'pagados', votreCompte: 'Su cuenta', complet: 'Su cuenta está completa al {p} %',
      coord: 'Datos de contacto', piece: 'Documento de identidad', ribVir: 'Datos bancarios, para cobrar por transferencia', completer: 'Completar mi cuenta',
      vide: ['Aún no hay solicitudes', 'Prepare su metal duro en una caja resistente: en 3 minutos la solicitud está hecha y la etiqueta es gratuita.', 'Enviar mi primer paquete'],
      videEtapes: ['<b>Solicitud en línea</b> · 3 minutos', '<b>Etiqueta gratuita</b> · en 24 h (días laborables)', '<b>Pagado en 48 h</b> tras el pesaje filmado'],
      dernieres: 'Mis últimas ventas', toutVoir: 'Ver todo', ongletEnCours: 'En curso', ongletFinies: 'Terminadas', aucuneEnCours: 'Ninguna solicitud en curso.',
      aucuneFinie: 'Aún no hay solicitudes terminadas.', retour: 'Mis solicitudes', envoyeeLe: 'Enviada el {date}', suivi: 'El seguimiento', envoi: 'Su envío',
      aFaire: 'A más tardar el {date}', pesee: 'El paquete cerrado y luego el metal duro solo: le enviamos el vídeo',
      paiementSous: 'En 48 h (días laborables) tras el pesaje, con su justificante de compra', net: 'Peso neto: {kg} kg', question: '¿Una pregunta sobre esta solicitud?',
      questionTexte: 'Malik le responde de lunes a viernes, de 8 a 18 h.', questionWa: 'Hola, tengo una pregunta sobre mi solicitud {ref}.',
      ventesVide: 'Sus ventas aparecerán aquí tras el pago de su primer paquete.', brut: 'Peso bruto (paquete cerrado)', netL: 'Peso neto (metal duro)',
      prix: 'Precio', montant: 'Importe', payeLe: 'Pagado el {date}', bon: 'Justificante de compra {n}', redemander: 'Volver a pedir mi justificante',
      redemande: 'Hecho: Malik le vuelve a enviar su justificante.', deja: 'Ya pedido hoy: Malik se lo envía.',
      nom: 'Nombre', entreprise: 'Empresa', adresse: 'Dirección', tel: 'Teléfono', mail: 'Correo', vide2: 'Sin indicar',
      valide: 'Válido', bientot: 'Caduca pronto', expiree: 'Caducado', valideJusqu: '{type} · válido hasta el {date}', deposee: '{type} · subido el {date}',
      titulaire: 'Titular: {nom}', voir: 'Ver completo', cacher: 'Ocultar', bulle: 'Guardado', prevenirOk: 'Preferencia guardada',
      telephone_whatsapp: 'Añada primero su número de teléfono en sus datos.', lien_expire: 'Este enlace ya no es válido: pida un código nuevo.',
      supprimeGarde: 'Su cuenta está cerrada. Su identidad y su documento se conservan para justificar sus ventas.',
      creerNom: 'Indique su nombre y apellidos.', creerSiret: 'Indique el nombre de la empresa y su SIRET (14 cifras).',
      cgu: 'Marque la casilla para aceptar las condiciones.', renvoyer: 'Volver a enviar el código ({s} s)', renvoyerOk: 'Volver a enviar el código',
      rColis: 'Paquetes', rColisTexte: '{n} paquete(s) · unos {kg} kg', rPaiement: 'Pago', rEtiquette: 'Remitente en la etiqueta',
      rPrix: 'Precio garantizado', rPrixTexte: '{prix} €/kg hasta el {date}', modifier: 'Cambiar', introuvable: 'No encontrado.', deja2: 'Ya pedido hoy.' },
  };

  // Mon compte (anciennement « Espace client » ; 3e revue, 9 nov. 2026, propositions 69 à 93 choisies par Malik) :
  // connexion par un code reçu par e-mail ou par le bouton « Me connecter » de l'e-mail, création du compte (prénom, nom,
  // particulier ou entreprise), puis le compte : tableau de bord, demandes et leur suivi en 5 étapes (Delivery progress,
  // 21st.dev), ventes, envoi d'un colis en 3 étapes, profil. Le serveur est celui du site (serveur/espace.php, en PHP,
  // joint par /api/espace du .htaccess). Les photos de la pièce sont réduites ici en JPEG avant l'envoi.
  var connexion = document.getElementById('connexion');
  var espace = document.getElementById('espace-sections');
  if (connexion && espace) (function () {
    var lang = document.documentElement.lang;
    var E = Object.assign({}, ESPACE.fr, ESPACE[lang] || {}, COMPTE.fr, COMPTE[lang] || {});
    var ouverture = Date.now(), compte = null, envois = [], dernier = null, photos = {};
    var accueil = document.getElementById('espace-accueil'), avantages = document.getElementById('espace-avantages');
    var bandeau = document.getElementById('espace-connecte');
    var nombre = new Intl.NumberFormat(T.locale, { maximumFractionDigits: 1 });
    var argent = new Intl.NumberFormat(T.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    var argentRond = new Intl.NumberFormat(T.locale, { maximumFractionDigits: 0 });
    var jour = function (iso) { return new Date(iso).toLocaleDateString(T.locale, { day: 'numeric', month: 'long', year: 'numeric' }); };
    var heure = function (iso) { return new Date(iso).toLocaleTimeString(T.locale, { hour: '2-digit', minute: '2-digit' }); };
    var x = function (s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; };
    var ic = function (d) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"></path></svg>'; };
    var P = {
      check: 'M20 6 9 17l-5-5', box: 'M21 8 12 3 3 8v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8', chev: 'M9 18l6-6-6-6', back: 'M15 18l-6-6 6-6',
      printer: 'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
      clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2', circle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
      tag: 'M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z',
      scale: 'M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0zM8 21h8',
      euro: 'M4 10h12M4 14h9M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2',
      chat: 'M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.9-.9L3 21l1.9-5.1A8.4 8.4 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5z',
      user: 'M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z', pin: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
      phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z',
      mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6',
      building: 'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18zM6 12H4a2 2 0 0 0-2 2v8h4M18 9h2a2 2 0 0 1 2 2v11h-4M10 6h4M10 10h4M10 14h4M10 18h4',
      send: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
    };
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
    // bulle en bas de l'écran après un enregistrement (proposition 89)
    var bulleEl = espace.querySelector('[data-bulle]'), bulleMinuteur = 0;
    var bulle = function (texte) {
      bulleEl.innerHTML = ic(P.check) + x(texte);
      bulleEl.hidden = false;
      clearTimeout(bulleMinuteur);
      bulleMinuteur = setTimeout(function () { bulleEl.hidden = true; }, 3000);
    };
    var prixDuJour = function () { return infos && infos.prix && Number(infos.prix.kg) > 0 ? Number(infos.prix.kg) : PRIX_PAGES; };

    // ---------- connexion : se connecter ou créer un compte, l'adresse, puis le code ----------
    var etapeEmail = connexion.querySelector('[data-etape-connexion="email"]');
    var etapeCode = connexion.querySelector('[data-etape-connexion="code"]');
    var cxEmail = document.getElementById('cx-email'), cxCode = document.getElementById('cx-code'), msgCx = message(connexion);
    var cases = connexion.querySelector('.code-cases'), boutonRenvoyer = connexion.querySelector('[data-renvoyer]');
    var mode = 'connexion', compteARebours = 0;
    function changerMode(m) {
      mode = m;
      connexion.querySelectorAll('[data-mode]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === m)); });
      connexion.querySelectorAll('[data-creation]').forEach(function (el) { el.hidden = m !== 'creation'; });
      ['titre', 'sous', 'bouton'].forEach(function (k) {
        connexion.querySelector('[data-' + k + '-connexion]').hidden = m !== 'connexion';
        connexion.querySelector('[data-' + k + '-creation]').hidden = m !== 'creation';
      });
      etapeCode.hidden = true;
      etapeEmail.hidden = false;
      dire(msgCx, '');
    }
    connexion.querySelectorAll('[data-mode]').forEach(function (b) { b.addEventListener('click', function () { changerMode(b.getAttribute('data-mode')); }); });
    connexion.addEventListener('change', function (e) {
      if (e.target.name === 'cr-profil') connexion.querySelector('[data-cr-pro]').hidden = e.target.value !== 'professionnel';
    });
    var invalide = function (champ, code) {
      dire(msgCx, code);
      champ.setAttribute('aria-invalid', 'true');
      champ.focus();
      return null;
    };
    // les informations du nouveau compte (« Créer un compte ») : prénom, nom, et pour une entreprise sa raison sociale et son SIRET
    var lireCreation = function () {
      var v = function (n) { return connexion.querySelector('[name="' + n + '"]'); };
      connexion.querySelectorAll('[aria-invalid]').forEach(function (c) { c.removeAttribute('aria-invalid'); });
      var cr = { prenom: v('cr-prenom').value.trim(), nom: v('cr-nom').value.trim(), profil: connexion.querySelector('[name=cr-profil]:checked').value,
        entreprise: v('cr-entreprise').value.trim(), siret: v('cr-siret').value.replace(/\s/g, '') };
      if (!cr.prenom) return invalide(v('cr-prenom'), 'creerNom');
      if (!cr.nom) return invalide(v('cr-nom'), 'creerNom');
      if (cr.profil === 'professionnel' && !cr.entreprise) return invalide(v('cr-entreprise'), 'creerSiret');
      if (cr.profil === 'professionnel' && !/^\d{14}$/.test(cr.siret)) return invalide(v('cr-siret'), 'creerSiret');
      return cr;
    };
    var majCases = function () {
      var v = cxCode.value.replace(/\D/g, '').slice(0, 6);
      if (cxCode.value !== v) cxCode.value = v;
      cases.querySelectorAll('span').forEach(function (s, i) { s.textContent = v.charAt(i); s.classList.toggle('actif', i === Math.min(v.length, 5)); });
      cases.classList.remove('erreur');
      return v;
    };
    cxCode.addEventListener('input', function () { if (majCases().length === 6) connexion.requestSubmit ? connexion.requestSubmit() : connexion.dispatchEvent(new Event('submit', { cancelable: true })); });
    cxCode.addEventListener('focus', function () { cases.classList.add('focus'); majCases(); });
    cxCode.addEventListener('blur', function () { cases.classList.remove('focus'); });
    var lancerRebours = function () {
      var s = 30;
      clearInterval(compteARebours);
      boutonRenvoyer.disabled = true;
      boutonRenvoyer.textContent = remplacer(E.renvoyer, { s: s });
      compteARebours = setInterval(function () {
        s--;
        if (s > 0) { boutonRenvoyer.textContent = remplacer(E.renvoyer, { s: s }); return; }
        clearInterval(compteARebours);
        boutonRenvoyer.disabled = false;
        boutonRenvoyer.textContent = E.renvoyerOk;
      }, 1000);
    };
    var demanderCode = function () {
      var email = cxEmail.value.trim(), creation = null;
      if (mode === 'creation') {
        creation = lireCreation();
        if (!creation) return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return invalide(cxEmail, 'email');
      cxEmail.removeAttribute('aria-invalid');
      if (mode === 'creation' && !connexion.querySelector('[name=cgu]').checked) return invalide(connexion.querySelector('[name=cgu]'), 'cgu');
      occupe(connexion, true);
      api('POST', 'code', { email: email, langue: lang, site: connexion.querySelector('[name=site]').value, duree: Date.now() - ouverture, creation: creation })
        .then(function (r) {
          occupe(connexion, false);
          if (r.erreur) return dire(msgCx, r.erreur);
          dire(msgCx, '');
          connexion.querySelector('[data-email]').textContent = email;
          etapeEmail.hidden = true;
          etapeCode.hidden = false;
          cxCode.value = '';
          majCases();
          lancerRebours();
          cxCode.focus();
        });
    };
    connexion.addEventListener('submit', function (e) {
      e.preventDefault();
      if (etapeCode.hidden) return demanderCode();
      var code = majCases();
      if (code.length !== 6) { dire(msgCx, 'code6'); cxCode.focus(); return; }
      occupe(connexion, true);
      api('POST', 'connexion', { email: cxEmail.value.trim(), code: code, langue: lang }).then(function (r) {
        occupe(connexion, false);
        if (r.erreur) { dire(msgCx, r.erreur); cases.classList.add('erreur'); cxCode.value = ''; majCases(); cxCode.focus(); return; }
        dire(msgCx, '');
        afficher(r, true);
      });
    });
    boutonRenvoyer.addEventListener('click', demanderCode);
    connexion.querySelector('[data-changer]').addEventListener('click', function () {
      etapeCode.hidden = true;
      etapeEmail.hidden = false;
      dire(msgCx, '');
      cxEmail.focus();
    });
    if (location.hash === '#creer') changerMode('creation');

    // ---------- le compte ----------
    var sections = {};
    espace.querySelectorAll('[data-section]').forEach(function (d) { sections[d.getAttribute('data-section')] = d; });
    var fc = document.getElementById('f-coordonnees'), fp = document.getElementById('f-piece'), fr = document.getElementById('f-rib');
    var fe = document.getElementById('f-envoi'), ok = espace.querySelector('[data-envoi-ok]'), fpv = document.getElementById('f-prevenir');
    var nomType = function (valeur) { // le type de pièce dans la langue de la page
      var o = [].filter.call(fp.elements.type.options, function (y) { return y.value === valeur; })[0];
      return o ? o.textContent : valeur;
    };
    var majPro = function () { fc.querySelector('[data-pro]').hidden = !fc.querySelector('[name=profil][value=professionnel]').checked; };
    var majRib = function () {
      espace.querySelector('[data-sans-rib]').hidden = !(compte && !compte.rib && fe.querySelector('[name=paiement]:checked').value === 'Virement');
    };
    var etapeDe = function (e) { return e.paye_le ? 5 : e.pese_le ? 4 : e.recu_le ? 3 : e.traite_le ? 2 : 1; };
    var initiales = function (c) { return ((c.prenom || '').charAt(0) + (c.nom || '').charAt(0)).toUpperCase() || '?'; };
    var joursRestants = function (ymd) { return Math.round((dateDe(ymd) - dateDe(jourParis())) / 864e5) + 1; };
    var pourcentComplet = function () {
      var m = compte.manque, n = 0, fait = 0;
      n++; if (m.indexOf('coordonnees') < 0) fait++;
      if (compte.profil === 'particulier') { n++; if (m.indexOf('piece') < 0 && m.indexOf('piece_expiree') < 0) fait++; }
      n++; if (compte.rib) fait++;
      return Math.round(fait / n * 100);
    };
    // le suivi en 5 étapes (barre et noms), comme le composant Delivery progress de 21st.dev
    var suiviHtml = function (n) {
      var b = '', t = '';
      for (var k = 0; k < 5; k++) {
        var cl = k < n ? 'fait' : (k === n ? 'encours' : '');
        b += '<span class="' + cl + '"></span>';
        t += '<span class="' + cl + '">' + x(E.etapes[k]) + '</span>';
      }
      return '<div class="suivi" role="progressbar" aria-label="' + x(E.suivi) + '" aria-valuemin="1" aria-valuemax="5" aria-valuenow="' + n
        + '" aria-valuetext="' + x(E.etats[n - 1]) + '">' + b + '</div><div class="suivi-noms" aria-hidden="true">' + t + '</div>';
    };
    var pastilleEtat = function (e) {
      var n = etapeDe(e);
      return '<span class="pastille-etat' + (n === 5 ? ' ok' : '') + '">' + ic(n === 5 ? P.check : n === 1 ? P.clock : P.tag) + x(E.etats[n - 1]) + '</span>';
    };
    var prochaine = function (e) {
      var n = etapeDe(e);
      if (n >= 5) return '';
      var p = E['p' + (n - 1)], icone = [P.tag, P.box, P.scale, P.euro][n - 1];
      var texte = remplacer(p[1], { date: e.garanti_jusqu ? dateLongue(e.garanti_jusqu) : '', paiement: e.paiement === 'Chèque' ? E.cheque.toLowerCase() : E.virement.toLowerCase() });
      return '<div class="prochaine"><span class="rond">' + ic(icone) + '</span><div><b>' + x(p[0]) + '</b><p>' + x(texte) + '</p></div></div>';
    };
    var boutonsDemande = function (e, suivi) {
      return '<div class="boutons-carte"><button type="button" class="btn btn-primaire" data-imprimer-ref="' + x(e.reference) + '">' + ic(P.printer) + x(E.imprimer) + '</button>'
        + (suivi ? '<a class="btn btn-contour" href="#demande-' + encodeURIComponent(e.reference) + '">' + x(E.voirSuivi) + ic(P.chev) + '</a>' : '') + '</div>';
    };

    // tableau de bord (propositions 75 à 79, 83, 87, 97)
    function tableau() {
      var g = espace.querySelector('[data-tableau]'), h = '';
      var enCours = envois.filter(function (e) { return !e.paye_le; }), payes = envois.filter(function (e) { return e.paye_le; });
      var e = enCours[0];
      if (e) {
        h += '<section class="carte-compte carte-large"><div class="carte-compte-tete"><div><p class="sur-carte">' + x(E.enCours) + '</p><p class="ref-col">'
          + x(e.reference) + '</p></div>' + pastilleEtat(e) + '</div>' + suiviHtml(etapeDe(e)) + prochaine(e) + boutonsDemande(e, true) + '</section>';
      }
      // prix garanti de la demande en cours, en jours ; sans demande : le prix du jour
      if (e && e.prix_kg && e.garanti_jusqu && joursRestants(e.garanti_jusqu) > 0) {
        var reste = joursRestants(e.garanti_jusqu), fin = reste <= 2;
        h += '<section class="carte-compte"><p class="sur-carte">' + x(E.prixGaranti) + '</p><div class="carte-compte-tete" style="align-items:center">'
          + '<p class="gros-prix">' + x(ecrirePrix(e.prix_kg)) + ' €<small>/kg</small></p><span class="pastille-etat ' + (fin ? 'attente' : 'ok') + '">' + ic(P.clock)
          + x(reste === 1 ? E.encore1 : remplacer(E.encore, { n: reste })) + '</span></div><div class="barre-jours' + (fin ? ' fin' : '') + '"><span style="width:'
          + Math.max(6, Math.min(100, Math.round((7 - reste + 1) / 7 * 100))) + '%"></span></div><p class="petit-gris">'
          + x(remplacer(E.garantiJusqu, { date: dateLongue(e.garanti_jusqu) })) + '</p></section>';
      } else {
        h += '<section class="carte-compte"><p class="sur-carte">' + x(E.prixJour) + '</p><p class="gros-prix">' + x(ecrirePrix(prixDuJour())) + ' €<small>/kg</small></p>'
          + '<p class="petit-gris">' + x(E.prixJourTexte) + '</p></section>';
      }
      var annee = String(new Date().getFullYear()), cetteAnnee = payes.filter(function (v) { return String(v.paye_le).slice(0, 4) === annee; });
      if (cetteAnnee.length) {
        var kg = 0, euros = 0;
        cetteAnnee.forEach(function (v) { kg += v.poids_net || 0; euros += v.montant || 0; });
        h += '<section class="carte-compte carte-large"><div class="carte-compte-tete" style="align-items:center"><p class="sur-carte">' + x(remplacer(E.venduEn, { annee: annee }))
          + '</p><a class="lien-bouton" href="#ventes">' + x(E.mesVentes || E.toutVoir) + '</a></div><div class="chiffres-compte"><div><b>' + cetteAnnee.length + '</b><span>'
          + x(cetteAnnee.length > 1 ? E.nVentes : E.nVente) + '</span></div><div><b>' + x(nombre.format(kg)) + ' kg</b><span>' + x(E.kgCarbure) + '</span></div><div><b>'
          + x(argentRond.format(euros)) + ' €</b><span>' + x(E.payes) + '</span></div></div></section>';
      }
      var pc = pourcentComplet();
      if (pc < 100) {
        var m = compte.manque, li = function (fait, texte) { return '<li class="' + (fait ? 'fait' : '') + '">' + ic(fait ? P.check : P.circle) + x(texte) + '</li>'; };
        h += '<section class="carte-compte"><div class="carte-compte-tete" style="align-items:center"><p class="sur-carte">' + x(E.votreCompte) + '</p><b style="color:var(--marine)">'
          + pc + ' %</b></div><div class="barre-jours"><span style="width:' + pc + '%;background:var(--marine)"></span></div><ul class="coches">'
          + li(m.indexOf('coordonnees') < 0, E.coord) + (compte.profil === 'particulier' ? li(m.indexOf('piece') < 0 && m.indexOf('piece_expiree') < 0, E.piece) : '')
          + li(!!compte.rib, E.ribVir) + '</ul><a class="btn btn-contour" href="#profil">' + x(E.completer) + '</a></section>';
      }
      if (!envois.length) {
        h += '<section class="carte-compte carte-toute"><div class="vide-compte"><span class="illus">' + ic(P.box) + '</span><h2>' + x(E.vide[0]) + '</h2><p>' + x(E.vide[1])
          + '</p><a class="btn btn-primaire" href="#envoi">' + ic(P.send) + x(E.vide[2]) + '</a></div><ol class="etapes-courtes">'
          + E.videEtapes.map(function (t) { return '<li><span>' + t + '</span></li>'; }).join('') + '</ol></section>';
      }
      if (payes.length) {
        h += '<section class="carte-compte carte-toute"><div class="carte-compte-tete" style="align-items:center"><h2>' + x(E.dernieres) + '</h2><a class="lien-bouton" href="#ventes">'
          + x(E.toutVoir) + '</a></div><div class="rangs-ventes">' + payes.slice(0, 3).map(rangVente).join('') + '</div></section>';
      }
      g.innerHTML = h;
    }
    var rangVente = function (v) {
      return '<div class="rang-vente"><span class="prochaine" style="padding:0;background:none"><span class="rond" style="background:var(--vert-50);color:var(--vert)">' + ic(P.check)
        + '</span></span><div class="t"><b>' + x(jour(v.paye_le)) + (v.poids_net ? ' · ' + x(nombre.format(v.poids_net)) + ' kg' : '') + '</b><span>'
        + x(v.bon_numero ? remplacer(E.bon, { n: v.bon_numero }) : v.reference) + ' · ' + x(v.paiement === 'Chèque' ? E.cheque : E.virement) + '</span></div><div class="v">'
        + (v.montant ? x(argent.format(v.montant)) + ' €' : '') + '<small>' + x(remplacer(E.payeLe, { date: new Date(v.paye_le).toLocaleDateString(T.locale) })) + '</small></div></div>';
    };

    // demandes : la liste (en cours, terminées) et le détail daté de chacune (propositions 77, 78, 85)
    function vueDemandes(ref) {
      var zone = espace.querySelector('[data-demandes]');
      espace.querySelector('[data-aucun-envoi]').hidden = envois.length > 0;
      if (ref) {
        var d = envois.filter(function (v) { return v.reference === ref; })[0];
        if (d) { zone.innerHTML = detailHtml(d); return; }
      }
      var enCours = envois.filter(function (v) { return !v.paye_le; }), finies = envois.filter(function (v) { return v.paye_le; });
      var carte = function (v) {
        return '<section class="carte-compte"><div class="carte-compte-tete"><div><p class="ref-col">' + x(v.reference) + '</p><p class="petit-gris">'
          + x(remplacer(E.envoyeeLe, { date: jour(v.cree_le) })) + ' · ' + x(E.colisKg.replace('{n}', v.colis.length).replace('{kg}', nombre.format(v.total))) + '</p></div>'
          + pastilleEtat(v) + '</div>' + suiviHtml(etapeDe(v)) + (v.paye_le ? '<div class="boutons-carte"><a class="btn btn-contour" href="#demande-' + encodeURIComponent(v.reference)
          + '">' + x(E.voirSuivi) + ic(P.chev) + '</a></div>' : boutonsDemande(v, true)) + '</section>';
      };
      if (!envois.length) { zone.innerHTML = ''; return; }
      zone.innerHTML = '<div class="liste-demandes">' + (enCours.length ? enCours.map(carte).join('') : '<p class="espace-aide">' + x(E.aucuneEnCours) + '</p>')
        + (finies.length ? '<h2 class="compte-sous-titre">' + x(E.ongletFinies) + '</h2>' + finies.map(carte).join('') : '') + '</div>';
    }
    function detailHtml(e) {
      var n = etapeDe(e), etape = function (k, quand, extra) {
        var cl = k < n ? 'fait' : (k === n ? 'encours' : '');
        return '<li class="' + cl + '"><span class="etape-point">' + (k < n ? ic(P.check) : (k + 1)) + '</span><div><b>' + x(E.longues[k]) + '</b><span class="quand">'
          + x(quand) + '</span>' + (extra || '') + '</div></li>';
      };
      var quand = function (iso) { return jour(iso) + ' · ' + heure(iso); };
      var wa = 'https://wa.me/33761119523?text=' + encodeURIComponent(remplacer(E.questionWa, { ref: e.reference }));
      return '<a class="retour-liste" href="#demandes">' + ic(P.back) + x(E.retour) + '</a>'
        + '<div class="carte-compte-tete"><div><p class="ref-col" style="font-size:18px">' + x(e.reference) + '</p><p class="petit-gris">' + x(remplacer(E.envoyeeLe, { date: jour(e.cree_le) }))
        + '</p></div>' + pastilleEtat(e) + '</div>'
        + '<section class="carte-compte"><h2>' + x(E.suivi) + '</h2><ol class="ligne-temps">'
        + etape(0, quand(e.cree_le) + (e.prix_kg ? ' · ' + ecrirePrix(e.prix_kg) + ' €/kg' : ''))
        + etape(1, e.traite_le ? quand(e.traite_le) : E.p0[1].split('.')[0] + '.')
        + etape(2, e.recu_le ? quand(e.recu_le) : (e.garanti_jusqu ? remplacer(E.aFaire, { date: dateLongue(e.garanti_jusqu) }) : ''),
          n === 2 || n === 1 ? '<button type="button" class="btn btn-primaire" data-imprimer-ref="' + x(e.reference) + '">' + ic(P.printer) + x(E.imprimer) + '</button>' : '')
        + etape(3, e.pese_le ? quand(e.pese_le) + (e.poids_net ? ' · ' + remplacer(E.net, { kg: nombre.format(e.poids_net) }) : '') : E.pesee)
        + etape(4, e.paye_le ? quand(e.paye_le) + (e.montant ? ' · ' + argent.format(e.montant) + ' €' : '') : E.paiementSous)
        + '</ol></section>'
        + '<section class="carte-compte"><h2>' + x(E.envoi) + '</h2><dl class="infos-envoi"><dt>' + x(E.rColis) + '</dt><dd>' + x(remplacer(E.rColisTexte, { n: e.colis.length, kg: nombre.format(e.total) }))
        + '</dd><dt>' + x(E.matiere) + '</dt><dd>' + e.colis.map(function (c) { return x(c.matiere) + ' (' + x(nombre.format(c.poids)) + ' kg)'; }).join('<br>') + '</dd><dt>'
        + x(E.rPaiement) + '</dt><dd>' + x(e.paiement === 'Chèque' ? E.cheque : E.virement) + '</dd>'
        + (e.prix_kg && e.garanti_jusqu ? '<dt>' + x(E.rPrix) + '</dt><dd>' + x(remplacer(E.rPrixTexte, { prix: ecrirePrix(e.prix_kg), date: dateLongue(e.garanti_jusqu) })) + '</dd>' : '')
        + '</dl></section>'
        + '<section class="carte-compte question-envoi"><span class="prochaine" style="padding:0;background:none"><span class="rond" style="background:var(--vert-50);color:var(--vert)">'
        + ic(P.chat) + '</span></span><div><b>' + x(E.question) + '</b><p class="petit-gris">' + x(E.questionTexte) + '</p></div><a class="btn btn-contour" href="' + x(wa) + '">WhatsApp</a></section>';
    }

    // ventes : celles payées, avec poids brut, poids net, montant, et le bon à redemander (propositions 96, 97, 98)
    function vueVentes() {
      var zone = espace.querySelector('[data-ventes]'), payes = envois.filter(function (v) { return v.paye_le; });
      if (!payes.length) { zone.innerHTML = '<section class="carte-compte"><p class="espace-aide">' + x(E.ventesVide) + '</p></section>'; return; }
      var kg = 0, euros = 0;
      payes.forEach(function (v) { kg += v.poids_net || 0; euros += v.montant || 0; });
      zone.innerHTML = '<section class="carte-compte"><div class="chiffres-compte"><div><b>' + payes.length + '</b><span>' + x(payes.length > 1 ? E.nVentes : E.nVente)
        + '</span></div><div><b>' + x(nombre.format(kg)) + ' kg</b><span>' + x(E.kgCarbure) + '</span></div><div><b>' + x(argent.format(euros)) + ' €</b><span>' + x(E.payes)
        + '</span></div></div></section>' + payes.map(function (v) {
          return '<section class="carte-compte"><div class="carte-compte-tete"><div><p class="sur-carte">' + x(jour(v.paye_le)) + '</p><p class="ref-col">'
            + x(v.bon_numero ? remplacer(E.bon, { n: v.bon_numero }) : v.reference) + '</p></div><span class="pastille-etat ok">' + ic(P.check)
            + x(remplacer(E.payeLe, { date: new Date(v.paye_le).toLocaleDateString(T.locale) })) + '</span></div><dl class="infos-envoi">'
            + (v.poids_brut ? '<dt>' + x(E.brut) + '</dt><dd>' + x(nombre.format(v.poids_brut)) + ' kg</dd>' : '')
            + (v.poids_net ? '<dt>' + x(E.netL) + '</dt><dd>' + x(nombre.format(v.poids_net)) + ' kg</dd>' : '')
            + (v.prix_kg ? '<dt>' + x(E.prix) + '</dt><dd>' + x(ecrirePrix(v.prix_kg)) + ' €/kg</dd>' : '')
            + (v.montant ? '<dt>' + x(E.montant) + '</dt><dd style="font-size:18px">' + x(argent.format(v.montant)) + ' €</dd>' : '')
            + '<dt>' + x(E.rPaiement) + '</dt><dd>' + x(v.paiement === 'Chèque' ? E.cheque : E.virement) + '</dd></dl>'
            + (v.bon_numero ? '<div class="boutons-carte"><button type="button" class="btn btn-contour" data-redemander="' + x(v.reference) + '">' + x(E.redemander) + '</button></div>'
              + '<p class="petit-gris" data-redemande-msg="' + x(v.reference) + '" role="status"></p>' : '') + '</section>';
        }).join('');
    }

    // profil : la fiche, la pièce (date de fin), le RIB caché (Voir en entier), être prévenu, supprimer (80 à 82, 86, 95)
    function remplirProfil() {
      var c = compte, p = c.piece, m = c.manque;
      var lignes = [[P.user, E.nom, (c.prenom + ' ' + (c.nom || '').toUpperCase()).trim()]];
      if (c.profil === 'professionnel') lignes.push([P.building, E.entreprise, [c.entreprise, c.siret ? 'SIRET ' + c.siret : ''].filter(Boolean).join(' · ')]);
      lignes.push([P.pin, E.adresse, [c.adresse, ((c.cp || '') + ' ' + (c.ville || '')).trim()].filter(Boolean).join(', ')]);
      lignes.push([P.phone, E.tel, c.telephone], [P.mail, E.mail, c.email]);
      espace.querySelector('[data-fiche]').innerHTML = lignes.map(function (l) {
        return '<div><dt>' + ic(l[0]) + x(l[1]) + '</dt><dd>' + (l[2] ? x(l[2]) : '<span class="petit-gris">' + x(E.vide2) + '</span>') + '</dd></div>';
      }).join('');
      sections.coordonnees.classList.toggle('manque', m.indexOf('coordonnees') >= 0);
      sections.coordonnees.querySelector('.carte-espace-resume').textContent = m.indexOf('coordonnees') >= 0 ? E.aCompleter : '';
      // pièce : type, date de fin et pastille (valide, expire bientôt, expirée)
      var rp = sections.piece.querySelector('.carte-espace-resume');
      if (p) {
        var fin = p.expiration, jours = fin ? joursRestants(fin) : null;
        var etat = !fin ? '' : jours <= 0 ? '<span class="pastille-etat attente">' + x(E.expiree) + '</span>' : jours <= 31 ? '<span class="pastille-etat attente">'
          + x(E.bientot) + '</span>' : '<span class="pastille-etat ok">' + ic(P.check) + x(E.valide) + '</span>';
        rp.innerHTML = x(fin ? remplacer(E.valideJusqu, { type: nomType(p.type), date: jour(fin + 'T12:00:00') }) : remplacer(E.deposee, { type: nomType(p.type), date: jour(p.depose_le) })) + ' ' + etat;
      } else rp.textContent = c.profil === 'particulier' ? E.aCompleter : '';
      sections.piece.classList.toggle('manque', c.profil === 'particulier' && (m.indexOf('piece') >= 0 || m.indexOf('piece_expiree') >= 0));
      // RIB : les 4 derniers chiffres seulement, « Voir en entier » sur demande (le serveur le renvoie à la personne seule)
      var rr = sections.rib.querySelector('.carte-espace-resume'), voir = sections.rib.querySelector('[data-voir-rib]');
      rr.innerHTML = c.rib ? '<span class="iban-cache">' + x(c.rib.iban) + '</span><br><span class="petit-gris">' + x(remplacer(E.titulaire, { nom: c.rib.titulaire })) + '</span>' : x(E.pourVirement);
      voir.hidden = !c.rib;
      voir.textContent = E.voir;
      voir.setAttribute('aria-pressed', 'false');
      fpv.querySelectorAll('[name=prevenir]').forEach(function (r) { r.checked = r.value === (c.prevenir || 'email'); });
    }
    sections.rib.querySelector('[data-voir-rib]').addEventListener('click', function () {
      var b = this, cache = sections.rib.querySelector('.iban-cache');
      if (b.getAttribute('aria-pressed') === 'true') { cache.textContent = compte.rib.iban; b.textContent = E.voir; b.setAttribute('aria-pressed', 'false'); return; }
      api('GET', 'rib').then(function (r) {
        if (!r.iban) return;
        cache.textContent = r.iban.replace(/(.{4})/g, '$1 ').trim();
        b.textContent = E.cacher;
        b.setAttribute('aria-pressed', 'true');
        setTimeout(function () { if (b.getAttribute('aria-pressed') === 'true') b.click(); }, 30000);
      });
    });
    fpv.addEventListener('change', function (ev) {
      if (ev.target.name !== 'prevenir') return;
      var msg = message(fpv), avant = compte.prevenir;
      api('PUT', 'compte', { section: 'prevenir', prevenir: ev.target.value }).then(function (r) {
        if (r.status === 401) return recharger();
        if (r.erreur) {
          dire(msg, r.erreur);
          fpv.querySelectorAll('[name=prevenir]').forEach(function (b) { b.checked = b.value === avant; });
          return;
        }
        dire(msg, '');
        compte = r.compte;
        bulle(E.prevenirOk);
      });
    });

    function remplir() {
      var c = compte, m = c.manque, p = c.piece;
      ['nom', 'prenom', 'entreprise', 'siret', 'adresse', 'cp', 'ville', 'telephone'].forEach(function (k) { fc.elements[k].value = c[k] || ''; });
      cocher(fc.querySelector('[name=profil][value="' + c.profil + '"]'));
      majPro();
      if (p) { fp.elements.type.value = p.type; fp.elements.numero.value = p.numero; fp.elements.expiration.value = p.expiration || ''; }
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
      // en-tête du compte : initiales, nom, e-mail, « client depuis »
      espace.querySelectorAll('[data-initiales]').forEach(function (el) { el.textContent = initiales(c); });
      bandeau.querySelector('.prenom').textContent = c.prenom || '';
      bandeau.querySelector('[data-nom]').textContent = (c.nom || '').toUpperCase();
      bandeau.querySelector('[data-email]').textContent = c.email;
      espace.querySelector('[data-prenom]').textContent = c.prenom || '';
      espace.querySelector('[data-depuis]').textContent = remplacer(E.depuis, { mois: new Date(c.cree_le || Date.now()).toLocaleDateString(T.locale, { month: 'long', year: 'numeric' }) });
      memoCompte(c); // prénom et initiale pour l'en-tête des autres pages
      var nEnCours = envois.filter(function (v) { return !v.paye_le; }).length, badge = espace.querySelector('[data-n-demandes]');
      badge.textContent = nEnCours;
      badge.hidden = !nEnCours;
      espace.querySelector('[data-envoi-bloque]').hidden = !m.length;
      fe.hidden = m.length > 0 || !ok.hidden;
      espace.querySelector('[data-pas-indicateur]').hidden = fe.hidden;
      majRib();
      remplirProfil();
      tableau();
    }
    function ouvrirSuivante() { // la première partie du profil à compléter s'ouvre, les autres se referment
      var m = compte.manque, suivante = m.indexOf('coordonnees') >= 0 ? 'coordonnees' : (m.length ? 'piece' : null);
      Object.keys(sections).forEach(function (k) { var d = sections[k].querySelector('details'); if (d) d.open = k === suivante; });
    }
    // les vues du compte, d'après l'adresse (#accueil, #demandes, #demande-COL-…, #ventes, #envoi, #profil)
    var VUES = ['accueil', 'demandes', 'ventes', 'envoi', 'profil'];
    function montrer() {
      if (!compte) return;
      var h = decodeURIComponent(location.hash.replace('#', '')), ref = '';
      if (h.indexOf('demande-') === 0) { ref = h.slice(8); h = 'demandes'; }
      if (VUES.indexOf(h) < 0) h = 'accueil';
      espace.querySelectorAll('[data-vue]').forEach(function (v) { v.hidden = v.getAttribute('data-vue') !== h; });
      espace.querySelectorAll('[data-vue-lien]').forEach(function (a) {
        if (a.getAttribute('data-vue-lien') === h) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      });
      if (h === 'demandes') vueDemandes(ref);
      if (h === 'ventes') vueVentes();
      if (h === 'profil' && compte.manque.length) ouvrirSuivante();
    }
    window.addEventListener('hashchange', function () {
      if (!compte || location.hash === '#creer') return;
      montrer();
      var t = espace.querySelector('[data-vue]:not([hidden]) h1');
      if (t) { t.tabIndex = -1; t.focus({ preventScroll: true }); }
      window.scrollTo(0, Math.max(0, espace.getBoundingClientRect().top + window.scrollY - 80));
    });
    function afficher(r, arrivee) {
      compte = r.compte;
      if (r.envois) envois = r.envois;
      accueil.hidden = avantages.hidden = true;
      espace.hidden = false;
      remplir();
      montrer();
      reprendreBrouillon();
      chargerQr(); // le QR code du bordereau, prêt avant l'impression
      infosPretes.then(function () { if (compte) tableau(); }); // le prix du jour, arrivé après
      if (!arrivee) return;
      var t = espace.querySelector('[data-vue]:not([hidden]) h1');
      window.scrollTo(0, 0);
      if (t) { t.tabIndex = -1; t.focus({ preventScroll: true }); }
    }

    // une partie du profil enregistrée : le serveur renvoie le compte à jour
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
          dire(msg, '');
          remplir();
          bulle(E.bulle);
          var details = form.closest('details');
          if (details) details.open = false;
          if (compte.manque.length) ouvrirSuivante();
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

    // ---------- envoyer un colis : 3 étapes (colis, paiement, vérification), demande commencée gardée (90 à 93) ----------
    var liste = fe.querySelector('[data-colis]'), modele = document.getElementById('modele-colis'), pas = 1;
    var lirePoids = function (v) { var n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : 0; };
    var lireColis = function () {
      return [].map.call(liste.children, function (el) {
        return { matiere: el.querySelector('[name=matiere]').value, poids: lirePoids(el.querySelector('[name=poids]').value) };
      });
    };
    var totalColis = function () { var t = 0; lireColis().forEach(function (c) { t += c.poids; }); return Math.round(t * 10) / 10; };
    var majTotal = function () { fe.querySelector('[data-total]').textContent = nombre.format(totalColis()) + ' kg'; };
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
    var BROUILLON = 'ain-brouillon-colis';
    var garderBrouillon = function () {
      try {
        localStorage.setItem(BROUILLON, JSON.stringify({ colis: lireColis(), paiement: fe.querySelector('[name=paiement]:checked').value, message: fe.elements.message.value }));
      } catch (e) { /* navigateur sans mémoire */ }
    };
    var oublierBrouillon = function () { try { localStorage.removeItem(BROUILLON); } catch (e) { /* rien */ } espace.querySelector('[data-brouillon]').hidden = true; };
    function reprendreBrouillon() {
      var b = null;
      try { b = JSON.parse(localStorage.getItem(BROUILLON) || 'null'); } catch (e) { b = null; }
      if (!b || !b.colis || !b.colis.length || !b.colis.some(function (c) { return c.poids > 0; })) return;
      liste.textContent = '';
      b.colis.slice(0, 5).forEach(function (c) {
        ajouterColis();
        var el = liste.lastElementChild;
        el.querySelector('[name=matiere]').value = c.matiere;
        el.querySelector('[name=poids]').value = c.poids ? String(c.poids).replace('.', T.locale.indexOf('en') === 0 ? '.' : ',') : '';
      });
      numeroter();
      var r = fe.querySelector('[name=paiement][value="' + b.paiement + '"]');
      if (r) cocher(r);
      fe.elements.message.value = b.message || '';
      espace.querySelector('[data-brouillon]').hidden = false;
    }
    espace.querySelector('[data-oublier]').addEventListener('click', function () {
      oublierBrouillon();
      fe.reset();
      liste.textContent = '';
      ajouterColis();
      allerPas(1);
    });
    function allerPas(n) {
      pas = n;
      fe.querySelectorAll('[data-pas]').forEach(function (d) { d.hidden = Number(d.getAttribute('data-pas')) !== n; });
      espace.querySelectorAll('[data-pas-num]').forEach(function (li) {
        var k = Number(li.getAttribute('data-pas-num'));
        li.classList.toggle('fait', k < n);
        if (k === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      });
      if (n === 3) resumer();
      var t = fe.querySelector('[data-pas="' + n + '"] input, [data-pas="' + n + '"] select');
      if (t && n !== 1) t.focus({ preventScroll: true });
    }
    function verifierPas(n) {
      var msg = message(fe);
      if (!compte) return false;
      if (n === 1 && lireColis().some(function (c) { return !(c.poids > 0) || c.poids > 20; })) { dire(msg, 'colis'); return false; }
      if (n === 2 && fe.querySelector('[name=paiement]:checked').value === 'Virement' && !compte.rib) { dire(msg, 'rib'); return false; }
      dire(msg, '');
      return true;
    }
    function resumer() {
      if (!compte) return;
      var colis = lireColis(), c = compte, paiement = fe.querySelector('[name=paiement]:checked').value;
      var ligne = function (titre, texte, retour) {
        return '<div><dt>' + x(titre) + '</dt><dd>' + texte + (retour ? ' <button type="button" class="lien-bouton modifier" data-aller-pas="' + retour + '">' + x(E.modifier) + '</button>' : '') + '</dd></div>';
      };
      fe.querySelector('[data-resume]').innerHTML = '<dl class="resume-envoi">'
        + ligne(E.rColis, x(remplacer(E.rColisTexte, { n: colis.length, kg: nombre.format(totalColis()) })) + '<br><span class="petit-gris">'
          + colis.map(function (k) { return x(k.matiere) + ' : ' + x(nombre.format(k.poids)) + ' kg'; }).join('<br>') + '</span>', 1)
        + ligne(E.rPaiement, x(paiement === 'Chèque' ? E.cheque : E.virement) + (paiement === 'Virement' && c.rib ? '<br><span class="petit-gris">' + x(c.rib.iban) + '</span>' : ''), 2)
        + ligne(E.rEtiquette, x((c.prenom + ' ' + (c.nom || '').toUpperCase()).trim()) + '<br><span class="petit-gris">' + x([c.adresse, (c.cp + ' ' + c.ville).trim()].join(', ')) + '</span>')
        + ligne(E.rPrix, x(remplacer(E.rPrixTexte, { prix: ecrirePrix(prixDuJour()), date: dateLongue(garantiJusqu(jourParis())) })))
        + '</dl>';
    }
    liste.addEventListener('input', function () { majTotal(); garderBrouillon(); });
    liste.addEventListener('click', function (e) {
      var b = e.target.closest('.bouton-retirer');
      if (b) { b.closest('.colis').remove(); numeroter(); garderBrouillon(); }
    });
    fe.querySelector('[data-ajouter-colis]').addEventListener('click', function () {
      ajouterColis();
      liste.lastElementChild.querySelector('[name=poids]').focus();
    });
    fe.addEventListener('change', function (e) { if (e.target.name === 'paiement') majRib(); garderBrouillon(); });
    fe.addEventListener('click', function (ev) {
      if (ev.target.closest('[data-pas-suivant]')) { if (verifierPas(pas)) allerPas(pas + 1); return; }
      if (ev.target.closest('[data-pas-retour]')) { dire(message(fe), ''); allerPas(pas - 1); return; }
      var m = ev.target.closest('[data-aller-pas]');
      if (m) allerPas(Number(m.getAttribute('data-aller-pas')));
    });
    ajouterColis();
    fe.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var msg = message(fe), colis = lireColis();
      if (pas !== 3) { if (verifierPas(pas)) allerPas(pas + 1); return; }
      if (colis.some(function (c) { return !(c.poids > 0) || c.poids > 20; })) { allerPas(1); return dire(msg, 'colis'); }
      var paiement = fe.querySelector('[name=paiement]:checked').value;
      if (paiement === 'Virement' && !compte.rib) { allerPas(2); return dire(msg, 'rib'); }
      if (!fe.elements.attestation.checked) return dire(msg, 'attestation');
      occupe(fe, true);
      api('POST', 'envoi', { colis: colis, paiement: paiement, message: fe.elements.message.value, attestation: true }).then(function (r) {
        occupe(fe, false);
        if (r.status === 401) return recharger();
        if (r.erreur) return dire(msg, r.erreur);
        dire(msg, '');
        oublierBrouillon();
        dernier = r.envoi;
        envois.unshift(r.envoi);
        fe.hidden = true;
        espace.querySelector('[data-pas-indicateur]').hidden = true;
        ok.querySelector('[data-reference]').textContent = r.envoi.reference;
        ok.querySelector('[data-garanti-fin]').textContent = r.envoi.garanti_jusqu ? dateLongue(r.envoi.garanti_jusqu) : '';
        ok.hidden = false;
        remplir();
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
      espace.querySelector('[data-pas-indicateur]').hidden = false;
      allerPas(1);
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
    var imprimer = function (e) {
      var c = compte, b = document.getElementById('bordereau');
      if (!e) return;
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
    };
    espace.querySelector('[data-imprimer]').addEventListener('click', function () { imprimer(dernier); });
    espace.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-imprimer-ref]');
      if (b) { imprimer(envois.filter(function (v) { return v.reference === b.getAttribute('data-imprimer-ref'); })[0]); return; }
      var r = ev.target.closest('[data-redemander]');
      if (r) {
        var ref = r.getAttribute('data-redemander'), msg = espace.querySelector('[data-redemande-msg="' + ref + '"]');
        r.disabled = true;
        api('POST', 'bon', { reference: ref }).then(function (j) {
          if (j.status === 401) return recharger();
          msg.textContent = j.erreur === 'deja' ? E.deja : j.erreur ? (E[j.erreur] || E.serveur) : E.redemande;
          if (j.erreur && j.erreur !== 'deja') r.disabled = false;
        });
      }
    });

    // ---------- se déconnecter, supprimer le compte (en tapant le mot demandé : proposition 86) ----------
    espace.querySelectorAll('[data-deconnexion]').forEach(function (b) {
      b.addEventListener('click', function () { api('DELETE', 'connexion').then(function () { memoCompte(null); recharger(); }); });
    });
    var confirmer = document.getElementById('x-confirmer'), boutonSupprimer = espace.querySelector('[data-supprimer]');
    var motAttendu = ((confirmer.labels && confirmer.labels[0] ? confirmer.labels[0].textContent : '').match(/[A-ZÀ-ÖØ-Þ]{5,}/) || ['SUPPRIMER'])[0];
    boutonSupprimer.disabled = true;
    confirmer.addEventListener('input', function () { boutonSupprimer.disabled = confirmer.value.trim().toUpperCase() !== motAttendu; });
    boutonSupprimer.addEventListener('click', function () {
      if (confirmer.value.trim().toUpperCase() !== motAttendu) return;
      boutonSupprimer.disabled = true;
      api('DELETE', 'compte').then(function (r) {
        if (r.erreur && r.status !== 401) { boutonSupprimer.disabled = false; return bulle(E[r.erreur] || E.serveur); }
        memoCompte(null);
        oublierBrouillon();
        recharger('?compte=' + (r.garde ? 'ferme' : 'supprime'));
      });
    });

    // à l'ouverture : lien « Me connecter » de l'e-mail, sinon déjà connecté ? (cookie du site, lu par le serveur seulement)
    var params = new URLSearchParams(location.search);
    if (params.get('compte') === 'supprime') dire(msgCx, 'supprime', true);
    if (params.get('compte') === 'ferme') dire(msgCx, 'supprimeGarde', true);
    var jeton = params.get('lien');
    if (jeton) {
      history.replaceState(history.state, '', location.pathname + location.hash); // le jeton ne reste pas dans l'adresse
      api('POST', 'lien', { jeton: jeton, langue: lang }).then(function (r) {
        if (!r.erreur && r.compte) return afficher(r, true);
        dire(msgCx, r.erreur || 'serveur');
      });
    } else {
      api('GET', 'compte').then(function (r) {
        if (!r.erreur && r.compte) afficher(r, true);
        else if (r.status === 401 || (!r.erreur && !r.compte)) memoCompte(null); // plus connecté : l'en-tête redit « Se connecter »
      });
    }
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

  // Page colis, « Ce que vous recevez, étape par étape » : les messages arrivent un par un, le plus récent en haut. Le vrai
  // composant « Animated List » de Dillion Verma (Magic UI ; 21st.dev, id de démo 869, licence MIT, récupéré le 08/11/2026,
  // https://21st.dev/@dillionverma/components/animated-list ; code d'origine dans 21st-composants/dillionverma__animated-list),
  // refait sans React ni bibliothèque. Comme le composant : toutes les secondes (« delay » 1000), un message de plus arrive
  // en haut de la liste et grandit depuis son bord du haut (échelle et opacité de 0 à 1, « originY » 0) pendant que les
  // autres glissent vers le bas (« layout »), tous sur le même ressort (raideur 350, amortissement 40, masse 1 : sans
  // rebond). Adapté : la liste garde sa hauteur finale (la page ne saute pas) et les messages pas encore arrivés sont
  // seulement transparents (les lecteurs d'écran lisent toute la liste) ; une seule passe de 3 s quand la liste arrive à
  // l'écran, rejouée si on revient après l'avoir quittée, au lieu de tourner sans fin ; rien avec « moins d'animations ».
  var listeMessages = document.querySelector('.messages');
  if (listeMessages && !calme && 'IntersectionObserver' in window) {
    var messages = [].slice.call(listeMessages.children).map(function (el) {
      return { el: el, y: 0, vy: 0, cy: 0, s: 0, vs: 0, cs: 0 };
    });
    var arrives = 0, minuteurMsg = 0, imageMsg = 0, avantMsg = 0;
    var poserMsg = function (m) {
      var s = Math.max(0, m.s);
      m.el.style.transform = 'translate3d(0, ' + m.y.toFixed(2) + 'px, 0) scale(' + s.toFixed(4) + ')';
      m.el.style.opacity = Math.min(1, s).toFixed(3);
    };
    var ressortMsg = function (t) {
      var dt = avantMsg ? Math.min(.05, (t - avantMsg) / 1000) : 1 / 60;
      avantMsg = t;
      var encore = false;
      messages.forEach(function (m) {
        // petits pas de 4 ms au plus pour que le ressort reste juste, même à 30 images par seconde
        for (var k = 0, n = Math.ceil(dt / .004), h = dt / n; k < n; k++) {
          m.vy += (-350 * (m.y - m.cy) - 40 * m.vy) * h; m.y += m.vy * h;
          m.vs += (-350 * (m.s - m.cs) - 40 * m.vs) * h; m.s += m.vs * h;
        }
        if (Math.abs(m.y - m.cy) < .1 && Math.abs(m.vy) < .5 && Math.abs(m.s - m.cs) < .001 && Math.abs(m.vs) < .01) { m.y = m.cy; m.vy = 0; m.s = m.cs; m.vs = 0; }
        else encore = true;
        poserMsg(m);
      });
      imageMsg = encore ? requestAnimationFrame(ressortMsg) : 0;
    };
    // Le message suivant arrive tout en haut : ceux déjà là se placent sous lui, plus haut que leur place finale de la
    // hauteur des messages qui ne sont pas encore arrivés (offsetTop ne tient pas compte des déplacements en cours).
    var arriverMsg = function () {
      var m = messages[arrives], haut = -m.el.offsetTop;
      for (var i = 0; i <= arrives; i++) messages[i].cy = haut;
      m.y = haut; m.vy = 0; m.cs = 1;
      arrives++;
      if (!imageMsg) { avantMsg = 0; imageMsg = requestAnimationFrame(ressortMsg); }
      if (arrives < messages.length) minuteurMsg = setTimeout(arriverMsg, 1000);
    };
    var remettreMsg = function () {
      clearTimeout(minuteurMsg);
      if (imageMsg) cancelAnimationFrame(imageMsg);
      imageMsg = 0; arrives = 0;
      messages.forEach(function (m) { m.y = m.cy = m.vy = 0; m.s = m.cs = m.vs = 0; poserMsg(m); });
    };
    remettreMsg();
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting && es[0].intersectionRatio >= .35) { if (!arrives) arriverMsg(); }
      else if (!es[0].isIntersecting) remettreMsg();
    }, { threshold: [0, .35] }).observe(listeMessages);
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
