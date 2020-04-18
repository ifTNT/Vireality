import * as THREE from "three";
import Geolocator from "./geolocator.js";

export default class GeolocationARControls {
  constructor(_camera) {
    this.camera = _camera;
    this.options = { frequency: 60, referenceFrame: "device" };
    this.sensor = new AbsoluteOrientationSensor(this.options);
    this.sensor.addEventListener(
      "reading",
      this.handleSensorReading.bind(this)
    );
    this.sensor.addEventListener("error", this.handleSensorError.bind(this));
    // Place to store quaternion
    // Default value is rotate 90degree along x-axis.
    this.quaternion = new THREE.Quaternion(
      1 * Math.sin(Math.PI / 2 / 2),
      0,
      0,
      Math.cos(Math.PI / 2 / 2)
    );
    this.sensor.start();

    //Use geolocator to relocate camera
    this.geolocator = new Geolocator();
    this.geolocator.watchPosition(this.handleGeolocationUpdate.bind(this));
    this.currentPosition = {
      x: 0,
      y: 0
    };
    this.newPosition = {
      x: 0,
      y: 0
    };
    this.isLocationFixed = false;
  }
  handleSensorReading() {
    this.quaternion.fromArray(this.sensor.quaternion);
  }
  handleSensorError() {
    if (event.error.name == "NotReadableError") {
      console.log("[GeoAR control]Sensor is not available.");
    } else {
      console.log(`[GeoAR control]${event.error.name}`);
    }
  }
  handleGeolocationUpdate(pos) {
    let { x, y } = pos;
    if (this.isLocationFixed === false) {
      this.currentPosition.x = x;
      this.currentPosition.y = y;
      this.isLocationFixed = true;
    }
    this.newPosition.x = x;
    this.newPosition.y = y;
  }
  update() {
    this.camera.quaternion.copy(this.quaternion);

    //Update position: exponential filter
    let alpha = 0.5; //How new value will be taken
    this.currentPosition.x =
      (1 - alpha) * this.currentPosition.x + alpha * this.newPosition.x;
    this.currentPosition.y =
      (1 - alpha) * this.currentPosition.y + alpha * this.newPosition.y;
    this.camera.position.x = this.currentPosition.x;
    this.camera.position.y = this.currentPosition.y;
  }
}
