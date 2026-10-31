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
  persistence: {
    title: 'Armazenamento',
    warning: {
      recovered: 'O ficheiro principal estava danificado; o último backup válido foi carregado.',
      quarantined: 'Um ficheiro danificado foi preservado em quarentena.',
      quarantineFailed: 'Não foi possível mover um ficheiro danificado para a quarentena.',
      futureVersion: 'Um ficheiro foi gravado por uma versão mais recente e não será substituído.',
      migrated: 'Um ficheiro antigo foi migrado para o formato atual.',
      largeFile: 'Um ficheiro de armazenamento tem mais de 1 MB.',
      fileTooLarge:
        'Um ficheiro de armazenamento excede o limite de segurança de 16 MB e não foi carregado.',
      readFailed: 'Não foi possível ler um ficheiro de armazenamento.',
      defaultsUsed: 'Estão a ser usadas configurações predefinidas porque não foi possível ler nenhum ficheiro válido.',
      legacyDirectory: 'Foi encontrada uma pasta de dados legada, que foi mantida intacta.',
      saveFailed: 'Não foi possível guardar os seus dados.'
    },
    close: {
      failed: 'Não foi possível guardar antes de fechar. A janela permanece aberta.'
    },
    actions: {
      retry: 'Tentar novamente',
      exitWithoutSaving: 'Sair sem guardar',
      confirmDiscard: 'Descartar alterações não guardadas e sair?',
      confirmExit: 'Sair',
      cancel: 'Cancelar',
      dismiss: 'Dispensar'
    }
  },
  grid: {
    nullValue: 'NULL',
    noRowsToShow: 'Nenhuma linha para apresentar',
    ariaSortableColumn: 'Prima Enter para ordenar'
  }
}

export default messages
