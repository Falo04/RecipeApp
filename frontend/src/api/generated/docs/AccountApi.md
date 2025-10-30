# AccountApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**getMe**](AccountApi.md#getme) | **GET** /api/v1/account/me | This function handles requests to the \&quot;/me\&quot; endpoint. |



## getMe

> SimpleAccount getMe()

This function handles requests to the \&quot;/me\&quot; endpoint.

This function handles requests to the \&quot;/me\&quot; endpoint.

### Example

```ts
import {
  Configuration,
  AccountApi,
} from '';
import type { GetMeRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AccountApi();

  try {
    const data = await api.getMe();
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

[**SimpleAccount**](SimpleAccount.md)

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

