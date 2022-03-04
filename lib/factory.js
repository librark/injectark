// Base Factory Interface
export class Factory {
  /** @param {Object} config */
  constructor(config = {}) {
    this.config = config
  }

  /** @param {string} method @return {function} */
  extract (method) {
    return this[`${method}`]
  }
}
