# RecipeApp

A shared recipe collection: users write recipes, tag them, and list the ingredients each one needs.

## Language

**Data change**:
A notice that one kind of data (recipes, tags or ingredients) changed, without naming which record. The server sends one to every connected client after a write is committed.
_Avoid_: event, update, invalidation, websocket message
