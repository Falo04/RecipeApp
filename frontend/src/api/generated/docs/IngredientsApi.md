# IngredientsApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**getAllIngredients**](IngredientsApi.md#getallingredients) | **GET** /api/v1/ingredients/all | Retrieves all ingredients. |
| [**getRecipesByIngredients**](IngredientsApi.md#getrecipesbyingredients) | **POST** /api/v1/ingredients/recipes | Retrieves recipes based on specified ingredients. |



## getAllIngredients

> ListForSimpleIngredient getAllIngredients()

Retrieves all ingredients.

Retrieves all ingredients.

### Example

```ts
import {
  Configuration,
  IngredientsApi,
} from '';
import type { GetAllIngredientsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new IngredientsApi();

  try {
    const data = await api.getAllIngredients();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**ListForSimpleIngredient**](ListForSimpleIngredient.md)

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


## getRecipesByIngredients

> PageForSimpleRecipeWithTags getRecipesByIngredients(GetAllRecipesByIngredientsRequest)

Retrieves recipes based on specified ingredients.

Retrieves recipes based on specified ingredients.

### Example

```ts
import {
  Configuration,
  IngredientsApi,
} from '';
import type { GetRecipesByIngredientsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new IngredientsApi();

  const body = {
    // GetAllRecipesByIngredientsRequest (optional)
    GetAllRecipesByIngredientsRequest: ...,
  } satisfies GetRecipesByIngredientsRequest;

  try {
    const data = await api.getRecipesByIngredients(body);
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
| **GetAllRecipesByIngredientsRequest** | [GetAllRecipesByIngredientsRequest](GetAllRecipesByIngredientsRequest.md) |  | [Optional] |

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

