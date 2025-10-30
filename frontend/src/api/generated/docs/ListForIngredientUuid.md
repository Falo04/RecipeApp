
# ListForIngredientUuid

A single field which is an array.  ## Rust Usage  If you want to return an `ApiJson<Vec<T>>` from your handler, please use `ApiJson<List<T>>` instead.  It simply wraps the vector into a struct with a single field to ensure the json returned from a handler is always an object.

## Properties

Name | Type
------------ | -------------
`list` | Array&lt;string&gt;


[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


