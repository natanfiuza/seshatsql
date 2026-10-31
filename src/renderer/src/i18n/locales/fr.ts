import type { Messages } from '../types'

const messages: Messages = {
  app: {
    name: 'SeshatSQL',
    tagline: 'Client SQL de bureau pour MySQL'
  },
  lab: {
    title: "Laboratoire d'interface",
    intro:
      "Écran temporaire utilisé pour valider l'éditeur, la grille, les thèmes et les langues avant l'existence de l'espace de travail réel.",
    themeLabel: 'Thème',
    themeSystem: 'Système',
    themeLight: 'Clair',
    themeDark: 'Sombre',
    languageLabel: 'Langue',
    localeNameEnUS: 'English (United States)',
    localeNamePtBR: 'Português (Brasil)',
    localeNamePtPT: 'Português (Portugal)',
    localeNameFr: 'Français',
    localeNameEs: 'Español',
    editorTitle: 'Éditeur SQL',
    editorHint: "SQL d'exemple. Aucune connexion n'est utilisée.",
    editorLanguageNotice:
      "La langue de l'éditeur s'applique au prochain démarrage ; l'interface et la grille changent immédiatement.",
    editorLoadFailure: "Impossible de charger l'éditeur SQL.",
    gridTitle: "Résultat d'exemple",
    gridHint: 'Lignes d’exemple en lecture seule, avec NULL, Unicode et texte long.',
    copyHint:
      'Sélectionnez des lignes et appuyez sur Ctrl+C pour copier avec les en-têtes ; sans sélection, la cellule active est copiée.',
    copySuccess: 'Copié dans le presse-papiers.',
    copyFailure: 'Impossible de copier dans le presse-papiers.'
  },
  grid: {
    nullValue: 'NULL',
    noRowsToShow: 'Aucune ligne à afficher',
    ariaSortableColumn: 'Appuyez sur Entrée pour trier'
  }
}

export default messages
