export declare class Factory {
  constructor(config: object)

  config: object

  allowed: string[]

  extract(method: string): Function
}

export declare class Injectark {
  constructor(dependencies: {
    factory: Factory,
    strategy?: object,
    parent?: Injectark
  })

  config: object

  get(resource: string): unknown

  set(resource: string, instance: unknown): void

  resolve(resource: string, strict?: boolean): unknown

  forge(dependencies: { strategy?: object, factory?: Factory }): Injectark
}
