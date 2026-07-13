import whatsappConfigFromScript from "../src/config/whatsappConfig.js";
import * as whatsappService from "../src/services/whatsappService.js";
import whatsappConfigFromService from "../src/config/whatsappConfig.js";

console.log("Config from script:", whatsappConfigFromScript);
console.log("Config from service file (direct import):", whatsappConfigFromService);
console.log("Are they the same object reference?", whatsappConfigFromScript === whatsappConfigFromService);

whatsappConfigFromScript.accessToken = "MODIFIED_TOKEN_VALUE";
console.log("Modified token in script config. New value in service config:", whatsappConfigFromService.accessToken);
