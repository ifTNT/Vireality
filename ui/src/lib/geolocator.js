import Absolute2DSpeedSensor from "./absolute_2d_speed_sensor.js";
import {
  convertGeolocation,
  convertGeolocationTWD97
} from "./geolocation_converter.js";

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
    // If variance of accelerometer is too large,
    // switch to estimate via constant speed
    const untrustThreshold = 100;
    const estimateSpeed = 3; // m/s

    // The standard deviation of this mesurement
    // Accuracy is a confidence interval with 95% confidence level
    // i.e. accuracy = 4*(Standard Deviation)
    let measure_sd = pos.coords.accuracy / 4;
    let measure_var = measure_sd * measure_sd;

    //Read previous estimatation
    let {
      timestamp,
      latitude,
      longitude,
      variance,
      x,
      y
    } = this.currentPosition;

    let measurePos = convertGeolocation(pos.coords);
    measurePos.var = measure_var;
    let estimatePos = { x: measurePos.x, y: measurePos.y, var: measurePos.var };

    //Kalman Gain
    let K = NaN;

    if (this.ready === false) {
      // If object is unitialized,initialize with current values
      timestamp = pos.timestamp;
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
      variance = measure_var;
      x = measurePos.x;
      y = measurePos.y;
      this.ready = true;
    } else {
      // else apply Kalman filter methodology

      // update the longitude and latitude
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;

      // Get the position estimation from accelerometer
      let relativePosEstimation = this.speedSensor.readPosition();
      estimatePos = {
        x: x + relativePosEstimation.x,
        y: y + relativePosEstimation.y
      };

      let diff_time = (pos.timestamp - timestamp) / 1000;
      let estimate_var = variance;
      if (diff_time > 0) {
        // time has moved on, so the uncertainty in the current position increases
        let estimate_sd = relativePosEstimation.accuracy;
        if (
          estimate_var + diff_time * diff_time * estimate_sd * estimate_sd <=
          untrustThreshold
        ) {
          estimate_var += estimate_sd * estimate_sd;
        } else {
          // Switch to use constant speed estimation
          estimate_var += diff_time * estimateSpeed * estimateSpeed;
          // Restore previous estimation
          estimatePos = { x, y };
        }
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
            Math.cos((Math.PI * 5) / 2 - this.radians(pos.coords.heading)),
          y:
            pos.coords.speed *
            Math.sin(
              (Math.PI * 5) / 2 - this.radians(pos.coords.heading) - Math.PI / 2
            )
        };

        //If nearly static, set speed to 0.
        let staticThreshold = 0.8;
        if (
          this.speedFromGPS.x * this.speedFromGPS.x +
            this.speedFromGPS.y * this.speedFromGPS.y <=
          staticThreshold * staticThreshold
        ) {
          this.speedFromGPS.x = 0;
          this.speedFromGPS.y = 0;
        }
      }
      this.speedSensor.reset(this.speedFromGPS);

      // Kalman gain matrix K = Covarariance * Inverse(Covariance + MeasurementVariance)
      // NB: because K is dimensionless, it doesn't matter that variance has different units to lat and lng
      K = estimate_var / (estimate_var + measure_var);
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
    if (!this.debug) {
      this.posUpdateCB({ x, y, latitude, longitude, accuracy, timestamp });
    } else {
      this.posUpdateCB({
        x,
        y,
        accuracy,
        timestamp,
        estimatePos,
        measurePos,
        K
      });
    }
  }

  _handleError(err) {
    console.log(`[Geolocator] ${err.code} ${err.message}`);
  }

  detatch() {
    navigator.geolocation.clearWatch(this.watchID);
  }

  radians(deg) {
    return (deg * Math.PI) / 180;
  }
}
