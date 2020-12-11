# Chat using GraphQL Subscription

## Summary

A livestream can have two types of message threads(chats) - public and private.

Public message thread is created in default when a live stream is added.

```js
addLiveStream
```

Private message thread is created when a user join the live stream.

```js
joinLiveStream
```

## API Usage

- to load message threads(chats):
use 
```js
messageThreads
```
- to add a message to a message thread:

use 
```js
addMessage
```
