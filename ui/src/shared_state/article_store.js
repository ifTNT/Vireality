//TODO: Share object or event bus or vuex
import axios from "axios";
import Geolocator from "../lib/geolocator";
let geolocator = new Geolocator();
let state = {
  articles: [],
  lon: 0,
  lat: 0
};

// geolocator.watchPosition(function(position) {
//   lat = position.latitude;
//   lon = position.longitude;
//   axios
//     .get(
//       server.apiUrl(
//         "/geolocation" +
//           `?lon=${this.lon}` +
//           `&lat=${this.lat}` +
//           `&date=${this.date}`
//       )
//     )
//     .then(response => {
//       if (response.ok) {
//         artices = response.result;
//       } else {
//         throw "Get geo-articls failed";
//       }
//     })
//     .catch(error => {
//       console.log("[Article Fetch]" + error);
//     });
// });

export default state;
