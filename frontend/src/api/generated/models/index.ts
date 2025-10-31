/* tslint:disable */
/* eslint-disable */
/**
 * The response that is sent in a case of an error the caller should report to an admin
 * @export
 * @interface ApiErrorResponse
 */
export interface ApiErrorResponse {
    /**
     * ID of the opentelemetry trace this error originated in
     * @type {string}
     * @memberof ApiErrorResponse
     */
    trace_id: string;
}
/**
 * Represents the request body for creating a new recipe.
 * @export
 * @interface CreateOrUpdateRecipe
 */
export interface CreateOrUpdateRecipe {
    /**
     * the description of the recipe
     * @type {string}
     * @memberof CreateOrUpdateRecipe
     */
    description: string;
    /**
     * Vector of all `RecipeIngredients`.
     * @type {Array<FullIngredient>}
     * @memberof CreateOrUpdateRecipe
     */
    ingredients: Array<FullIngredient>;
    /**
     * The name of the recipe
     * @type {string}
     * @memberof CreateOrUpdateRecipe
     */
    name: string;
    /**
     * Vector of all `Steps`.
     * @type {Array<Step>}
     * @memberof CreateOrUpdateRecipe
     */
    steps: Array<Step>;
    /**
     * Vector of tag Uuids.
     * @type {Array<string>}
     * @memberof CreateOrUpdateRecipe
     */
    tags: Array<string>;
    /**
     * Optional user which is associated with the recipe.
     * 
     * Optional because if authentication is disabled, I don't know who created the recipe. If authentication is enabled, user must be set.
     * @type {string}
     * @memberof CreateOrUpdateRecipe
     */
    user?: string | null;
}
/**
 * Errors for create or update a recipe.
 * @export
 * @interface CreateOrUpdateRecipeErrors
 */
export interface CreateOrUpdateRecipeErrors {
    /**
     * 
     * @type {boolean}
     * @memberof CreateOrUpdateRecipeErrors
     */
    name_already_exists: boolean;
}
/**
 * Represents the structure for creating or updating a tag.
 * @export
 * @interface CreateOrUpdateTag
 */
export interface CreateOrUpdateTag {
    /**
     * The color associated with the tag, chosen from the `TagColors` enum.
     * @type {TagColors}
     * @memberof CreateOrUpdateTag
     */
    color: TagColors;
    /**
     * The name of the tag (string, maximum length 255).
     * @type {string}
     * @memberof CreateOrUpdateTag
     */
    name: string;
}


/**
 * Errors for creating or updating a tag.
 * @export
 * @interface CreateOrUpdateTagErrors
 */
export interface CreateOrUpdateTagErrors {
    /**
     * 
     * @type {boolean}
     * @memberof CreateOrUpdateTagErrors
     */
    name_already_exists: boolean;
}
/**
 * @type CreateRecipe200Response
 * 
 * @export
 */
export type CreateRecipe200Response = FormErrorResponseForCreateOrUpdateRecipeErrors | SingleUuid;
/**
 * @type CreateTag200Response
 * 
 * @export
 */
export type CreateTag200Response = FormErrorResponseForCreateOrUpdateTagErrors | SingleUuid;

/**
 * Constant string `"Err"` which is documented by schemars
 * @export
 */
export const ErrorConstant = {
    Err: 'Err'
} as const;
export type ErrorConstant = typeof ErrorConstant[keyof typeof ErrorConstant];

/**
 * The response that is sent in a case of an error the caller should present his user
 * @export
 * @interface FormErrorResponseForCreateOrUpdateRecipeErrors
 */
export interface FormErrorResponseForCreateOrUpdateRecipeErrors {
    /**
     * The actual error struct
     * @type {CreateOrUpdateRecipeErrors}
     * @memberof FormErrorResponseForCreateOrUpdateRecipeErrors
     */
    error: CreateOrUpdateRecipeErrors;
    /**
     * A constant `"Err"` used to differentiate this schema from any other "Ok" schema
     * @type {ErrorConstant}
     * @memberof FormErrorResponseForCreateOrUpdateRecipeErrors
     */
    result: ErrorConstant;
}


