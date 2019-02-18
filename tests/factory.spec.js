import { Factory } from '../lib/factory.js'

describe('Factory interface', function () {
  beforeEach(function () {
    this.factory = new Factory()
  })

  it('has an abstract extract method', function () {
    try {
      this.factory.extract('factoryMethod')
    } catch (error) {
      expect(error).toBeTruthy()
    }
  })
})
