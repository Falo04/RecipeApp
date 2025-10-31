# TagsApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**createTag**](TagsApi.md#createtag) | **POST** /api/v1/tags | Creates a tag. |
| [**deleteTag**](TagsApi.md#deletetag) | **DELETE** /api/v1/tags/{uuid} | Delete a tag. |
| [**getAllTags**](TagsApi.md#getalltagsoperation) | **POST** /api/v1/tags/all | Retrieves all tags with pagination support. |
| [**getRecipesByTag**](TagsApi.md#getrecipesbytag) | **POST** /api/v1/tags/{uuid}/recipes | Retrieves a paginated list of recipes associated with a specific tag. |
| [**updateTag**](TagsApi.md#updatetag) | **PUT** /api/v1/tags/{uuid} | Update a tag. |



## createTag

> CreateTag200Response createTag(CreateOrUpdateTag)

Creates a tag.

Creates a tag.

### Example

```ts
import {
  Configuration,
  TagsApi,
} from '';
import type { CreateTagRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TagsApi();

  const body = {
    // CreateOrUpdateTag (optional)
    CreateOrUpdateTag: ...,
  } satisfies CreateTagRequest;

  try {
    const data = await api.createTag(body);
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
| **CreateOrUpdateTag** | [CreateOrUpdateTag](CreateOrUpdateTag.md) |  | [Optional] |

### Return type

[**CreateTag200Response**](CreateTag200Response.md)

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


## deleteTag

> deleteTag(uuid)

Delete a tag.

Delete a tag.

### Example

```ts
import {
  Configuration,
  TagsApi,
} from '';
import type { DeleteTagRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TagsApi();

  const body = {
    // string
    uuid: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies DeleteTagRequest;

  try {
    const data = await api.deleteTag(body);
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


## getAllTags

> PageForSimpleTag getAllTags(GetAllTagsRequest)

Retrieves all tags with pagination support.

Retrieves all tags with pagination support.

### Example

```ts
import {
  Configuration,
  TagsApi,
} from '';
import type { GetAllTagsOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TagsApi();

  const body = {
    // GetAllTagsRequest (optional)
    GetAllTagsRequest: ...,
  } satisfies GetAllTagsOperationRequest;

  try {
    const data = await api.getAllTags(body);
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
| **GetAllTagsRequest** | [GetAllTagsRequest](GetAllTagsRequest.md) |  | [Optional] |

### Return type

[**PageForSimpleTag**](PageForSimpleTag.md)

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


## getRecipesByTag

> PageForSimpleRecipeWithTags getRecipesByTag(uuid, GetAllRecipesRequest)

Retrieves a paginated list of recipes associated with a specific tag.

Retrieves a paginated list of recipes associated with a specific tag.

### Example

```ts
import {
  Configuration,
  TagsApi,
} from '';
import type { GetRecipesByTagRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TagsApi();

  const body = {
    // string
    uuid: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // GetAllRecipesRequest (optional)
    GetAllRecipesRequest: ...,
  } satisfies GetRecipesByTagRequest;

  try {
    const data = await api.getRecipesByTag(body);
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


## updateTag

> FormErrorResponseForCreateOrUpdateTagErrors updateTag(uuid, CreateOrUpdateTag)

Update a tag.

Update a tag.

### Example

```ts
import {
  Configuration,
  TagsApi,
} from '';
import type { UpdateTagRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TagsApi();

  const body = {
    // string
    uuid: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // CreateOrUpdateTag (optional)
    CreateOrUpdateTag: ...,
  } satisfies UpdateTagRequest;

  try {
    const data = await api.updateTag(body);
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
| **CreateOrUpdateTag** | [CreateOrUpdateTag](CreateOrUpdateTag.md) |  | [Optional] |

### Return type

[**FormErrorResponseForCreateOrUpdateTagErrors**](FormErrorResponseForCreateOrUpdateTagErrors.md)

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

