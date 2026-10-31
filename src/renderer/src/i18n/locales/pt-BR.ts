import type { Messages } from '../types'

const messages: Messages = {
  app: {
    name: 'SeshatSQL',
    tagline: 'Cliente SQL desktop para MySQL'
  },
  lab: {
    title: 'Laboratório de interface',
    intro:
      'Tela temporária usada para validar o editor, a grade, os temas e os idiomas antes de existir o espaço de trabalho real.',
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
    editorHint: 'SQL de exemplo. Nenhuma conexão é usada.',
    editorLanguageNotice:
      'O idioma do editor é aplicado na próxima inicialização; a interface e a grade mudam imediatamente.',
    editorLoadFailure: 'Não foi possível carregar o editor SQL.',
    gridTitle: 'Resultado de exemplo',
    gridHint: 'Linhas de exemplo somente leitura, incluindo NULL, Unicode e texto longo.',
    copyHint:
      'Selecione linhas e pressione Ctrl+C para copiar com cabeçalhos; sem seleção, a célula em foco é copiada.',
    copySuccess: 'Copiado para a área de transferência.',
    copyFailure: 'Não foi possível copiar para a área de transferência.'
  },
  grid: {
    nullValue: 'NULL',
    noRowsToShow: 'Nenhuma linha para exibir',
    ariaSortableColumn: 'Pressione Enter para ordenar'
  }
}

export default messages
