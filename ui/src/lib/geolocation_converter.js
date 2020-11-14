function convertGeolocation(coords) {
  let { longitude, latitude } = coords;

  let r = 6371000; //Radius of earth (m);
  let scaleFactor = 1;
  let baseLatitude = radians(23.5);

  //Degree to radians
  longitude = radians(longitude);
  latitude = radians(latitude);

  //For small area, euqalrectangular projection is fine.
  //North -> y+
  //East -> x+
  let x = r * longitude * Math.cos(baseLatitude) * scaleFactor;
  let y = r * (latitude - baseLatitude) * scaleFactor;

  // [To be Test] Rotate -90deg?
  //let tmp = x;
  //x = y;
  //y = -tmp;

  return { x, y };
}
function convertGeolocationTWD97(coords) {
  //Reference: http://blog.ez2learn.com/2009/08/15/lat-lon-to-twd97/
  let { longitude, latitude } = coords;

  //Convert to radians
  const lon = radians(longitude);
  const lat = radians(latitude);

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
    (1 - Math.tan(lat) * Math.tan(lat) + e2 * (Math.cos(lat) * Math.cos(lat)));

  let x = K4 * p + K5 * (p * p * p) + dx;

  x = x * scaleFactor;
  y = y * scaleFactor;

  return { x, y };
}

function radians(deg) {
  return (deg * Math.PI) / 180;
}

export { convertGeolocation, convertGeolocationTWD97 };
export default convertGeolocation;
