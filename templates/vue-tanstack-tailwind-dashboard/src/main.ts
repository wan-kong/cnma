import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import { PiniaColada } from "@pinia/colada";

import App from "./App.vue";
import { router } from "./router/index";
const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(PiniaColada, {
  plugins: [],
});
app.use(router);

// 等待路由首次导航（含登录拦截）完成后再挂载，避免先闪现首页再跳转登录页。
void router.isReady().then(() => {
  app.mount("#app");
});
