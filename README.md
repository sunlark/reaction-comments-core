# reaction-comments-core
Server side functionality for Reaction Commerce comments

### Schema

- `sourceId` could be ProductId or PostId
- `userId`
- `author` name of comment's author (denormalization for quicker access)
- `email` email of comment's author (required for non registered user to leave
 a comment)
- `ancestors` array with ids of Parent comments in 'Reply-To' chain, if any
(if this is not 1st level not nested comment).
- `createdAt` time of publication
- `body` text of comment
- `workflow` uses Workflow Schema. Can have 2 values: `new` for not moderated
yet and `approved`
- `notifyReply` if the comment's author would like to receive notifications
 about reply for his comment.
