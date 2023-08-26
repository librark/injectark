import { Factory } from './factory.js' // eslint-disable-line

export class Injectark {
  /** @param {{ factory: Factory,
    * strategy?: object, parent?: Injectark }} object  */
  constructor ({ factory, strategy = {}, parent = null } = {}) {
    this.strategy = strategy
    this.factory = factory
    this.parent = parent
    this.registry = {}
    this._load()
  }

  /** @return {object} */
  get config () {
    return this.factory.config
  }

  /** @param {string | object} resource */
  get (resource) {
    if (typeof resource !== 'string') resource = resource.name
    const allowed = this.factory.allowed
    if (allowed?.length && !allowed.includes(resource)) {
      throw new Error(`Direct access to "${resource}" is not allowed.`)
    }
    return this.resolve(resource, true)
  }

  /** @param {string | object} resource @param {object} instance */
  set (resource, instance) {
    if (typeof resource !== 'string') resource = resource.name
    this.registry[resource] = instance
  }

  /** @param {string | object} resource @param {boolean=} strict */
  resolve (resource, strict = false) {
    if (typeof resource !== 'string') resource = resource.name

    const fetched = this._registryFetch(resource)
    if (fetched) {
      return fetched
    }

    const resourceStrategy = this.strategy[resource] || {}
    const persist = !(resourceStrategy.ephemeral)
    const instance = this._dependencyBuild(resource, persist)

    if (strict && !instance) {
      throw new Error(`The "${resource}" resource could not be resolved.`)
    }

    return instance
  }

  /** @param {{strategy?: Object<string, any>, factory?: Factory }}
   * Object */
  forge ({ strategy = {}, factory = null } = {}) {
    return new Injectark(
      { parent: this, strategy, factory })
  }

  _load () {
    if (!this.factory) return
    const lazy = this.factory.lazy
    if (Object.keys(this.strategy).length) {
      Object.keys(this.strategy).forEach(
        resource => !lazy.includes(resource) && this.resolve(resource))
      return
    }
    const dependencies = Object.getOwnPropertyNames(
      Object.getPrototypeOf(this.factory)).filter(
      method => (!['constructor', 'extract', ...lazy].includes(method) && (
        typeof this.factory[method]) === 'function'))
    for (const dependency of dependencies) {
      const normalized = dependency[0].toUpperCase() + dependency.slice(1)
      this.resolve(normalized)
    }
  }

  /** @param {string} resource */
  _registryFetch (resource) {
    let fetched = false
    const rule = this.strategy[resource] || {}
    if (rule.unique) {
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

  _dependencyBuild (resource, persistent) {
    let instance
    let persist = persistent
    const rule = this.strategy[resource] || {
      method: resource[0].toLowerCase() + resource.slice(1)
    }

    const extract = this.factory.extract.bind(this.factory)
    const builder = extract(rule.method)

    if (builder) {
      const dependencies = (
        builder.dependencies || this._parseDependencies(builder))
      const dependencyInstances = []

      for (const dependency of dependencies) {
        const dependencyInstance = this.resolve(dependency)
        dependencyInstances.push(dependencyInstance)
      }
      instance = builder.bind(this.factory)(...dependencyInstances)
    } else {
      instance = (this.parent
        ? this.parent._dependencyBuild(resource, persist)
        : instance)

      const resourceStrategy = this.strategy[resource] || {}
      persist = (persist && resourceStrategy.unique)
    }

    if (persist) {
      this.registry[resource] = instance
    }

    return instance
  }

  _parseDependencies (builder) {
    const stripComments = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg
    const argumentNames = /([^\s,]+)/g
    const functionString = builder.toString().replace(stripComments, '')
    const result = functionString.slice(functionString.indexOf(
      '(') + 1, functionString.indexOf(')')).match(argumentNames) || []

    return result.map(dependency =>
      dependency.charAt(0).toUpperCase() + dependency.slice(1))
  }
}
