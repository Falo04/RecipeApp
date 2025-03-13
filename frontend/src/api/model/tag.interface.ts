import type { Page } from "./global.interface";

export interface SimpleTag {
  uuid: string;
  name: string;
}

export interface TagPageRequest {
  page: Page<SimpleTag>;
}

export interface CreateOrUpdateTag {
  name: string;
}
