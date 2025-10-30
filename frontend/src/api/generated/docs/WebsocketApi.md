# WebsocketApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**openWebsocket**](WebsocketApi.md#openwebsocket) | **GET** /api/v1/websocket | Open a websocket to the frontend. |



## openWebsocket

> openWebsocket()

Open a websocket to the frontend.

Open a websocket to the frontend.

### Example

```ts
import {
  Configuration,
  WebsocketApi,
} from '';
import type { OpenWebsocketRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new WebsocketApi();

  try {
    const data = await api.openWebsocket();
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

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