/**
 * The response that is sent in a case of an error the caller should present his user
 * @export
 * @interface FormErrorResponseForCreateOrUpdateTagErrors
 */
export interface FormErrorResponseForCreateOrUpdateTagErrors {
    /**
     * The actual error struct
     * @type {CreateOrUpdateTagErrors}
     * @memberof FormErrorResponseForCreateOrUpdateTagErrors
     */
    error: CreateOrUpdateTagErrors;
    /**
     * A constant `"Err"` used to differentiate this schema from any other "Ok" schema
     * @type {ErrorConstant}
     * @memberof FormErrorResponseForCreateOrUpdateTagErrors
     */
    result: ErrorConstant;
}


/**
 * Represents the ingredients for a recipe.
 * 
 * This struct will be used for Response and Request.
 * @export
 * @interface FullIngredient
 */
export interface FullIngredient {
    /**
     * The quantity of the ingredient.
     * @type {number}
     * @memberof FullIngredient
     */
    amount: number;
    /**
     * The name of the ingredient,
     * @type {string}
     * @memberof FullIngredient
     */
    name: string;
    /**
     * The unit of the ingredient.
     * @type {Units}
     * @memberof FullIngredient
     */
    unit: Units;
    /**
     * An optional UUID representing the ingredient mapping.
     * 
     * In case of a request: - if Some(uuid), the mapping must be updated because it already exists. - if None, the mapping must be created.
     * 
     * In case of a response: The uuid must be set.
     * @type {string}
     * @memberof FullIngredient
     */
    uuid?: string | null;
}


/**
 * Represents a complete recipe with all associated details.
 * 
 * This struct contains information about a recipe, including its unique identifier, name, description, user, tags, ingredients, and steps.
 * @export
 * @interface FullRecipe
 */
export interface FullRecipe {
    /**
     * The description of the recipe (string, maximum length 1024).
     * @type {string}
     * @memberof FullRecipe
     */
    description: string;
    /**
     * A vector of `RecipeIngredients` objects representing the ingredients associated with the recipe.
     * @type {Array<FullIngredient>}
     * @memberof FullRecipe
     */
    ingredients: Array<FullIngredient>;
    /**
     * The name of the recipe (string, maximum length 255).
     * @type {string}
     * @memberof FullRecipe
     */
    name: string;
    /**
     * A vector of `Steps` objects representing the steps associated with the recipe.
     * @type {Array<Step>}
     * @memberof FullRecipe
     */
    steps: Array<Step>;
    /**
     * A vector of `SimpleTag` objects representing the tags associated with the recipe.
     * @type {Array<SimpleTag>}
     * @memberof FullRecipe
     */
    tags: Array<SimpleTag>;
    /**
     * An optional reference to a simple user object associated with the recipe.
     * @type {SimpleAccount}
     * @memberof FullRecipe
     */
    user: SimpleAccount;
    /**
     * The identifier for the recipe.
     * @type {string}
     * @memberof FullRecipe
     */
    uuid: string;
}
/**
 * 
 * @export
 * @interface GetAllRecipesByIngredientsRequest
 */
export interface GetAllRecipesByIngredientsRequest {
    /**
     * Name of recipes to filter for
     * @type {string}
     * @memberof GetAllRecipesByIngredientsRequest
     */
    filter_name?: string | null;
    /**
     * List of ingredients to filter for
     * @type {ListForIngredientUuid}
     * @memberof GetAllRecipesByIngredientsRequest
     */
    filter_uuids: ListForIngredientUuid;
    /**
     * The limit this page was requested with
     * @type {number}
     * @memberof GetAllRecipesByIngredientsRequest
     */
    limit: number;
    /**
     * The offset this page was requested with
     * @type {number}
     * @memberof GetAllRecipesByIngredientsRequest
     */
    offset: number;
}
/**
 * 
 * @export
 * @interface GetAllRecipesRequest
 */
