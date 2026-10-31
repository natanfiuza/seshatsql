import type { Messages } from '../types'

const messages: Messages = {
  app: {
    name: 'SeshatSQL'
  },
  shell: {
    disabledHint: 'Indisponível nesta prévia.',
    menubar: {
      label: 'Barra de menu'
    },
    menu: {
      file: 'Arquivo',
      edit: 'Editar',
      query: 'Consulta',
      view: 'Exibir',
      tools: 'Ferramentas',
      help: 'Ajuda',
      fileNew: 'Novo',
      fileOpen: 'Abrir',
      fileSave: 'Salvar',
      fileSaveAs: 'Salvar como',
      fileClose: 'Fechar',
      fileExit: 'Sair',
      editUndo: 'Desfazer',
      editRedo: 'Refazer',
      editCut: 'Recortar',
      editCopy: 'Copiar',
      editPaste: 'Colar',
      editFind: 'Localizar',
      editReplace: 'Substituir',
      queryExecute: 'Executar',
      queryExecuteSelection: 'Executar seleção',
      queryStop: 'Parar',
      queryExplain: 'Explicar',
      viewObjectBrowser: 'Árvore de objetos',
      viewSqlLog: 'Registro SQL',
      viewHelpers: 'Painel auxiliar',
      toolsPreferences: 'Preferências',
      helpAbout: 'Sobre'
    },
    toolbar: {
      label: 'Barra de ferramentas',
      newQuery: 'Nova consulta',
      open: 'Abrir',
      save: 'Salvar',
      execute: 'Executar',
      stop: 'Parar',
      refresh: 'Atualizar',
      filter: 'Filtrar',
      search: 'Localizar',
      settings: 'Configurações',
      disconnect: 'Desconectar',
      themeLabel: 'Tema',
      localeLabel: 'Idioma',
      localeHint:
        'O idioma do editor é aplicado na próxima inicialização; a interface e a grade mudam imediatamente.'
    },
    theme: {
      system: 'Sistema',
      light: 'Claro',
      dark: 'Escuro'
    },
    locale: {
      enUS: 'English (United States)',
      ptBR: 'Português (Brasil)',
      ptPT: 'Português (Portugal)',
      fr: 'Français',
      es: 'Español'
    },
    tree: {
      label: 'Árvore de objetos',
      filterLabel: 'Filtrar objetos',
      sampleRoot: 'seshat_lab (exemplo)',
      tables: 'Tabelas ({count})',
      views: 'Views ({count})',
      empty: 'Nenhum objeto',
      noMatches: 'Nenhum objeto correspondente'
    },
    tabs: {
      queryOne: 'Consulta 1',
      resultOne: 'Resultado 1',
      addTab: 'Nova aba'
    },
    editor: {
      label: 'Editor SQL',
      loadFailure: 'Não foi possível carregar o editor SQL.'
    },
    results: {
      label: 'Resultados',
      copyHint:
        'Selecione linhas e pressione Ctrl+C para copiar com cabeçalhos; sem seleção, a célula em foco é copiada.'
    },
    helpers: {
      title: 'Histórico',
      empty: 'Nenhuma consulta executada nesta sessão.'
    },
    log: {
      title: 'Registro SQL',
      clear: 'Limpar registro',
      empty: 'Nenhuma consulta executada.'
    },
    status: {
      disconnected: 'Desconectado',
      rows: 'Linhas: {count}',
      sample: 'Dados de exemplo'
    },
    copy: {
      success: 'Copiado para a área de transferência.',
      failure: 'Não foi possível copiar para a área de transferência.'
    },
    split: {
      tree: 'Redimensionar árvore de objetos',
      editor: 'Redimensionar editor',
      log: 'Redimensionar registro SQL'
    }
  },
  grid: {
    nullValue: 'NULL',
    noRowsToShow: 'Nenhuma linha para exibir',
    ariaSortableColumn: 'Pressione Enter para ordenar'
  }
}

export default messages
