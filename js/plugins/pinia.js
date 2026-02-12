import { createPinia } from "pinia";
import { DomainUtils } from "@/domains/utils";
const piniaConfig = {
    pinia: createPinia()
};
export default piniaConfig;
DomainUtils.log("PLUGINS pinia");
