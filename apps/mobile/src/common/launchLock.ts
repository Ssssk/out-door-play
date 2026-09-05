class LaunchLock {
  private readyPromise: Promise<boolean>
  private resolveReady!: (value: boolean) => void
  private unlocked = false

  constructor() {
    this.readyPromise = new Promise((resolve) => { this.resolveReady = resolve })
  }

  unlock() {
    if (this.unlocked) return
    this.unlocked = true
    this.resolveReady(true)
  }

  waitReady() { return this.unlocked ? Promise.resolve(true) : this.readyPromise }
}

export const launchLock = new LaunchLock()
