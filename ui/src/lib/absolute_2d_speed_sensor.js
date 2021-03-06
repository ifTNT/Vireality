import MovingAverage2D from "./moving_average_2d.js";

export default class Absolute2DSpeedSensor {
  constructor() {
    this.laSensor = new LinearAccelerationSensor({ frequency: 60 });
    this.oriSensor = new AbsoluteOrientationSensor({
      frequency: 60,
      referenceFrame: "device"
    });

    this.windowSize = 32; //How many samples in one window
    this.offsetWindowSize = 10 * this.windowSize; //How many samples in one offset window
    this.laSensor.addEventListener("reading", this.onReading.bind(this));
    this.oriSensor.addEventListener("reading", this.onOriReading.bind(this));
    this.ori = [0, 0, 0, 0];

    //this.speed = new MovingAverage2D(this.windowSize);
    //this.pos = new MovingAverage2D(this.windowSize);
    this.speed = { x: 0, y: 0 };
    this.lastSpeed = { x: 0, y: 0 };
    this.pos = { x: 0, y: 0 };
    this.lastPos = { x: 0, y: 0 };
    this.lastAccel = { x: 0, y: 0 };
    this.accelOffset = new MovingAverage2D(this.offsetWindowSize);
    this.accel = new MovingAverage2D(this.windowSize);

    this.lastSensorTimeStamp = -1;
    this.totalTime = 0; //Duration between last reset
    this.laSensor.start();
    this.oriSensor.start();
  }
  onReading(e) {
    function integral(p, p1, p2, dt) {
      return {
        x: p.x + ((p1.x + p2.x) / 2) * dt,
        y: p.y + ((p1.y + p2.y) / 2) * dt
      };
    }
    let newAccel = this.correctAccel(this.laSensor, this.ori);

    if (this.lastSensorTimeStamp === -1) {
      this.lastSensorTimeStamp = this.laSensor.timestamp;
      this.lastAccel = newAccel;
    }
    let dt = (this.laSensor.timestamp - this.lastSensorTimeStamp) / 1000;
    this.totalTime += dt;
    this.accel.push(newAccel);
    this.accelOffset.push(newAccel);
    if (this.accel.len() === this.windowSize) {
      newAccel = this.accel.getAvg(); //Low-pass filter
      let offset = this.accelOffset.getAvg(); //Get the DC offset
      newAccel.x -= offset.x;
      newAccel.y -= offset.y;

      //Integrate speed
      this.lastSpeed = this.speed;
      this.speed = integral(this.lastSpeed, this.lastAccel, newAccel, dt);
      //this.speed.push(newSpeed);

      //Integrate position
      this.lastPos = this.pos;
      this.pos = integral(this.lastPos, this.lastSpeed, this.speed, dt);
      //this.pos.push(newPos);

      //Update the state
      this.lastAccel = newAccel;
      this.lastSensorTimeStamp = this.laSensor.timestamp;
    }

    // //Reset condition
    // const threshold_a = 0.07; // minimal acceleration
    // if (
    //   Math.sqrt(accel.x * accel.x + accel.y * accel.y) <
    //   threshold_a
    // ) {
    //   accel.x = 0;
    //   accel.y = 0;
    //   this.speed.x = 0;
    //   this.speed.y = 0;
    //   this.pos.x = 0;
    //   this.pos.y = 0;
    // }
    // if (this.lastSensorTimeStamp === -1) {
    //   this.lastSensorTimeStamp = this.laSensor.timestamp;
    //   this.lastAccel.x = accel.x;
    //   this.lastAccel.y = accel.y;
    // } else {
    //   const timeDiff =
    //     (this.laSensor.timestamp - this.lastSensorTimeStamp) / 1000;
    //   //Integral speed
    //   let lastSpeed = Object.assign({}, this.speed);
    //   this.speed.x += ((this.lastAccel.x + accel.x) / 2) * timeDiff;
    //   this.speed.y += ((this.lastAccel.y + accel.y) / 2) * timeDiff;

    //   //Integral position
    //   this.pos.x += ((lastSpeed.x + this.speed.x) / 2) * timeDiff;
    //   this.pos.y += ((lastSpeed.y + this.speed.y) / 2) * timeDiff;

    //   this.lastAccel = accel;
    //   const accuracyFactor = 20; //Expermental value on Google Pixel 2
    //   this.accuracy += timeDiff / accuracyFactor;
    //   this.lastSensorTimeStamp = this.laSensor.timestamp;
    //}
  }
  onOriReading() {
    this.ori = this.oriSensor.quaternion;
  }
  readSpeed() {
    let { x, y } = this.speed;
    let accuracy = Math.sqrt(this.totalTime * this.accel.getVar());
    return {
      x,
      y,
      accuracy,
      norm: Math.sqrt(x * x + y * y),
      timestamp: this.lastSensorTimeStamp
    };
  }
  readAccel() {
    let { x, y } = this.accel.getAvg();
    let offset = this.accelOffset.getAvg();
    // alert(JSON.stringify(this.accel.getAvg()));
    // alert(this.accel.getCov());
    let accuracy = Math.sqrt(this.accel.getVar());
    return {
      x: x - offset.x,
      y: y - offset.y,
      accuracy
    };
  }
  readPosition() {
    let { x, y } = this.pos;
    let accuracy = Math.sqrt(
      this.totalTime * this.totalTime * this.accel.getVar()
    );
    return {
      x,
      y,
      accuracy
    };
  }
  reset(_speed) {
    this.speed = _speed;
    this.lastSpeed = _speed;
    this.pos = { x: 0, y: 0 };
    this.lastPos = { x: 0, y: 0 };
    this.totalTime = 0;
  }

  // Correct acceleration to absolute coordinate
  correctAccel(_accel, quaternion) {
    let accel = {
      x: _accel.x,
      y: _accel.y,
      z: _accel.z
    };

    // ============================================
    // |Correct acceleration by device orientation|
    // ============================================
    let qx = quaternion[0];
    let qy = quaternion[1];
    let qz = quaternion[2];
    let qw = quaternion[3];

    // accel = q*accel*(q^-1)

    let ix = qw * accel.x + qy * accel.z - qz * accel.y;
    let iy = qw * accel.y + qz * accel.x - qx * accel.z;
    let iz = qw * accel.z + qx * accel.y - qy * accel.x;
    let iw = -qx * accel.x - qy * accel.y - qz * accel.z;

    accel.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    accel.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    accel.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

    return accel;
  }
}
