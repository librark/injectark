import { describe, it, expect } from '@jest/globals'
import { Builder } from './builder.js'
import { Factory } from './factory.js'

describe('Builder', function () {
  let builder = null

  class AlphaFactory extends Factory {}
  class BetaFactory extends Factory {}
  class GammaFactory extends Factory {}

  const factories = {
    alpha: AlphaFactory,
    beta: BetaFactory,
    gamma: GammaFactory
  }

  beforeEach(() => {
    const base = 'beta'

    builder = new Builder({ factories, base })
  })

  it('can be instantiated', () => {
    expect(builder).toBeTruthy()
  })

  it('builds a factory upon a given configuration', () => {
    const config = {
      factory: 'gamma'
    }

    const factory = builder.build(config)

    expect(factory).toBeInstanceOf(GammaFactory)
  })

  it('builds the first factory by default if no config or base given', () => {
    const builder = new Builder({ factories })

    const factory = builder.build()

    expect(factory).toBeInstanceOf(AlphaFactory)
  })

  it('provides a prepare method that returns a build function', () => {
    const config = {
      factory: 'gamma'
    }
    const build = new Builder({ factories }).prepare()

    const factory = build(config)

    expect(factory).toBeInstanceOf(GammaFactory)
  })
})