import type { InjectionKey, Ref } from "vue";

export const FORM_ITEM_INJECTION_KEY = Symbol() as InjectionKey<string>;

/** 当前 FormItem 是否为 inline（label 与控件同行）布局。 */
export const FORM_ITEM_INLINE_INJECTION_KEY = Symbol() as InjectionKey<Ref<boolean>>;
