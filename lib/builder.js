export class Builder {
  constructor ({ factories, base = '' }) {
    this.factories = factories
    this.base = base
  }

  build (config = {}) {
    let name = config.factory || this.base
    name = name || Object.keys(this.factories).shift()
    const Constructor = this.factories[name]
    return new Constructor(config)
  }
  
  prepare () {
    return (config) => this.build(config)
  }
}
