import { client } from "./gen/client.gen";
import { Sdk } from "./gen/sdk.gen";
// import { registerInterceptors } from "./interceptors";

// registerInterceptors();

export { client };
export const api = new Sdk({ client });
