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
      toolsConnections: 'Conexões…',
      toolsPreferences: 'Preferências',
      helpAbout: 'Sobre'
    },
    toolbar: {
      label: 'Barra de ferramentas',
      connections: 'Conexões',
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
  persistence: {
    title: 'Armazenamento',
    warning: {
      recovered: 'O arquivo principal estava danificado; o último backup válido foi carregado.',
      quarantined: 'Um arquivo danificado foi preservado em quarentena.',
      quarantineFailed: 'Não foi possível mover um arquivo danificado para a quarentena.',
      futureVersion: 'Um arquivo foi gravado por uma versão mais nova e não será sobrescrito.',
      migrated: 'Um arquivo antigo foi migrado para o formato atual.',
      largeFile: 'Um arquivo de armazenamento tem mais de 1 MB.',
      fileTooLarge:
        'Um arquivo de armazenamento excede o limite de segurança de 16 MB e não foi carregado.',
      readFailed: 'Não foi possível ler um arquivo de armazenamento.',
      defaultsUsed: 'Configurações padrão estão em uso porque nenhum arquivo válido pôde ser lido.',
      legacyDirectory: 'Uma pasta de dados legada foi encontrada e mantida intacta.',
      saveFailed: 'Não foi possível salvar seus dados.'
    },
    close: {
      failed: 'Não foi possível salvar antes de fechar. A janela permanece aberta.'
    },
    actions: {
      retry: 'Tentar novamente',
      exitWithoutSaving: 'Sair sem salvar',
      confirmDiscard: 'Descartar alterações não salvas e sair?',
      confirmExit: 'Sair',
      cancel: 'Cancelar',
      dismiss: 'Dispensar'
    }
  },
  connections: {
    title: 'Conexões',
    listLabel: 'Conexões salvas',
    loading: 'Carregando conexões…',
    empty: 'Nenhuma conexão salva.',
    notice: {
      writeBlocked:
        'Não é possível alterar os perfis de conexão até resolver o problema de armazenamento acima.'
    },
    environment: {
      development: 'Desenvolvimento',
      staging: 'Homologação',
      production: 'Produção',
      custom: 'Personalizado'
    },
    color: {
      blue: 'Azul',
      green: 'Verde',
      amber: 'Âmbar',
      red: 'Vermelho',
      violet: 'Violeta',
      teal: 'Turquesa',
      pink: 'Rosa',
      gray: 'Cinza'
    },
    fields: {
      name: 'Nome',
      host: 'Servidor',
      port: 'Porta',
      user: 'Usuário',
      password: 'Senha',
      passwordSaved: 'Há uma senha salva para esta conexão.',
      removePassword: 'Remover senha salva',
      environment: 'Ambiente',
      environmentLabel: 'Nome do ambiente',
      color: 'Cor',
      passwordPlaceholderKeep: 'Deixe em branco para manter a senha salva',
      passwordPlaceholderNone: 'Deixe em branco para não salvar senha'
    },
    passwordHint:
      'As senhas são cifradas pelo Windows para o usuário e a máquina atuais. Copiar a pasta de dados para outro lugar não revela a senha.',
    unsaved: {
      question: 'Descartar alterações não salvas?'
    },
    delete: {
      question: 'Excluir “{name}”?',
      warning:
        'As abas serão mantidas. O SQL salvo que referencia esta conexão não poderá usar o perfil até que outro seja atribuído.'
    },
    actions: {
      new: 'Novo',
      delete: 'Excluir',
      save: 'Salvar',
      cancel: 'Cancelar',
      discard: 'Descartar',
      keepEditing: 'Continuar editando',
      confirmDelete: 'Excluir conexão',
      cancelDelete: 'Manter conexão'
    },
    errors: {
      duplicateName: 'Já existe uma conexão com este nome.',
      notFound: 'Esta conexão não existe mais. Recarregue a lista e tente novamente.',
      invalid: 'Os dados da conexão são inválidos.',
      readonlyNewer:
        'O arquivo de conexões foi gravado por uma versão mais nova e não pode ser alterado.',
      readFailed: 'Não foi possível ler o arquivo de conexões.',
      fileTooLarge: 'O arquivo de conexões excede o limite de segurança.',
      ioError: 'Não foi possível gravar o arquivo de conexões.',
      encryptionUnavailable:
        'O Windows não conseguiu cifrar a senha. Nada foi gravado.',
      decryptionFailed: 'Não foi possível decifrar a senha salva.',
      internal: 'Ocorreu um erro inesperado.',
      required: 'Obrigatório.',
      nameTooLong: 'Use no máximo 100 caracteres.',
      hostTooLong: 'Use no máximo 253 caracteres.',
      userTooLong: 'Use no máximo 128 caracteres.',
      portRange: 'Use uma porta entre 1 e 65535.',
      environmentLabelRequired: 'Descreva o ambiente personalizado.',
      environmentLabelTooLong: 'Use no máximo 32 caracteres.',
      colorRequired: 'Selecione uma das cores disponíveis.'
    }
  },
  grid: {
    nullValue: 'NULL',
    noRowsToShow: 'Nenhuma linha para exibir',
    ariaSortableColumn: 'Pressione Enter para ordenar'
  }
}

export default messages
