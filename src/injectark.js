import { Factory } from './factory.js' // eslint-disable-line

export class Injectark {
  /** @param {{strategy?: Object<string, any>, factory?: Factory,
     * parent?: Injectark}} Object  */
  constructor ({ strategy = {}, factory = null, parent = null } = {}) {
    this.strategy = strategy
    this.factory = factory
    this.parent = parent
    this.registry = {}
  }

  /** @param {string} resource */
  resolve (resource) {
    const fetched = this._registryFetch(resource)
    if (fetched) {
      return fetched
    }

    const resourceStrategy = this.strategy[resource] || {}
    const persist = !(
      resourceStrategy['ephemeral'] || resourceStrategy['unique'])
    const instance = this._dependencyBuild(resource, persist)

    this._instanceHold(resource, instance)

    return instance
  }

  /** @param {{strategy?: Object<string, any>, factory?: Factory }}
   * Object */
  forge ({ strategy = null, factory = null } = {}) {
    return new Injectark(
      { strategy: strategy, factory: factory, parent: this })
  }

  /** @param {string} resource */
  _registryFetch (resource) {
    let fetched = false

    const rule = this.strategy[resource] || {}
    const unique = rule ? rule['unique'] : false
    if (unique) {
      return fetched
    }
    if (Object.keys(this.registry).includes(resource)) {
      fetched = this.registry[resource]
    } else {
      const parent = this.parent
      fetched = parent ? parent._registryFetch(resource) : false
    }
    return fetched
  }

  /** @param {string} resource @param {boolean} persist */
  _dependencyBuild (resource, persist = true) {
    let instance = null

    const rule = this.strategy[resource] || { 'method': '' }
    const builder = this.factory.extract(rule['method'])

    if (!builder) {
      const parent = this.parent
      return parent ? parent._dependencyBuild(resource, persist) : instance
    }

    const dependencies = builder['dependencies'] || []
    const dependencyInstances = []
    for (const dependency of dependencies) {
      const dependencyInstance = this.resolve(dependency)
      dependencyInstances.push(dependencyInstance)
    }
    instance = builder(...dependencyInstances)

    if (persist) {
      this.registry[resource] = instance
    }

    return instance
  }

  _instanceHold (resource, instance) {
    if (this.strategy[resource] && this.strategy[resource]['unique']) {
      this.registry[resource] = instance
      return true
    }

    return false
  }
}
