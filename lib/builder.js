export class Builder {
  constructor ({ factories, base = '' }) {
    this.factories = factories
    this.base = base
  }

  build (config = {}) {
    const name = config.factory || this.base
    const names = (name || Object.keys(
      this.factories).shift()).split(',').map(name => name.trim())
    const Constructor = this.factories[names.slice().pop()]
    return names.reduce((store, item) => Object.assign(
      store, item), new Constructor(config))
  }
}
