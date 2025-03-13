import type { Page } from "./global.interface"

export interface SimpleUser {
  uuid: string;
  email: string;
  display_name: string;
}

export interface PageResultUser {
  page: Page<SimpleUser>;
}
