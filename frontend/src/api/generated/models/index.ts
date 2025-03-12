/* tslint:disable */
/* eslint-disable */
/**
 * The response that is sent in a case of an error
 * @export
 * @interface ApiErrorResponse
 */
export interface ApiErrorResponse {
    /**
     * A human-readable error message.
     * 
     * May be used for displaying purposes
     * @type {string}
     * @memberof ApiErrorResponse
     */
    message: string;
    /**
     * 
     * @type {ApiStatusCode}
     * @memberof ApiErrorResponse
     */
    status_code: ApiStatusCode;
}



/**
 * The Status code that are returned throughout the API
 * @export
 */
export const ApiStatusCode = {
    NUMBER_1000: 1000,
    NUMBER_1001: 1001,
    NUMBER_1002: 1002,
    NUMBER_2000: 2000
} as const;
export type ApiStatusCode = typeof ApiStatusCode[keyof typeof ApiStatusCode];

/**
 * 
 * @export
 * @interface CreateOrUpdateTag
 */
export interface CreateOrUpdateTag {
    /**
     * 
     * @type {string}
     * @memberof CreateOrUpdateTag
     */
    name: string;
}
/**
 * 
 * @export
 * @interface CreateRecipeRequest
 */
export interface CreateRecipeRequest {
    /**
     * 
     * @type {string}
     * @memberof CreateRecipeRequest
     */
    description: string;
    /**
     * 
     * @type {Array<Ingredients>}
     * @memberof CreateRecipeRequest
     */
    ingredients: Array<Ingredients>;
    /**
     * 
     * @type {string}
     * @memberof CreateRecipeRequest
     */
    name: string;
    /**
     * 
     * @type {Array<Steps>}
     * @memberof CreateRecipeRequest
     */
    steps: Array<Steps>;
    /**
     * 
     * @type {Array<string>}
     * @memberof CreateRecipeRequest
     */
    tags: Array<string>;
    /**
     * 
     * @type {string}
     * @memberof CreateRecipeRequest
     */
    user: string;
}
/**
 * 
 * @export
 * @interface FullRecipe
 */
export interface FullRecipe {
    /**
     * 
     * @type {string}
     * @memberof FullRecipe
     */
    description: string;
    /**
     * 
     * @type {Array<Ingredients>}
     * @memberof FullRecipe
     */
    ingredients: Array<Ingredients>;
    /**
     * 
     * @type {string}
     * @memberof FullRecipe
     */
    name: string;
    /**
     * 
     * @type {Array<Steps>}
     * @memberof FullRecipe
     */
    steps: Array<Steps>;
    /**
     * 
     * @type {Array<SimpleTag>}
     * @memberof FullRecipe
     */
    tags: Array<SimpleTag>;
    /**
     * 
     * @type {SimpleUser}
     * @memberof FullRecipe
     */
    user: SimpleUser;
    /**
     * 
     * @type {string}
     * @memberof FullRecipe
     */
    uuid: string;
}
/**
 * 
 * @export
 * @interface Ingredients
 */
export interface Ingredients {
    /**
     * 
     * @type {number}
     * @memberof Ingredients
     */
    amount: number;
    /**
     * 
     * @type {string}
     * @memberof Ingredients
     */
    name: string;
    /**
     * 
     * @type {Units}
     * @memberof Ingredients
     */
    unit: Units;
    /**
     * 
     * @type {string}
     * @memberof Ingredients
     */
    uuid?: string;
}


/**
 * A page of items
 * @export
 * @interface PageForSimpleRecipe
 */
export interface PageForSimpleRecipe {
    /**
     * The page's items
     * @type {Array<SimpleRecipe>}
     * @memberof PageForSimpleRecipe
     */
    items: Array<SimpleRecipe>;
    /**
     * The limit this page was requested with
     * @type {number}
     * @memberof PageForSimpleRecipe
     */
    limit: number;
    /**
     * The offset this page was requested with
     * @type {number}
     * @memberof PageForSimpleRecipe
     */
    offset: number;
    /**
     * The total number of items this page is a subset of
     * @type {number}
     * @memberof PageForSimpleRecipe
     */
    total: number;
}
/**
 * A page of items
 * @export
 * @interface PageForSimpleTag
 */
