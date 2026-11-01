import type { Messages } from '../types'

const messages: Messages = {
  app: {
    name: 'SeshatSQL'
  },
  shell: {
    disabledHint: 'Indisponible dans cet aperçu.',
    menubar: {
      label: 'Barre de menus'
    },
    menu: {
      file: 'Fichier',
      edit: 'Édition',
      query: 'Requête',
      view: 'Affichage',
      tools: 'Outils',
      help: 'Aide',
      fileNew: 'Nouveau',
      fileOpen: 'Ouvrir',
      fileSave: 'Enregistrer',
      fileSaveAs: 'Enregistrer sous',
      fileClose: 'Fermer',
      fileExit: 'Quitter',
      editUndo: 'Annuler',
      editRedo: 'Rétablir',
      editCut: 'Couper',
      editCopy: 'Copier',
      editPaste: 'Coller',
      editFind: 'Rechercher',
      editReplace: 'Remplacer',
      queryExecute: 'Exécuter',
      queryExecuteSelection: 'Exécuter la sélection',
      queryStop: 'Arrêter',
      queryExplain: 'Expliquer',
      viewObjectBrowser: "Explorateur d'objets",
      viewSqlLog: 'Journal SQL',
      viewHelpers: "Panneau d'aide",
      toolsConnections: 'Connexions…',
      toolsPreferences: 'Préférences',
      helpAbout: 'À propos'
    },
    toolbar: {
      label: "Barre d'outils",
      connections: 'Connexions',
      newQuery: 'Nouvelle requête',
      open: 'Ouvrir',
      save: 'Enregistrer',
      execute: 'Exécuter',
      stop: 'Arrêter',
      refresh: 'Actualiser',
      filter: 'Filtrer',
      search: 'Rechercher',
      settings: 'Paramètres',
      disconnect: 'Déconnecter',
      themeLabel: 'Thème',
      localeLabel: 'Langue',
      localeHint:
        "La langue de l'éditeur s'applique au prochain démarrage ; l'interface et la grille changent immédiatement."
    },
    theme: {
      system: 'Système',
      light: 'Clair',
      dark: 'Sombre'
    },
    locale: {
      enUS: 'English (United States)',
      ptBR: 'Português (Brasil)',
      ptPT: 'Português (Portugal)',
      fr: 'Français',
      es: 'Español'
    },
    tree: {
      label: "Explorateur d'objets",
      filterLabel: 'Filtrer les objets',
      sampleRoot: 'seshat_lab (exemple)',
      tables: 'Tables ({count})',
      views: 'Vues ({count})',
      empty: 'Aucun objet',
      noMatches: 'Aucun objet correspondant'
    },
    tabs: {
      queryOne: 'Requête 1',
      resultOne: 'Résultat 1',
      addTab: 'Nouvel onglet'
    },
    editor: {
      label: 'Éditeur SQL',
      loadFailure: "Impossible de charger l'éditeur SQL."
    },
    results: {
      label: 'Résultats',
      copyHint:
        'Sélectionnez des lignes et appuyez sur Ctrl+C pour copier avec les en-têtes ; sans sélection, la cellule active est copiée.'
    },
    helpers: {
      title: 'Historique',
      empty: 'Aucune requête exécutée dans cette session.'
    },
    log: {
      title: 'Journal SQL',
      clear: 'Effacer le journal',
      empty: 'Aucune requête exécutée.'
    },
    status: {
      disconnected: 'Déconnecté',
      rows: 'Lignes : {count}',
      sample: "Données d'exemple"
    },
    copy: {
      success: 'Copié dans le presse-papiers.',
      failure: 'Impossible de copier dans le presse-papiers.'
    },
    split: {
      tree: "Redimensionner l'explorateur d'objets",
      editor: "Redimensionner l'éditeur",
      log: 'Redimensionner le journal SQL'
    }
  },
  persistence: {
    title: 'Stockage',
    warning: {
      recovered: 'Le fichier principal était endommagé ; la dernière sauvegarde valide a été chargée.',
      quarantined: 'Un fichier endommagé a été conservé en quarantaine.',
      quarantineFailed: 'Impossible de déplacer un fichier endommagé vers la quarantaine.',
      futureVersion: 'Un fichier a été écrit par une version plus récente et ne sera pas écrasé.',
      migrated: 'Un fichier plus ancien a été migré vers le format actuel.',
      largeFile: 'Un fichier de stockage dépasse 1 Mo.',
      fileTooLarge:
        "Un fichier de stockage dépasse la limite de sécurité de 16 Mo et n'a pas été chargé.",
      readFailed: 'Impossible de lire un fichier de stockage.',
      defaultsUsed: 'Les paramètres par défaut sont utilisés car aucun fichier valide n’a pu être lu.',
      legacyDirectory: 'Un dossier de données hérité a été trouvé et laissé intact.',
      saveFailed: 'Impossible d’enregistrer vos données.'
    },
    close: {
      failed: 'Impossible d’enregistrer avant la fermeture. La fenêtre reste ouverte.'
    },
    actions: {
      retry: 'Réessayer',
      exitWithoutSaving: 'Quitter sans enregistrer',
      confirmDiscard: 'Abandonner les modifications non enregistrées et quitter ?',
      confirmExit: 'Quitter',
      cancel: 'Annuler',
      dismiss: 'Ignorer'
    }
  },
  connections: {
    title: 'Connexions',
    listLabel: 'Connexions enregistrées',
    loading: 'Chargement des connexions…',
    empty: 'Aucune connexion enregistrée.',
    notice: {
      writeBlocked:
        "Impossible de modifier les profils de connexion tant que le problème de stockage ci-dessus n'est pas résolu."
    },
    environment: {
      development: 'Développement',
      staging: 'Préproduction',
      production: 'Production',
      custom: 'Personnalisé'
    },
    color: {
      blue: 'Bleu',
      green: 'Vert',
      amber: 'Ambre',
      red: 'Rouge',
      violet: 'Violet',
      teal: 'Turquoise',
      pink: 'Rose',
      gray: 'Gris'
    },
    fields: {
      name: 'Nom',
      host: 'Hôte',
      port: 'Port',
      user: 'Utilisateur',
      password: 'Mot de passe',
      passwordSaved: 'Un mot de passe est enregistré pour cette connexion.',
      removePassword: 'Supprimer le mot de passe enregistré',
      environment: 'Environnement',
      environmentLabel: "Nom de l'environnement",
      color: 'Couleur',
      passwordPlaceholderKeep: 'Laisser vide pour conserver le mot de passe enregistré',
      passwordPlaceholderNone: "Laisser vide pour n'enregistrer aucun mot de passe"
    },
    passwordHint:
      "Les mots de passe sont chiffrés par Windows pour l'utilisateur et la machine actuels. Copier le dossier de données ailleurs ne les révèle pas.",
    unsaved: {
      question: 'Abandonner les modifications non enregistrées ?'
    },
    delete: {
      question: 'Supprimer « {name} » ?',
      warning:
        "Les onglets sont conservés. Le SQL enregistré qui référence cette connexion ne pourra pas utiliser le profil tant qu'un autre ne sera pas attribué."
    },
    actions: {
      new: 'Nouveau',
      delete: 'Supprimer',
      save: 'Enregistrer',
      cancel: 'Annuler',
      discard: 'Abandonner',
      keepEditing: 'Continuer la modification',
      confirmDelete: 'Supprimer la connexion',
      cancelDelete: 'Conserver la connexion'
    },
    errors: {
      duplicateName: 'Une connexion portant ce nom existe déjà.',
      notFound: "Cette connexion n'existe plus. Rechargez la liste et réessayez.",
      invalid: 'Les données de connexion sont invalides.',
      readonlyNewer:
        'Le fichier de connexions a été écrit par une version plus récente et ne peut pas être modifié.',
      readFailed: 'Impossible de lire le fichier de connexions.',
      fileTooLarge: 'Le fichier de connexions dépasse la limite de sécurité.',
      ioError: "Impossible d'enregistrer le fichier de connexions.",
      encryptionUnavailable:
        "Windows n'a pas pu chiffrer le mot de passe. Rien n'a été enregistré.",
      decryptionFailed: 'Impossible de déchiffrer le mot de passe enregistré.',
      internal: "Une erreur inattendue s'est produite.",
      required: 'Obligatoire.',
      nameTooLong: 'Utilisez au maximum 100 caractères.',
      hostTooLong: 'Utilisez au maximum 253 caractères.',
      userTooLong: 'Utilisez au maximum 128 caractères.',
      portRange: 'Utilisez un port entre 1 et 65535.',
      environmentLabelRequired: "Décrivez l'environnement personnalisé.",
      environmentLabelTooLong: 'Utilisez au maximum 32 caractères.',
      colorRequired: 'Sélectionnez une des couleurs disponibles.'
    }
  },
  grid: {
    nullValue: 'NULL',
    noRowsToShow: 'Aucune ligne à afficher',
    ariaSortableColumn: 'Appuyez sur Entrée pour trier'
  }
}

export default messages
