// Base Factory Interface
export class Factory {
  /** @param {Object} config */
  constructor (config = {}) {
    this.config = config
    this.allowed = []
  }

  /** @param {string} method @return {function} */
  extract (method) {
    return this[`${method}`]
  }
}
