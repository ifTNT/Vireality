export default class MovingAverage2D {
  constructor(_size) {
    this.windowSize = _size;
    this.queue = new Array();
  }
  push(_p) {
    let p = {
      x: _p.x,
      y: _p.y
    };
    if (this.queue.length < this.windowSize) {
      this.queue.push(p);
    } else {
      this.queue.shift();
      this.queue.push(p);
    }
  }
  getAvg() {
    if (this.queue.length === 0) throw "Lenght of queue is zero";
    var n = this.queue.length;
    return this.queue.reduce(
      function(acc, p) {
        acc["x"] += p.x / n;
        acc["y"] += p.y / n;
        return acc;
      },
      { x: 0, y: 0 }
    );
  }
  getVar() {
    if (this.queue.length === 0) throw "Lenght of queue is zero";
    let n = this.queue.length;
    let x_square = this.queue.reduce((acc, p) => {
      return acc + p.x * p.x;
    }, 0);
    let avg = this.getAvg();
    return x_square / n - avg.x * avg.x;
  }
  getLast() {
    if (this.queue.length === 0) throw "Lenght of queue is zero";
    return this.queue[this.queue.length - 1];
  }
  len() {
    return this.queue.length;
  }
  flush(){
    this.queue = [];
  }
  _norm(p) {
    return Math.sqrt(p.x * p.x + p.y * p.y);
  }
}
