import { Injectark } from './injectark.js'
import { Factory } from './factory.js'

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

class StandardFactory extends Factory {
  constructor (config) {
    super(config)
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

class DefaultFactory extends Factory {
  constructor (config) {
    super(config)
    this.c.dependencies = ['A', 'B']
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
      strategy,
      factory,
      parent
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
      expect(instance).toEqual(expect.any(A))
      instance = injector.resolve('B')
      expect(instance).toEqual(expect.any(B))

      expect(Object.keys(injector.registry).length).toEqual(2)
    })

    it('serves an already instantiated resource from its registry',
      function () {
        const instance = injector.resolve('A')
        expect(instance).toEqual(expect.any(A))
        const registryInstance = injector.resolve('A')
        expect(registryInstance).toBe(instance)

        expect(Object.keys(injector.registry).length).toEqual(1)
      })

    it("generates and injects a resource's dependencies on resolve",
      function () {
        const instance = injector.resolve('C')
        expect(instance).toEqual(expect.any(C))
        expect(instance.a).toEqual(expect.any(A))
        expect(instance.b).toEqual(expect.any(B))
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

        expect(instance).toEqual(expect.any(A))
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

  class CoreFactory extends Factory {
    constructor (config) {
      super(config)
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
        strategy,
        factory
      })
    })

    it('forges a new injector from a parent one', function () {
      expect(injector.parent).toBe(parent)
      expect(injector.strategy).toBe(strategy)
      expect(injector.factory).toBe(factory)
    })

    it('resolves a resource own by its parent registry', function () {
      const instance = injector.resolve('X')
      expect(instance).toEqual(expect.any(X))
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
      expect(subInjector.strategy).toEqual({})
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
  const config = { key: 'value' }
  const factory = new DefaultFactory(config)
  let injector = null

  beforeEach(function () {
    injector = new Injectark({
      factory,
      parent
    })
  })

  it('has a strategy that defaults to an empty object', function () {
    expect(injector.parent).toBe(parent)
    expect(injector.factory).toBe(factory)
    expect(injector.strategy).toEqual({})
  })

  it('provides its factory config through a config property', () => {
    class CustomA {}
    const originalA = injector.resolve('A')
    expect(originalA instanceof A).toBeTruthy()

    injector.set('A', new CustomA())
    const customA = injector.resolve('A')

    expect(customA instanceof CustomA).toBeTruthy()
  })

  it('allows to manually replace a dependency using "set" method', () => {
    expect(injector.config).toBe(injector.factory.config)
  })

  describe('Injectark default factory resolvers', function () {
    it('resolves a resource by its camelCase name by default', function () {
      let instance = injector.resolve('A')
      expect(instance).toEqual(expect.any(A))
      instance = injector.resolve('B')
      expect(instance).toEqual(expect.any(B))

      instance = injector.resolve('C')
      expect(instance).toEqual(expect.any(C))

      instance = injector.resolve('D')
      expect(instance).toEqual(expect.any(D))

      expect(Object.keys(injector.registry).length).toEqual(4)
    })

    it('resolves TitleCase to camelCase by default', function () {
      try {
        injector.resolve('DataService')
      } catch (error) {
        expect(error.message).toEqual('Not implemented service.')
      }
    })
  })
})

describe('Injectark strict and restricted access', function () {
  const config = { key: 'value' }
  const factory = new DefaultFactory(config)
  let injector = null

  beforeEach(function () {
    injector = new Injectark({
      factory
    })
  })

  it('resolves in strict mode raising an error on missings', () => {
    expect(() => injector.resolve('X', true)).toThrow(
      'The "X" resource could not be resolved.')
  })

  it('restricts access on getting non-public factory resources', () => {
    factory.allowed = ['C', 'D']

    expect(() => injector.get('A')).toThrow(
      'Direct access to "A" is not allowed.')

    expect(() => injector.get('B')).toThrow(
      'Direct access to "B" is not allowed.')

    let instance = injector.get('C')
    expect(instance instanceof C).toBeTruthy()

    instance = injector.get('D')
    expect(instance instanceof D).toBeTruthy()
  })
})
