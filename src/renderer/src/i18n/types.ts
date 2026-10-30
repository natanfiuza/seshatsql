/**
 * Estrutura comum a todos os catálogos de mensagem.
 * Precisa ser alias de tipo (não interface): o vue-i18n exige assinatura de índice
 * implícita, que o TypeScript só infere para aliases de tipo.
 */
export type Messages = {
  app: {
    name: string
    tagline: string
  }
}
