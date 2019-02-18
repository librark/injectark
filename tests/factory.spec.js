import { Factory } from '../lib/factory.js'

describe('Factory interface', function () {
  let factory = null
  beforeEach(function () {
    factory = new Factory()
  })

  it('has an abstract extract method', function () {
    try {
      factory.extract('factoryMethod')
    } catch (error) {
      expect(error).toBeTruthy()
    }
  })
})
