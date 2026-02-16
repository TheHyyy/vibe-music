import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import { MotionPlugin } from "@vueuse/motion";

const app = createApp(App);

app.use(router);
app.use(ElementPlus);
app.use(MotionPlugin);

app.mount("#app");
