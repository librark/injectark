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

  get<Type>(resource: new () => Type): Type
  get(resource: string): unknown

  set<Type>(resource: new () => Type, instance: Type): void
  set(resource: string, instance: unknown): void

  resolve<Type>(resource: new () => Type, strict?: boolean): Type
  resolve(resource: string, strict?: boolean): unknown

  forge(dependencies: { strategy?: object, factory?: Factory }): Injectark
}
