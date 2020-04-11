import Absolute2DSpeedSensor from "./absolute_2d_speed_sensor.js";
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
      variance: NaN,
      timestamp: NaN
    };
    this.speedFromGPS = { x: 0, y: 0 };
    this.ready = false; //Whether the currentPosition is valid
    this.debug = false; //Flag for debugging
  }

  watchPosition(callback) {
    this.posUpdateCB = callback;
  }
  
  watchDebug(callback) {
    this.debug = true;
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

  // The Kalman Filter to reduce the error of raw GPS data.
  // Measurement: GPS
  // Estimation: Accelerometer
  _updateCurrentPositionKalman(pos) {
    
    // The standard deviation of this mesurement
    // Accuracy is a confidence interval with 95% confidence level
    // i.e. accuracy = 4*(Standard Deviation)
    let measure_sd = pos.coords.accuracy / 4;
    let measure_var = measure_sd*measure_sd;
    
    //Read previous estimatation
    let {
      timestamp,
      latitude,
      longitude,
      variance,
      x,
      y
    } = this.currentPosition;
    
    let measurePos = this._convertGeolocation(pos.coords);
    measurePos.var = measure_var;
    let estimatePos = {x: measurePos.x, y: measurePos.y};
    
    if (this.ready === false) {
      // If object is unitialised,initialise with current values
      timestamp = pos.timestamp;
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
      variance = measure_var;
      x = measurePos.x;
      y = measurePos.y;
      this.ready = true;
    } else {
      // else apply Kalman filter methodology
      
      // Get the position estimation from accelerometer
      let relativePosEstimation = this.speedSensor.readPosition();
      estimatePos = {
        x: x + relativePosEstimation.x,
        y: y + relativePosEstimation.y,
      };
      
      let diff_time = pos.timestamp - timestamp;
      let estimate_var = variance;
      if (diff_time > 0) {
        // time has moved on, so the uncertainty in the current position increases
        let estimate_sd = relativePosEstimation.accuracy;
        estimate_var += diff_time * estimate_sd * estimate_sd;
        timestamp = pos.timestamp;
      }
      estimatePos.var = estimate_var;

      // Correct the speed estimation of accelerometer with measured value.
      // Heading is the direction of movement in degree and clockwise.
      // 0deg means toward north.
      // 450deg-heading to convert it into normalized plane.(east->x+, north->y+)
      if (pos.coords.speed !== null && pos.coords.heading !== null) {
        this.speedFromGPS = {
          x:
            pos.coords.speed *
            Math.cos(Math.PI*5/2 - this.radians(pos.coords.heading)),
          y:
            pos.coords.speed *
            Math.sin(Math.PI*5/2 - this.radians(pos.coords.heading)-Math.PI/2)
        };
      }
      this.speedSensor.reset(this.speedFromGPS);

      // Kalman gain matrix K = Covarariance * Inverse(Covariance + MeasurementVariance)
      // NB: because K is dimensionless, it doesn't matter that variance has different units to lat and lng
      var K = estimate_var / (estimate_var + measure_var);
      // apply K
      x += K * (measurePos.x - estimatePos.x);
      y += K * (measurePos.y - estimatePos.y);
      // new Covarariance  matrix is (IdentityMatrix - K) * Covarariance
      variance = (1 - K) * estimate_var;
    }
    //Write back estimation
    this.currentPosition = {
      x,
      y,
      latitude,
      longitude,
      variance,
      timestamp
    };

    let accuracy = Math.sqrt(variance);
    if(!this.debug){
      this.posUpdateCB({ x, y, accuracy });
    }else{
      this.posUpdateCB({ x, y, accuracy, estimatePos, measurePos, K });
    }
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
    let baseLatitude = this.radians(23.5);

    //Degree to radians
    longitude = this.radians(longitude);
    latitude = this.radians(latitude);

    //For small area, euqalrectangular projection is fine.
    //North -> y+
    //East -> x+
    let x = r * longitude * Math.cos(baseLatitude) * scaleFactor;
    let y = r * (latitude-baseLatitude) * scaleFactor;

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
