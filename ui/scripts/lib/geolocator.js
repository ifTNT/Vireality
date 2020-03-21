import Absolute2DSpeedSensor from "./absolute2DSpeedSensor.js";
export default class Geolocator {
  constructor() {
    this.speedSensor = new Absolute2DSpeedSensor();
    this.geo_options = {
      enableHighAccuracy: true,
      maximumAge: 30000,
      timeout: 27000
    };
    this.watchID = navigator.geolocation.watchPosition(
      this._updateCurrentPositionKalman.bind(this),
      this._handleError.bind(this),
      this.geo_options
    );
    this.posUpdateCB = () => {}; //Callback that called when position update
    this.currentPosition = {
      //The object to store estamated position
      x: NaN,
      y: NaN,
      longitude: NaN,
      latitude: NaN,
      accuracy: NaN,
      variance: NaN,
      timestamp: NaN
    };
    this.speedFromGPS = { x: 0, y: 0 };
    this.ready = false; //Whether the currentPosition is valid
  }

  watchPosition(callback) {
    this.posUpdateCB = callback;
  }

  getPosition(callback) {
    if (this.ready === false) {
      navigator.geolocation.getCurrentPosition(
        function(pos) {
          this._updateCurrentPositionKalman(pos);
          let { x, y, accuracy } = this.currentPosition;
          callback({ x, y, accuracy });
        }.bind(this),
        this._handleError.bind(this),
        this.geo_options
      );
    } else {
      let { x, y, accuracy } = this.currentPosition;
      callback({ x, y, accuracy });
    }
  }

  // _updateCurrentPosition(pos) {
  //   var alpha = 0; //The adaptive value to trust new value
  //   if (this.ready === false) {
  //     let { x, y } = this._convertGeolocationTWD97(pos.coords);
  //     this.currentPosition = {
  //       x,
  //       y,
  //       longitude: pos.coords.longitude,
  //       latitude: pos.coords.latitude,
  //       accuracy: pos.coords.accuracy
  //     };
  //     this.ready = true;
  //   } else {
  //     //Adaptive exponential smoothing
  //     const minAccuracy = 1; //The minimal accuracy value
  //     const maxAccuracy = 30; //The maximal accuracy value
  //     const maxAlpha = 0.8; //Trust 80% old value at most
  //     if (pos.coords.accuracy < minAccuracy) {
  //       alpha = 0; //Trust new value
  //     } else if (pos.coords.accuracy > maxAccuracy) {
  //       alpha = maxAlpha; //Trust 80% old value, 20% new value
  //     } else {
  //       //Linear value
  //       alpha =
  //         ((pos.coords.accuracy - minAccuracy) / (maxAccuracy - minAccuracy)) *
  //         maxAlpha;
  //     }
  //     let { x, y } = this._convertGeolocationTWD97(pos.coords);
  //     pos.coords["x"] = x;
  //     pos.coords["y"] = y;
  //     for (let i in this.currentPosition) {
  //       let oldValue = this.currentPosition[i];
  //       let newValue = pos.coords[i];
  //       this.currentPosition[i] = oldValue * alpha + newValue * (1 - alpha);
  //     }
  //   }
  //   let { x, y, accuracy } = this.currentPosition;
  //   this.posUpdateCB({ x, y, accuracy });
  // }

  _updateCurrentPositionKalman(pos) {
    const minAccuracy = 1;
    //let Q_metres_per_second = this.speedSensor.readSpeed().norm; //Adjuest this value by speed
    //let Q_metres_per_second = 10; //Adjuest this value by speed
    let accuracy = pos.coords.accuracy; //The uncertainty of this mesurement
    //Read previous estimatation
    let {
      timestamp,
      //latitude,
      //longitude,
      variance,
      x,
      y
    } = this.currentPosition;
    let xy_measure = this._convertGeolocation(pos.coords);
    if (accuracy < minAccuracy) {
      //Cut off the accuracy
      accuracy = minAccuracy;
    }
    if (this.ready === false) {
      // If object is unitialised,initialise with current values
      timestamp = pos.timestamp;
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
      variance = accuracy * accuracy;
      x = xy_measure.x;
      y = xy_measure.y;
      this.ready = true;
    } else {
      // else apply Kalman filter methodology
      let diff_time = pos.timestamp - timestamp;
      if (diff_time > 0) {
        // time has moved on, so the uncertainty in the current position increases
        let sensorPosAccuracy = this.speedSensor.readPosition().accuracy;
        variance += sensorPosAccuracy * sensorPosAccuracy;
        //  (diff_time * Q_metres_per_second * Q_metres_per_second) / 1000;
        timestamp = pos.timestamp;
      }
      //TODO: Use covararience instead of varaience

      let posBySensor = this.speedSensor.readPosition();
      if (pos.coords.speed !== null && pos.coords.heading !== null) {
        this.speedFromGPS = {
          x:
            pos.coords.speed *
            Math.cos(this.radians(pos.coords.heading) + Math.PI / 2),
          y:
            pos.coords.speed *
            Math.sin(this.radians(pos.coords.heading) + Math.PI / 2)
        };
      }
      this.speedSensor.reset(this.speedFromGPS);

      // Kalman gain matrix K = Covarariance * Inverse(Covariance + MeasurementVariance)
      // NB: because K is dimensionless, it doesn't matter that variance has different units to lat and lng
      let K = variance / (variance + accuracy * accuracy);
      // apply K
      //longitude += K * (pos.coords.longitude - longitude);
      //latitude += K * (pos.coords.latitude - latitude);
      let xy_estimate = {
        x: x + posBySensor.x,
        y: y + posBySensor.y
      };
      x += K * (xy_measure.x - xy_estimate.x);
      y += K * (xy_measure.y - xy_estimate.y);
      // new Covarariance  matrix is (IdentityMatrix - K) * Covarariance
      variance = (1 - K) * variance;
      //let estimate_xy = this._convertGeolocationTWD97({ longitude, latitude });
      //x = estimate_xy.x;
      //y = estimate_xy.y;
    }
    //Write back estimation
    accuracy = Math.sqrt(variance);
    this.currentPosition = {
      x,
      y,
      latitude,
      longitude,
      accuracy,
      variance,
      timestamp
    };
    this.posUpdateCB({ x, y, accuracy });
  }

