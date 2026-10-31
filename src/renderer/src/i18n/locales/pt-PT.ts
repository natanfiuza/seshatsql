import type { Messages } from '../types'

const messages: Messages = {
  app: {
    name: 'SeshatSQL',
    tagline: 'Cliente SQL de ambiente de trabalho para MySQL'
  },
  lab: {
    title: 'Laboratório de interface',
    intro:
      'Ecrã temporário utilizado para validar o editor, a grelha, os temas e os idiomas antes de existir a área de trabalho real.',
    themeLabel: 'Tema',
    themeSystem: 'Sistema',
    themeLight: 'Claro',
    themeDark: 'Escuro',
    languageLabel: 'Idioma',
    localeNameEnUS: 'English (United States)',
    localeNamePtBR: 'Português (Brasil)',
    localeNamePtPT: 'Português (Portugal)',
    localeNameFr: 'Français',
    localeNameEs: 'Español',
    editorTitle: 'Editor SQL',
    editorHint: 'SQL de exemplo. Não é utilizada nenhuma ligação.',
    editorLanguageNotice:
      'O idioma do editor é aplicado no próximo arranque; a interface e a grelha mudam imediatamente.',
    editorLoadFailure: 'Não foi possível carregar o editor SQL.',
    gridTitle: 'Resultado de exemplo',
    gridHint: 'Linhas de exemplo só de leitura, incluindo NULL, Unicode e texto longo.',
    copyHint:
      'Selecione linhas e prima Ctrl+C para copiar com cabeçalhos; sem seleção, é copiada a célula em foco.',
    copySuccess: 'Copiado para a área de transferência.',
    copyFailure: 'Não foi possível copiar para a área de transferência.'
  },
  grid: {
    nullValue: 'NULL',
    noRowsToShow: 'Nenhuma linha para apresentar',
    ariaSortableColumn: 'Prima Enter para ordenar'
  }
}

export default messages
