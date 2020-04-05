/*
    This file contains server related settings used by front end
*/

module.exports = {
  apiUrl: function(path) {
    let serverLocation = "http://localhost:3000";
    if (path.substring(0, 1) === "/") {
      //Endpoints must begin with '/'
      return serverLocation + path;
    } else {
      console.log(`Invalid server API endpoint: ${path}`);
      return "";
    }
  }
};
