const axios = require("axios");
const API_KEY = "1123sx";
const HttpError = require("../models/http-error");
async function getCoordsforAddress(address) {
  return {
    lat: 40.333,
    lng: -73.334,
  };

  //   const { data } =
  //     await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
  //       address
  //     )}&key=${API_KEY}
  // `);

  //   if (!data || data.status == "ZERO_RESULTS") {
  //     const error = new HttpError(
  //       " could not find location for the specified",
  //       422
  //     );
  //     throw error;
  //   }
  //   const coordinates = data.results[0].geometry.location;

  //   return coordinates;
}
module.exports = getCoordsforAddress;
