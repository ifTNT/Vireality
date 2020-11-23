// This script is the entry point of vireality.
// Seperated bootloader to dynamic-load truely main function
// can help PWA get rid of default splash-screen quickly.

import(
  /* webpackChunkName: "app" */
  "./main"
).then(({ init }) => {
  console.re.log("[Bootloader] Main loaded");
  init();
});
