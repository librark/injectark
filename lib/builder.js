export class Builder {
  constructor ({ factories, base = '' }) {
    this.factories = factories
    this.base = base
  }

  build (config = {}) {
    const name = config.factory || this.base
    const [pivot, ...overrides] = (name || Object.keys(
      this.factories).shift()).split(',').map(name => name.trim())
    const Constructor = this.factories[pivot]
    const factory = new Constructor(config)
    for (const override of overrides) {
      const instance = new this.factories[override](config)
      const prototype = Object.getPrototypeOf(instance)
      for (const property of Object.getOwnPropertyNames(prototype)) {
        if (property === 'constructor') continue
        factory[property] = prototype[property].bind(instance)
      }
    }
    return factory
  }
}
