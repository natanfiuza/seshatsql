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
      toolsPreferences: 'Préférences',
      helpAbout: 'À propos'
    },
    toolbar: {
      label: "Barre d'outils",
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
  grid: {
    nullValue: 'NULL',
    noRowsToShow: 'Aucune ligne à afficher',
    ariaSortableColumn: 'Appuyez sur Entrée pour trier'
  }
}

export default messages
