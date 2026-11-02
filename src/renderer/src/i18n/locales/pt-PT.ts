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
      toolsConnections: 'Ligações…',
      toolsPreferences: 'Preferências',
      helpAbout: 'Acerca de'
    },
    toolbar: {
      label: 'Barra de ferramentas',
      connections: 'Ligações',
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
      sampleRoot: 'Seshat Lab',
      tables: 'Tabelas ({count})',
      views: 'Vistas ({count})',
      events: 'Eventos ({count})',
      activeBadge: 'Ativa',
      empty: 'Nenhum objeto',
      noMatches: 'Nenhum objeto correspondente'
    },
    tabs: {
      queryOne: 'Consulta 1',
      queryNumber: 'Consulta {number}',
      resultOne: 'Resultado 1',
      addTab: 'Novo separador',
      close: 'Fechar {title}',
      newQuery: 'Nova consulta',
      workspaceLabel: 'Abas da área de trabalho'
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
      simulated: 'Ligado (simulação)',
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
    },
    workspace: {
      demoNotice: 'Demonstração — só de leitura',
      notAvailable: 'Não disponível',
      openData: 'Abrir dados',
      sectionsLabel: 'Secções',
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
        view: 'Vista',
        event: 'Evento'
      },
      connection: {
        title: 'Ligação: {name}',
        databases: 'Bases de dados ({count})',
        variables: 'Variáveis ({count})',
        status: 'Estado ({count})',
        processes: 'Processos ({count})',
        commandStats: 'Estatísticas de comandos ({count})',
        databasesGrid: {
          name: 'Nome',
          tables: 'Tabelas',
          views: 'Vistas',
          size: 'Tamanho',
          collation: 'Collation'
        },
        variablesGrid: {
          variable: 'Variável',
          value: 'Valor',
          scope: 'Âmbito'
        },
        statusGrid: {
          variable: 'Variável',
          value: 'Valor'
        },
        processesGrid: {
          id: 'ID',
          user: 'Utilizador',
          host: 'Anfitrião',
          database: 'Base de dados',
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
        title: 'Base de dados: {name}',
        columns: {
          name: 'Nome',
          rows: 'Registos',
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
        viewTitle: 'Vista: {name}',
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
          database: 'Base de dados',
          engine: 'Motor',
          collation: 'Collation',
          charset: 'Conjunto de caracteres',
          rows: 'Registos',
          size: 'Tamanho',
          createdAt: 'Criado em',
          updatedAt: 'Atualizado em',
          comment: 'Comentário',
          rowFormat: 'Formato da linha',
          autoIncrement: 'Auto incremento',
          compression: 'Compressão',
          tablespace: 'Tablespace',
          encryption: 'Encriptação',
          definer: 'Definidor',
          security: 'Segurança SQL',
          checkOption: 'Opção de verificação',
          algorithm: 'Algoritmo',
          updatable: 'Atualizável',
          status: 'Estado',
          type: 'Tipo',
          schedule: 'Agendamento',
          starts: 'Início',
          ends: 'Fim',
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
          onDelete: 'Ao eliminar'
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
          rows: 'Registos',
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
  connections: {
    title: 'Ligações',
    listLabel: 'Ligações guardadas',
    loading: 'A carregar ligações…',
    empty: 'Nenhuma ligação guardada.',
    notice: {
      writeBlocked:
        'Não é possível alterar os perfis de ligação enquanto o problema de armazenamento acima não for resolvido.'
    },
    environment: {
      development: 'Desenvolvimento',
      staging: 'Pré-produção',
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
      gray: 'Cinzento'
    },
    fields: {
      name: 'Nome',
      host: 'Servidor',
      port: 'Porta',
      user: 'Utilizador',
      password: 'Palavra-passe',
      passwordSaved: 'Há uma palavra-passe guardada para esta ligação.',
      removePassword: 'Remover palavra-passe guardada',
      environment: 'Ambiente',
      environmentLabel: 'Nome do ambiente',
      color: 'Cor',
      passwordPlaceholderKeep: 'Deixe em branco para manter a palavra-passe guardada',
      passwordPlaceholderNone: 'Deixe em branco para não guardar palavra-passe'
    },
    passwordHint:
      'As palavras-passe são cifradas pelo Windows para o utilizador e a máquina atuais. Copiar a pasta de dados para outro local não revela a palavra-passe.',
    unsaved: {
      question: 'Descartar alterações não guardadas?'
    },
    delete: {
      question: 'Eliminar “{name}”?',
      warning:
        'Os separadores são mantidos. O SQL guardado que referencia esta ligação não poderá usar o perfil até que outro seja atribuído.'
    },
    actions: {
      new: 'Nova',
      delete: 'Eliminar',
      save: 'Guardar',
      cancel: 'Cancelar',
      discard: 'Descartar',
      keepEditing: 'Continuar a editar',
      confirmDelete: 'Eliminar ligação',
      cancelDelete: 'Manter ligação'
    },
    errors: {
      duplicateName: 'Já existe uma ligação com este nome.',
      notFound: 'Esta ligação já não existe. Recarregue a lista e tente novamente.',
      invalid: 'Os dados da ligação são inválidos.',
      readonlyNewer:
        'O ficheiro de ligações foi gravado por uma versão mais recente e não pode ser alterado.',
      readFailed: 'Não foi possível ler o ficheiro de ligações.',
      fileTooLarge: 'O ficheiro de ligações excede o limite de segurança.',
      ioError: 'Não foi possível guardar o ficheiro de ligações.',
      encryptionUnavailable:
        'O Windows não conseguiu cifrar a palavra-passe. Nada foi guardado.',
      decryptionFailed: 'Não foi possível decifrar a palavra-passe guardada.',
      internal: 'Ocorreu um erro inesperado.',
      required: 'Obrigatório.',
      nameTooLong: 'Utilize no máximo 100 caracteres.',
      hostTooLong: 'Utilize no máximo 253 caracteres.',
      userTooLong: 'Utilize no máximo 128 caracteres.',
      portRange: 'Utilize uma porta entre 1 e 65535.',
      environmentLabelRequired: 'Descreva o ambiente personalizado.',
      environmentLabelTooLong: 'Utilize no máximo 32 caracteres.',
      colorRequired: 'Selecione uma das cores disponíveis.'
    }
  },
  grid: {
    nullValue: 'NULL',
    noRowsToShow: 'Nenhuma linha para apresentar',
    ariaSortableColumn: 'Prima Enter para ordenar'
  }
}

export default messages
