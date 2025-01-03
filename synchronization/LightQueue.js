class LightQueue {
  constructor(onEndTask) {
    this.onEndTask = onEndTask;
    this.queue = [];
    this.isProcessing = false;
  }

  add(task) {
    this.queue.push(task);
    if (!this.isProcessing) {
      this.process();
    }
  }

  async process() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const { task, data } = this.queue.shift();
    try {
      await task();
      await this.onEndTask(data, false);
    } catch (err) {
      console.error("Error processing task:", err);
      await this.onEndTask(data, true);
    }

    setImmediate(() => this.process());
  }
}

module.exports = LightQueue;
