// Base Factory Interface
export class Factory {
  /** @param {string} method @return {function} */
  extract (method) {
    return this[`${method}`].bind(this)
  }
}
