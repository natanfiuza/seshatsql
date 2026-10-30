/**
 * Surface exposed by the preload to the renderer.
 * Only named, validated methods belong here; never a generic invoke,
 * driver objects, or credentials.
 */
export interface SeshatApi {
  readonly productName: string
}
