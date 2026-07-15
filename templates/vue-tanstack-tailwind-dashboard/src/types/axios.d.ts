import "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    /** 出错时不弹出全局错误提示，由调用方自行处理。 */
    hiddenError?: boolean;
  }
}
