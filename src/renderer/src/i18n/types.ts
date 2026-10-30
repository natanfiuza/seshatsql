/**
 * Shape shared by all message catalogs.
 * Must be a type alias (not an interface): vue-i18n requires an implicit index
 * signature, which TypeScript only infers for type aliases.
 */
export type Messages = {
  app: {
    name: string
    tagline: string
  }
}
