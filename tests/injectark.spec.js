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
    this._standardC['dependencies'] = ['A', 'B']
    this._standardD['dependencies'] = ['B', 'C']
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

const standardStrategy = {
  'A': {
    'method': 'standardA'
  },
  'B': {
    'method': 'standardB'
  },
  'C': {
    'method': 'standardC'
  },
  'D': {
    'method': 'standardD'
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
  let parent = new Injectark()
  let factory = new StandardFactory()
  let strategy = standardStrategy
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
        let instance = injector.resolve('A')
        expect(instance).toEqual(jasmine.any(A))
        let registryInstance = injector.resolve('A')
        expect(registryInstance).toBe(instance)

        expect(Object.keys(injector.registry).length).toEqual(1)
      })

    it("generates and injects a resource's dependencies on resolve",
      function () {
        let instance = injector.resolve('C')
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
          'A': {
            'method': 'standardA',
            'ephemeral': true
          }
        }
        let instance = injector.resolve('A')

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
      this._coreY['dependencies'] = ['X']
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
    'X': {
      'method': 'coreX',
      'second': 'yes'
    },
    'Y': {
      'method': 'coreY'
    }
  }

  var parent = null
  var injector = null
  var factory = null
  var strategy = null

  describe('Injectark hierarchical resolve', function () {
    beforeEach(function () {
      factory = new StandardFactory()
      strategy = Object.assign({}, standardStrategy)

      parent = new Injectark({
        strategy: coreStrategy,
        factory: new CoreFactory()
      })

      parent.registry['X'] = new X()

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
      expect(instance).toBe(parent.registry['X'])

      expect(Object.keys(parent.registry).length).toEqual(1)
      expect(Object.keys(injector.registry).length).toEqual(0)
    })

    it('resolves a resource its parent know how to build', function () {
      const instance = injector.resolve('Y')
      expect(instance).toEqual(injector.parent.registry['Y'])
      expect(Object.keys(injector.parent.registry).length).toEqual(2)
      expect(Object.keys(injector.registry).length).toEqual(0)
    })

    it('returns a unique resources if "unique" is true', function () {
      injector.strategy['Y'] = {
        'method': 'coreY',
        'unique': true
      }
      const instance = injector._registryFetch('Y')
      expect(instance).toBe(false)
    })
  })
})
