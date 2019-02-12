// Base Factory Interface
export class Factory {
  /** @param {string} method @return {function} */
  extract (method) {
    throw new Error('Not implemented.')
  }
}
