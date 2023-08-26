// Base Factory Class
export class Factory {
  /** @param {Object} config */
  constructor (config = {}) {
    this.config = config
    this.allowed = []
    this.lazy = []
  }

  /** @param {string} method @return {function} */
  extract (method) {
    return this[`${method}`]
  }
}