export interface GetAllRecipesRequest {
    /**
     * Search for recipe name
     * @type {string}
     * @memberof GetAllRecipesRequest
     */
    filter_name?: string | null;
    /**
     * The limit this page was requested with
     * @type {number}
     * @memberof GetAllRecipesRequest
     */
    limit: number;
    /**
     * The offset this page was requested with
     * @type {number}
     * @memberof GetAllRecipesRequest
     */
    offset: number;
}
/**
 * 
 * @export
 * @interface GetAllTagsRequest
 */
export interface GetAllTagsRequest {
    /**
     * Search for tag name
     * @type {string}
     * @memberof GetAllTagsRequest
     */
    filter_name?: string | null;
    /**
     * The limit this page was requested with
     * @type {number}
     * @memberof GetAllTagsRequest
     */
    limit: number;
    /**
     * The offset this page was requested with
     * @type {number}
     * @memberof GetAllTagsRequest
     */
    offset: number;
}
/**
 * A single field which is an array.
 * 
 * ## Rust Usage
 * 
 * If you want to return an `ApiJson<Vec<T>>` from your handler, please use `ApiJson<List<T>>` instead.
 * 
 * It simply wraps the vector into a struct with a single field to ensure the json returned from a handler is always an object.
 * @export
 * @interface ListForIngredientUuid
 */
export interface ListForIngredientUuid {
    /**
     * 
     * @type {Array<string>}
     * @memberof ListForIngredientUuid
     */
    list: Array<string>;
}
/**
 * A single field which is an array.
 * 
 * ## Rust Usage
 * 
 * If you want to return an `ApiJson<Vec<T>>` from your handler, please use `ApiJson<List<T>>` instead.
 * 
 * It simply wraps the vector into a struct with a single field to ensure the json returned from a handler is always an object.
 * @export
 * @interface ListForSimpleIngredient
 */
export interface ListForSimpleIngredient {
    /**
     * 
     * @type {Array<SimpleIngredient>}
     * @memberof ListForSimpleIngredient
     */
    list: Array<SimpleIngredient>;
}
/**
 * A page of items
 * @export
 * @interface PageForSimpleRecipeWithTags
 */
