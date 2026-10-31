import type { Messages } from '../types'

const messages: Messages = {
  app: {
    name: 'SeshatSQL'
  },
  shell: {
    disabledHint: 'Indisponível nesta pré-visualização.',
    menubar: {
      label: 'Barra de menu'
    },
    menu: {
      file: 'Ficheiro',
      edit: 'Editar',
      query: 'Consulta',
      view: 'Ver',
      tools: 'Ferramentas',
      help: 'Ajuda',
      fileNew: 'Novo',
      fileOpen: 'Abrir',
      fileSave: 'Guardar',
      fileSaveAs: 'Guardar como',
      fileClose: 'Fechar',
      fileExit: 'Sair',
      editUndo: 'Anular',
      editRedo: 'Refazer',
      editCut: 'Cortar',
      editCopy: 'Copiar',
      editPaste: 'Colar',
      editFind: 'Localizar',
      editReplace: 'Substituir',
      queryExecute: 'Executar',
      queryExecuteSelection: 'Executar seleção',
      queryStop: 'Parar',
      queryExplain: 'Explicar',
      viewObjectBrowser: 'Árvore de objetos',
      viewSqlLog: 'Registo SQL',
      viewHelpers: 'Painel auxiliar',
      toolsPreferences: 'Preferências',
      helpAbout: 'Acerca de'
    },
    toolbar: {
      label: 'Barra de ferramentas',
      newQuery: 'Nova consulta',
      open: 'Abrir',
      save: 'Guardar',
      execute: 'Executar',
      stop: 'Parar',
      refresh: 'Atualizar',
      filter: 'Filtrar',
      search: 'Localizar',
      settings: 'Definições',
      disconnect: 'Desligar',
      themeLabel: 'Tema',
      localeLabel: 'Idioma',
      localeHint:
        'O idioma do editor é aplicado no próximo arranque; a interface e a grelha mudam imediatamente.'
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
      label: 'Navegador de objetos',
      filterLabel: 'Filtrar objetos',
      sampleRoot: 'seshat_lab (exemplo)',
      tables: 'Tabelas ({count})',
      views: 'Vistas ({count})',
      empty: 'Nenhum objeto',
      noMatches: 'Nenhum objeto correspondente'
    },
    tabs: {
      queryOne: 'Consulta 1',
      resultOne: 'Resultado 1',
      addTab: 'Novo separador'
    },
    editor: {
      label: 'Editor SQL',
      loadFailure: 'Não foi possível carregar o editor SQL.'
    },
    results: {
      label: 'Resultados',
      copyHint:
        'Selecione linhas e prima Ctrl+C para copiar com cabeçalhos; sem seleção, é copiada a célula em foco.'
    },
    helpers: {
      title: 'Histórico',
      empty: 'Nenhuma consulta executada nesta sessão.'
    },
    log: {
      title: 'Registo SQL',
      clear: 'Limpar registo',
      empty: 'Nenhuma consulta executada.'
    },
    status: {
      disconnected: 'Desligado',
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
      log: 'Redimensionar registo SQL'
    }
  },
  grid: {
    nullValue: 'NULL',
    noRowsToShow: 'Nenhuma linha para apresentar',
    ariaSortableColumn: 'Prima Enter para ordenar'
  }
}

export default messages