export interface PageForSimpleTag {
    /**
     * The page's items
     * @type {Array<SimpleTag>}
     * @memberof PageForSimpleTag
     */
    items: Array<SimpleTag>;
    /**
     * The limit this page was requested with
     * @type {number}
     * @memberof PageForSimpleTag
     */
    limit: number;
    /**
     * The offset this page was requested with
     * @type {number}
     * @memberof PageForSimpleTag
     */
    offset: number;
    /**
     * The total number of items this page is a subset of
     * @type {number}
     * @memberof PageForSimpleTag
     */
    total: number;
}
/**
 * A page of items
 * @export
 * @interface PageForSimpleUser
 */
export interface PageForSimpleUser {
    /**
     * The page's items
     * @type {Array<SimpleUser>}
     * @memberof PageForSimpleUser
     */
    items: Array<SimpleUser>;
    /**
     * The limit this page was requested with
     * @type {number}
     * @memberof PageForSimpleUser
     */
    limit: number;
    /**
     * The offset this page was requested with
     * @type {number}
     * @memberof PageForSimpleUser
     */
    offset: number;
    /**
     * The total number of items this page is a subset of
     * @type {number}
     * @memberof PageForSimpleUser
     */
    total: number;
}
/**
 * 
 * @export
 * @interface SimpleRecipe
 */
export interface SimpleRecipe {
    /**
     * 
     * @type {string}
     * @memberof SimpleRecipe
     */
    description: string;
    /**
     * 
     * @type {string}
     * @memberof SimpleRecipe
     */
    name: string;
    /**
     * 
     * @type {Array<SimpleTag>}
     * @memberof SimpleRecipe
     */
    tags: Array<SimpleTag>;
    /**
     * 
     * @type {string}
     * @memberof SimpleRecipe
     */
    uuid: string;
}
/**
 * 
 * @export
 * @interface SimpleTag
 */
export interface SimpleTag {
    /**
     * 
     * @type {string}
     * @memberof SimpleTag
     */
    name: string;
    /**
     * 
     * @type {string}
     * @memberof SimpleTag
     */
    uuid: string;
}
/**
 * 
 * @export
 * @interface SimpleUser
 */
export interface SimpleUser {
    /**
     * 
     * @type {string}
     * @memberof SimpleUser
     */
    display_name: string;
    /**
     * 
     * @type {string}
     * @memberof SimpleUser
     */
    email: string;
    /**
     * 
     * @type {string}
     * @memberof SimpleUser
     */
    uuid: string;
}
/**
 * 
 * @export
 * @interface SingleUuid
 */
export interface SingleUuid {
    /**
     * 
     * @type {string}
     * @memberof SingleUuid
     */
    uuid: string;
}
/**
 * 
 * @export
 * @interface Steps
 */
export interface Steps {
    /**
     * 
     * @type {number}
     * @memberof Steps
     */
    index: number;
    /**
     * 
     * @type {string}
     * @memberof Steps
     */
    step: string;
    /**
     * 
     * @type {string}
     * @memberof Steps
     */
    uuid?: string;
}
/**
 * 
 * @export
 * @interface TokenDataReponse
 */
export interface TokenDataReponse {
    /**
     * 
     * @type {string}
     * @memberof TokenDataReponse
     */
    token: string;
}

/**
 * 
 * @export
 */
export const Units = {
    Cup: 'Cup',
    Gram: 'Gram',
    Kilogram: 'Kilogram',
    Liter: 'Liter',
    Milliliter: 'Milliliter',
    Tablespoon: 'Tablespoon',
    Teaspoon: 'Teaspoon'
} as const;
export type Units = typeof Units[keyof typeof Units];

/**
 * 
 * @export
 * @interface UpdateRecipeRequest
 */
export interface UpdateRecipeRequest {
    /**
     * 
     * @type {string}
     * @memberof UpdateRecipeRequest
     */
    description: string;
    /**
     * 
     * @type {Array<Ingredients>}
     * @memberof UpdateRecipeRequest
     */
    ingredients: Array<Ingredients>;
    /**
     * 
     * @type {string}
     * @memberof UpdateRecipeRequest
     */
    name: string;
    /**
     * 
     * @type {Array<Steps>}
     * @memberof UpdateRecipeRequest
     */
    steps: Array<Steps>;
    /**
     * 
     * @type {Array<string>}
     * @memberof UpdateRecipeRequest
     */
    tags: Array<string>;
    /**
     * 
     * @type {string}
     * @memberof UpdateRecipeRequest
     */
    user: string;
}
/**
 * 
 * @export
 * @interface UserSignInRequest
 */
export interface UserSignInRequest {
    /**
     * 
     * @type {string}
     * @memberof UserSignInRequest
     */
    email: string;
    /**
     * 
     * @type {string}
     * @memberof UserSignInRequest
     */
    password: string;
}
