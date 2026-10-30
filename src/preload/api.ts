/**
 * Superfície exposta pelo preload ao renderer.
 * Só entram aqui métodos nomeados e validados; nunca um invoke genérico,
 * objetos de driver ou credenciais.
 */
export interface SeshatApi {
  readonly productName: string
}
