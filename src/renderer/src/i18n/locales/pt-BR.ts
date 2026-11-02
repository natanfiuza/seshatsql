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
      sampleRoot: 'Seshat Lab',
      tables: 'Tabelas ({count})',
      views: 'Views ({count})',
      events: 'Eventos ({count})',
      activeBadge: 'Ativa',
      empty: 'Nenhum objeto',
      noMatches: 'Nenhum objeto correspondente'
    },
    tabs: {
      queryOne: 'Consulta 1',
      queryNumber: 'Consulta {number}',
      resultOne: 'Resultado 1',
      addTab: 'Nova aba',
      close: 'Fechar {title}',
      newQuery: 'Nova consulta',
      workspaceLabel: 'Abas do workspace'
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
      simulated: 'Conectado (simulação)',
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
    },
    workspace: {
      demoNotice: 'Demonstração — somente leitura',
      notAvailable: 'Não disponível',
      openData: 'Abrir dados',
      sectionsLabel: 'Seções',
      units: {
        byte: 'B',
        kilobyte: 'KB',
        megabyte: 'MB',
        gigabyte: 'GB',
        terabyte: 'TB'
      },
      values: {
        yes: 'Sim',
        no: 'Não',
        global: 'Global',
        session: 'Sessão',
        none: 'Nenhum',
        never: 'Nunca',
        definer: 'Definidor',
        enabled: 'Ativado',
        recurring: 'Recorrente',
        preserve: 'Preservar'
      },
      objectTypes: {
        table: 'Tabela',
        view: 'Visão',
        event: 'Evento'
      },
      connection: {
        title: 'Conexão: {name}',
        databases: 'Bancos de dados ({count})',
        variables: 'Variáveis ({count})',
        status: 'Status ({count})',
        processes: 'Processos ({count})',
        commandStats: 'Estatísticas de comandos ({count})',
        databasesGrid: {
          name: 'Nome',
          tables: 'Tabelas',
          views: 'Views',
          size: 'Tamanho',
          collation: 'Collation'
        },
        variablesGrid: {
          variable: 'Variável',
          value: 'Valor',
          scope: 'Escopo'
        },
        statusGrid: {
          variable: 'Variável',
          value: 'Valor'
        },
        processesGrid: {
          id: 'ID',
          user: 'Usuário',
          host: 'Host',
          database: 'Banco',
          command: 'Comando',
          time: 'Tempo',
          state: 'Estado',
          info: 'Info'
        },
        commandStatsGrid: {
          command: 'Comando',
          total: 'Total',
          perHour: 'Por hora',
          perSecond: 'Por segundo'
        }
      },
      database: {
        title: 'Banco de dados: {name}',
        columns: {
          name: 'Nome',
          rows: 'Registros',
          size: 'Tamanho',
          createdAt: 'Criado em',
          updatedAt: 'Atualizado em',
          engine: 'Motor',
          comment: 'Comentário',
          type: 'Tipo'
        },
        empty: 'Nenhum objeto'
      },
      object: {
        tableTitle: 'Tabela: {name}',
        viewTitle: 'Visão: {name}',
        eventTitle: 'Evento: {name}',
        dataTitle: 'Dados: {name}',
        createCodeLabel: 'Código CREATE de {name}',
        alterCodeLabel: 'Código ALTER de {name}',
        subTabs: {
          basic: 'Básico',
          options: 'Opções',
          indexes: 'Índices',
          foreignKeys: 'Chaves estrangeiras',
          checks: 'Restrições CHECK',
          partitions: 'Partições',
          createSql: 'Código CREATE',
          alterSql: 'Código ALTER'
        },
        fields: {
          name: 'Nome',
          database: 'Banco de dados',
          engine: 'Motor',
          collation: 'Collation',
          charset: 'Conjunto de caracteres',
          rows: 'Registros',
          size: 'Tamanho',
          createdAt: 'Criado em',
          updatedAt: 'Atualizado em',
          comment: 'Comentário',
          rowFormat: 'Formato da linha',
          autoIncrement: 'Auto incremento',
          compression: 'Compressão',
          tablespace: 'Tablespace',
          encryption: 'Criptografia',
          definer: 'Definidor',
          security: 'Segurança SQL',
          checkOption: 'Opção de verificação',
          algorithm: 'Algoritmo',
          updatable: 'Atualizável',
          status: 'Status',
          type: 'Tipo',
          schedule: 'Agendamento',
          starts: 'Início',
          ends: 'Término',
          onCompletion: 'Ao concluir',
          lastExecuted: 'Última execução'
        },
        indexes: {
          name: 'Nome',
          columns: 'Colunas',
          unique: 'Único',
          type: 'Tipo'
        },
        foreignKeys: {
          name: 'Nome',
          column: 'Coluna',
          referencedTable: 'Tabela referenciada',
          referencedColumn: 'Coluna referenciada',
          onUpdate: 'Ao atualizar',
          onDelete: 'Ao excluir'
        },
        checks: {
          name: 'Nome',
          expression: 'Expressão',
          enforced: 'Aplicada'
        },
        partitions: {
          name: 'Nome',
          method: 'Método',
          expression: 'Expressão',
          rows: 'Registros',
          size: 'Tamanho'
        },
        emptyGrid: 'Nenhuma linha'
      },
      data: {
        gridLabel: 'Dados de {name}'
      }
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
