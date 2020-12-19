import { Injectark } from '../lib/injectark.js'

class A { }

class B { }

class C {
  /** @param {A} a @param {B} b */
  constructor (a, b) {
    this.a = a
    this.b = b
  }
}

class D {
  /** @param {B} b @param {C} c */
  constructor (b, c) {
    this.b = b
    this.c = c
  }
}

class StandardFactory {
  constructor () {
    this._standardC.dependencies = ['A', 'B']
    this._standardD.dependencies = ['B', 'C']
  }

  extract (method) {
    return this[`_${method}`]
  }

  _standardA () {
    return new A()
  }

  _standardB () {
    return new B()
  }

  _standardC (a, b) {
    if (!(a && b)) throw new Error('Supply dependencies.')
    return new C(a, b)
  }

  _standardD (b, c) {
    return new D(b, c)
  }
}

class DefaultFactory {
  constructor () {
    this.c.dependencies = ['A', 'B']
    this.d.dependencies = ['B', 'C']
  }

  extract (method) {
    return this[`${method}`]
  }

  a () {
    return new A()
  }

  b () {
    return new B()
  }

  c (a, b) {
    if (!(a && b)) throw new Error('Supply dependencies.')
    return new C(a, b)
  }

  d (b, c) {
    return new D(b, c)
  }

  dataService () {
    throw new Error('Not implemented service.')
  }
}

const standardStrategy = {
  A: {
    method: 'standardA'
  },
  B: {
    method: 'standardB'
  },
  C: {
    method: 'standardC'
  },
  D: {
    method: 'standardD'
  }
}

describe('Injectark default', function () {
  let injector = null
  beforeEach(function () {
    injector = new Injectark()
  })

  it('can be instantiated', function () {
    expect(injector).toBeTruthy()
  })

  it('has a null parent', function () {
    expect(injector.parent).toBeNull()
  })

  it('has an empty registry', function () {
    expect(injector.registry).toEqual({})
  })

  it('has an empty strategy object', function () {
    expect(injector.strategy).toEqual({})
  })
})

describe('Injectark params', function () {
  const parent = new Injectark()
  const factory = new StandardFactory()
  const strategy = standardStrategy
  let injector = null

  beforeEach(function () {
    injector = new Injectark({
      strategy: strategy,
      factory: factory,
      parent: parent
    })
  })

  it('has the given objects as attributes', function () {
    expect(injector.parent).toBe(parent)
    expect(injector.strategy).toBe(strategy)
    expect(injector.factory).toBe(factory)
  })

  describe('Injectark resolve', function () {
    it('resolves a resource with no dependencies', function () {
      let instance = injector.resolve('A')
      expect(instance).toEqual(jasmine.any(A))
      instance = injector.resolve('B')
      expect(instance).toEqual(jasmine.any(B))

      expect(Object.keys(injector.registry).length).toEqual(2)
    })

    it('serves an already instantiated resource from its registry',
      function () {
        const instance = injector.resolve('A')
        expect(instance).toEqual(jasmine.any(A))
        const registryInstance = injector.resolve('A')
        expect(registryInstance).toBe(instance)

        expect(Object.keys(injector.registry).length).toEqual(1)
      })

    it("generates and injects a resource's dependencies on resolve",
      function () {
        const instance = injector.resolve('C')
        expect(instance).toEqual(jasmine.any(C))
        expect(instance.a).toEqual(jasmine.any(A))
        expect(instance.b).toEqual(jasmine.any(B))
        expect(Object.keys(injector.registry).length).toEqual(3)
        expect(injector.resolve('A')).toBe(instance.a)
        expect(injector.resolve('B')).toBe(instance.b)
      })

    it("doesn't persist ephemeral dependencies on the registry",
      function () {
        injector.strategy = {
          A: {
            method: 'standardA',
            ephemeral: true
          }
        }
        const instance = injector.resolve('A')

        expect(instance).toEqual(jasmine.any(A))
        expect(Object.keys(injector.registry).length).toEqual(0)
      })
  })
})

describe('Injectark forge', function () {
  class X {

  }

  class Y {
    constructor (x) {
      this.x = x
    }
  }

  class CoreFactory {
    constructor () {
      this._coreY.dependencies = ['X']
    }

    extract (method) {
      return this[`_${method}`]
    }

    _coreX () {
      return new X()
    }

    _coreY (x) {
      return new Y(x)
    }
  }

  const coreStrategy = {
    X: {
      method: 'coreX',
      second: 'yes'
    },
    Y: {
      method: 'coreY'
    }
  }

  let parent = null
  let injector = null
  let factory = null
  let strategy = null

  describe('Injectark hierarchical resolve', function () {
    beforeEach(function () {
      factory = new StandardFactory()
      strategy = Object.assign({}, standardStrategy)

      parent = new Injectark({
        strategy: coreStrategy,
        factory: new CoreFactory()
      })

      parent.registry.X = new X()

      injector = parent.forge({
        strategy: strategy,
        factory: factory
      })
    })

    it('forges a new injector from a parent one', function () {
      expect(injector.parent).toBe(parent)
      expect(injector.strategy).toBe(strategy)
      expect(injector.factory).toBe(factory)
    })

    it('resolves a resource own by its parent registry', function () {
      const instance = injector.resolve('X')
      expect(instance).toEqual(jasmine.any(X))
      expect(instance).toBe(parent.registry.X)

      expect(Object.keys(parent.registry).length).toEqual(1)
      expect(Object.keys(injector.registry).length).toEqual(0)
    })

    it('resolves a resource its parent know how to build', function () {
      const instance = injector.resolve('Y')
      expect(instance).toEqual(injector.parent.registry.Y)
      expect(Object.keys(injector.parent.registry).length).toEqual(2)
      expect(Object.keys(injector.registry).length).toEqual(0)
    })

    it('returns a unique resource if "unique" is true', function () {
      injector.strategy.Y = {
        method: 'coreY',
        unique: true
      }
      const instance = injector._registryFetch('Y')
      expect(instance).toBe(false)
    })

    it('might forge a subinjector without arguments', function () {
      const subInjector = injector.forge()
      expect(subInjector.parent).toBe(injector)
      expect(subInjector.strategy).toBe(null)
      expect(subInjector.factory).toBe(null)
    })

    it('resolves from its own registry if there is no parent', function () {
      injector.parent = null
      const instance = injector.resolve('Y')
      expect(instance).toEqual(null)
    })
  })
})

describe('Injectark optional strategy', function () {
  const parent = new Injectark()
  const factory = new DefaultFactory()
  let injector = null

  beforeEach(function () {
    injector = new Injectark({
      factory: factory,
      parent: parent
    })
  })

  it('has a strategy that defaults to an empty object', function () {
    expect(injector.parent).toBe(parent)
    expect(injector.factory).toBe(factory)
    expect(injector.strategy).toEqual({})
  })

  describe('Injectark default factory resolvers', function () {
    it('resolves a resource by its camelCase name by default', function () {
      let instance = injector.resolve('A')
      expect(instance).toEqual(jasmine.any(A))
      instance = injector.resolve('B')
      expect(instance).toEqual(jasmine.any(B))

      expect(Object.keys(injector.registry).length).toEqual(2)
    })

    it('resolves TitleCase to camelCase by default', function () {
      try {
        injector.resolve('DataService')
      } catch (e) {
        expect(e.message).toEqual('Not implemented service.')
      }
    })
  })
})
