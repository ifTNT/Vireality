import * as THREE from "./lib/js/three.module.js";
export default class AbsoluteOrientationControls {
  constructor(_camera) {
    this.camera = _camera;
    this.options = { frequency: 60, referenceFrame: "device" };
    this.sensor = new AbsoluteOrientationSensor(this.options);
    this.sensor.addEventListener(
      "reading",
      this.handleSensorReading.bind(this)
    );
    this.sensor.addEventListener("error", this.handleSensorError.bind(this));
    //Place to store quaternion
    this.quaternion = new THREE.Quaternion();
    this.sensor.start();
  }
  handleSensorReading() {
    this.quaternion.fromArray(this.sensor.quaternion);
  }
  handleSensorError() {
    if (event.error.name == "NotReadableError") {
      console.log("[Absolute orientation control]Sensor is not available.");
    } else {
      console.log(`[Absolute orientation control]${event.error.name}`);
    }
  }
  update() {
    this.camera.quaternion.copy(this.quaternion);
  }
}