export interface PageForSimpleRecipeWithTags {
    /**
     * The page's items
     * @type {Array<SimpleRecipeWithTags>}
     * @memberof PageForSimpleRecipeWithTags
     */
    items: Array<SimpleRecipeWithTags>;
    /**
     * The limit this page was requested with
     * @type {number}
     * @memberof PageForSimpleRecipeWithTags
     */
    limit: number;
    /**
     * The offset this page was requested with
     * @type {number}
     * @memberof PageForSimpleRecipeWithTags
     */
    offset: number;
    /**
     * The total number of items this page is a subset of
     * @type {number}
     * @memberof PageForSimpleRecipeWithTags
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
 * 
 * @export
 * @interface SimpleAccount
 */
export interface SimpleAccount {
    /**
     * 
     * @type {string}
     * @memberof SimpleAccount
     */
    display_name: string;
    /**
     * 
     * @type {string}
     * @memberof SimpleAccount
     */
    email: string;
    /**
     * Wrapper type to give stronger typing to account identifiers.
     * @type {string}
     * @memberof SimpleAccount
     */
    uuid: string;
}
/**
 * Represents the response received after searching for ingredients.
 * @export
 * @interface SimpleIngredient
 */
export interface SimpleIngredient {
    /**
     * The name of the ingredient.
     * @type {string}
     * @memberof SimpleIngredient
     */
    name: string;
    /**
     * The UUID for the ingredient.
     * @type {string}
     * @memberof SimpleIngredient
     */
    uuid: string;
}
/**
 * Represents a simple recipe with associated tags.
 * 
 * This struct contains information about a recipe, including its unique identifier, name, description, and a list of associated tags.
 * @export
 * @interface SimpleRecipeWithTags
 */
export interface SimpleRecipeWithTags {
    /**
     * The description of the recipe (string, maximum length 1024).
     * @type {string}
     * @memberof SimpleRecipeWithTags
     */
    description: string;
    /**
     * The name of the recipe (string, maximum length 255).
     * @type {string}
     * @memberof SimpleRecipeWithTags
     */
    name: string;
    /**
     * A vector of `SimpleTag` objects representing the tags associated with the recipe.
     * @type {Array<SimpleTag>}
     * @memberof SimpleRecipeWithTags
     */
    tags: Array<SimpleTag>;
    /**
     * The identifier for the recipe.
     * @type {string}
     * @memberof SimpleRecipeWithTags
     */
    uuid: string;
}
/**
 * Represents a simple tag
 * @export
 * @interface SimpleTag
 */
export interface SimpleTag {
    /**
     * An enum representing the color associated with the tag.
     * @type {TagColors}
     * @memberof SimpleTag
     */
    color: TagColors;
    /**
     * The name of the tag (string, maximum length 255).
     * @type {string}
     * @memberof SimpleTag
     */
    name: string;
    /**
     * The UUID for the tag.
     * @type {string}
     * @memberof SimpleTag
     */
    uuid: string;
}


/**
 * A single uuid wrapped in a struct
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
 * Represents a single step in a process.
 * 
 * This struct will be used for Response and Request.
 * @export
 * @interface Step
 */
export interface Step {
    /**
     * Representing the step's position in the sequence.
     * @type {number}
     * @memberof Step
     */
    index: number;
    /**
     * The actual value of the step (string, maximum length 255).
     * @type {string}
     * @memberof Step
     */
    step: string;
    /**
     * An optional UUID representing the step
     * 
     * In case of a request: - if Some(uuid), the mapping must be updated because it already exists - if None, the mapping must be created
     * 
     * In case of a response: The uuid must be set.
     * @type {string}
     * @memberof Step
     */
    uuid?: string | null;
}

/**
 * Represents different tag colors, each associated with a numerical value.
 * 
 * This enum defines a set of colors that can be used to represent tags.
 * @export
 */
export const TagColors = {
    Red: 'Red',
    Orange: 'Orange',
    Amber: 'Amber',
    Yellow: 'Yellow',
    Lime: 'Lime',
    Green: 'Green',
    Emerald: 'Emerald',
    Teal: 'Teal',
    Cyan: 'Cyan',
    Sky: 'Sky',
    Blue: 'Blue',
    Indigo: 'Indigo',
    Violet: 'Violet',
    Purple: 'Purple',
    Fuchsia: 'Fuchsia',
    Pink: 'Pink',
    Rose: 'Rose',
    Zinc: 'Zinc'
} as const;
export type TagColors = typeof TagColors[keyof typeof TagColors];


/**
 * Represents different units of measurement.
 * 
 * This enum defines various units for quantities, allowing for flexible and consistent handling of measurements.  Each variant corresponds to a specific unit of measurement.
 * @export
 */
export const Units = {
    /**
    * 
    */
    Cup: 'Cup',
    /**
    * 
    */
    Gram: 'Gram',
    /**
    * 
    */
    Kilogram: 'Kilogram',
    /**
    * 
    */
    Liter: 'Liter',
    /**
    * 
    */
    Milliliter: 'Milliliter',
    /**
    * 
    */
    Tablespoon: 'Tablespoon',
    /**
    * 
    */
    Teaspoon: 'Teaspoon',
    /**
    * if the user doesn&#39;t want to specific a unit

e.g., 1 egg
    */
    None: 'None'
} as const;
export type Units = typeof Units[keyof typeof Units];

