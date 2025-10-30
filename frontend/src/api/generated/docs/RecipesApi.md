# RecipesApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**createRecipe**](RecipesApi.md#createrecipe) | **POST** /api/v1/recipes | Creates a new recipe. |
| [**deleteRecipe**](RecipesApi.md#deleterecipe) | **DELETE** /api/v1/recipes/{uuid} | Deletes a recipe by its UUID. |
| [**getAllRecipes**](RecipesApi.md#getallrecipesoperation) | **POST** /api/v1/recipes/all | Retrieves all recipes with pagination support and associated tags. |
| [**getRecipe**](RecipesApi.md#getrecipe) | **GET** /api/v1/recipes/{uuid} | Retrieves a recipe by its UUID. |
| [**updateRecipe**](RecipesApi.md#updaterecipe) | **PUT** /api/v1/recipes/{uuid} | Updates an existing recipe based on its UUID. |



## createRecipe

> SingleUuid createRecipe(CreateOrUpdateRecipe)

Creates a new recipe.

Creates a new recipe.

### Example

```ts
import {
  Configuration,
  RecipesApi,
} from '';
import type { CreateRecipeRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new RecipesApi();

  const body = {
    // CreateOrUpdateRecipe (optional)
    CreateOrUpdateRecipe: ...,
  } satisfies CreateRecipeRequest;

  try {
    const data = await api.createRecipe(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **CreateOrUpdateRecipe** | [CreateOrUpdateRecipe](CreateOrUpdateRecipe.md) |  | [Optional] |

### Return type

[**SingleUuid**](SingleUuid.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **400** |  |  -  |
| **500** |  |  -  |
| **401** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## deleteRecipe

> deleteRecipe(uuid)

Deletes a recipe by its UUID.

Deletes a recipe by its UUID.

### Example

```ts
import {
  Configuration,
  RecipesApi,
} from '';
import type { DeleteRecipeRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new RecipesApi();

  const body = {
    // string
    uuid: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies DeleteRecipeRequest;

  try {
    const data = await api.deleteRecipe(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **uuid** | `string` |  | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **400** |  |  -  |
| **500** |  |  -  |
| **401** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getAllRecipes

> PageForSimpleRecipeWithTags getAllRecipes(GetAllRecipesRequest)

Retrieves all recipes with pagination support and associated tags.

Retrieves all recipes with pagination support and associated tags.

### Example

```ts
import {
  Configuration,
  RecipesApi,
} from '';
import type { GetAllRecipesOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new RecipesApi();

  const body = {
    // GetAllRecipesRequest (optional)
    GetAllRecipesRequest: ...,
  } satisfies GetAllRecipesOperationRequest;

  try {
    const data = await api.getAllRecipes(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **GetAllRecipesRequest** | [GetAllRecipesRequest](GetAllRecipesRequest.md) |  | [Optional] |

### Return type

[**PageForSimpleRecipeWithTags**](PageForSimpleRecipeWithTags.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **400** |  |  -  |
| **500** |  |  -  |
| **401** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getRecipe

> FullRecipe getRecipe(uuid)

Retrieves a recipe by its UUID.

Retrieves a recipe by its UUID.

### Example

```ts
import {
  Configuration,
  RecipesApi,
} from '';
import type { GetRecipeRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new RecipesApi();

  const body = {
    // string
    uuid: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies GetRecipeRequest;

  try {
    const data = await api.getRecipe(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **uuid** | `string` |  | [Defaults to `undefined`] |

### Return type

[**FullRecipe**](FullRecipe.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **400** |  |  -  |
| **500** |  |  -  |
| **401** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## updateRecipe

> updateRecipe(uuid, CreateOrUpdateRecipe)

Updates an existing recipe based on its UUID.

Updates an existing recipe based on its UUID.

### Example

```ts
import {
  Configuration,
  RecipesApi,
} from '';
import type { UpdateRecipeRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new RecipesApi();

  const body = {
    // string
    uuid: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // CreateOrUpdateRecipe (optional)
    CreateOrUpdateRecipe: ...,
  } satisfies UpdateRecipeRequest;

  try {
    const data = await api.updateRecipe(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **uuid** | `string` |  | [Defaults to `undefined`] |
| **CreateOrUpdateRecipe** | [CreateOrUpdateRecipe](CreateOrUpdateRecipe.md) |  | [Optional] |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **400** |  |  -  |
| **500** |  |  -  |
| **401** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

