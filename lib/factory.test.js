import { Factory } from '../lib/factory.js'

describe('Factory interface', function () {
  let factory = null
  beforeEach(function () {
    factory = new Factory()
    factory.factoryMethod = () => {
      return 'ResolvedResource'
    }
  })

  it('has a default extract method', () => {
    const method = factory.extract('factoryMethod')
    expect(method()).toEqual('ResolvedResource')
  })

  it('can be instantiated with a config object', () => {
    const config = { key: 'value' }
    factory = new Factory(config)
    expect(factory.config).toBe(config)
  })
})