  _handleError(err) {
    console.log(`[Geolocator] ${err.code} ${err.message}`);
  }

  detatch() {
    navigator.geolocation.clearWatch(this.watchID);
  }

  _convertGeolocation(coords) {
    let { longitude, latitude } = coords;

    let r = 6371000; //Radius of earth (m);
    let scaleFactor = 1;
    let baseLatitude = 23.5;

    //Degree to radians
    longitude = this.radians(longitude);
    latitude = this.radians(latitude);

    //For small area, euqalrectangular projection is fine.
    let y = -r * longitude * Math.cos(baseLatitude) * scaleFactor;
    let x = r * latitude * scaleFactor;

    return { x, y };
  }
  _convertGeolocationTWD97(coords) {
    //Reference: http://blog.ez2learn.com/2009/08/15/lat-lon-to-twd97/
    let { longitude, latitude } = coords;

    //Convert to radians
    const lon = this.radians(longitude);
    const lat = this.radians(latitude);

    //Some constant
    const a = 6378137.0;
    const b = 6356752.314245;
    const long0 = this.radians(121); //Centeral longitude
    const k0 = 0.9999;
    const dx = 250000;

    const scaleFactor = 1;

    //Magic
    let e = Math.sqrt(1 - (b * b) / (a * a));
    let e2 = (e * e) / (1 - e * e);
    let n = (a - b) / (a + b);
    let nu = a / Math.sqrt(1 - e * e * (Math.sin(lat) * Math.sin(lat)));
    let p = lon - long0;

    let A =
      a *
      (1 -
        n +
        (5 / 4.0) * (n * n - n * n * n) +
        (81 / 64.0) * (n * n * n * n - n * n * n * n * n));
    let B =
      ((3 * a * n) / 2.0) *
      (1 -
        n +
        (7 / 8.0) * (n * n - n * n * n) +
        (55 / 64.0) * (n * n * n * n - n * n * n * n * n));
    let C =
      ((15 * a * (n * n)) / 16.0) * (1 - n + (3 / 4.0) * (n * n - n * n * n));
    let D =
      ((35 * a * (n * n * n)) / 48.0) *
      (1 - n + (11 / 16.0) * (n * n - n * n * n));
    let E = ((315 * a * (n * n * n * n)) / 51.0) * (1 - n);

    let S =
      A * lat -
      B * Math.sin(2 * lat) +
      C * Math.sin(4 * lat) -
      D * Math.sin(6 * lat) +
      E * Math.sin(8 * lat);

    let K1 = S * k0;
    let K2 = (k0 * nu * Math.sin(2 * lat)) / 4.0;
    let K3 =
      ((k0 * nu * Math.sin(lat) * Math.pow(Math.cos(lat), 3)) / 24.0) *
      (5 -
        Math.tan(lat) * Math.tan(lat) +
        9 * e2 * (Math.cos(lat) * Math.cos(lat)) +
        4 * (e2 * e2) * Math.pow(Math.cos(lat), 4));

    let y = K1 + K2 * (p * p) + K3 * (p * p * p * p);

    let K4 = k0 * nu * Math.cos(lat);
    let K5 =
      ((k0 * nu * Math.pow(Math.cos(lat), 3)) / 6.0) *
      (1 -
        Math.tan(lat) * Math.tan(lat) +
        e2 * (Math.cos(lat) * Math.cos(lat)));

    let x = K4 * p + K5 * (p * p * p) + dx;

    x = x * scaleFactor;
    y = y * scaleFactor;

    return { x, y };
  }
  radians(deg) {
    return (deg * Math.PI) / 180;
  }
}
