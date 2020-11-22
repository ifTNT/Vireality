// This script is the entry point of vireality.
// Seperated bootloader to dynamic-load truely main function
// can help PWA get rid of default splash-screen quickly.

import("./main").then(({ init }) => {
  console.log("[Bootloader] Main loaded");
  init();
});
