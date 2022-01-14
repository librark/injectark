import { Factory } from '../lib/factory.js'

describe('Factory interface', function () {
  let factory = null
  beforeEach(function () {
    factory = new Factory()
    factory.factoryMethod = function () {
      return 'ResolvedResource'
    }
  })

  it('has a default extract method', function () {
    const method = factory.extract('factoryMethod')
    expect(method()).toEqual('ResolvedResource')
  })
})
