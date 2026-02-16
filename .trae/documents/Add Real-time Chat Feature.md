# Add Real-time Chat Feature

I will implement a real-time chat feature that meets your requirements: no history storage, new users start with a blank slate, and messages are broadcast to current room members only.

## Technical Implementation

### 1. Server-Side (`server/src/index.ts`)
- Add a new Socket.IO event listener `chat:message`.
- When a user sends a message:
    - Validate the content.
    - Append sender details (Display Name) from the server's in-memory room state.
    - Broadcast the message immediately to the room via `io.to(roomId).emit(...)`.
- **No database storage** will be used, ensuring no history is persisted.

### 2. Frontend (`web/src`)
- **Create `ChatPanel.vue`**:
    - A new component located in `web/src/components/room/chat/`.
    - Listens for `chat:message` events from the server.
    - Maintains a local list of messages in the component state. This ensures that when a user refreshes or leaves, the chat is cleared.
    - Displays messages with user avatars (using the existing `animalAvatarUrl` utility) and names.
    - Includes an input field to send messages.
- **Update `SidebarLeft.vue`**:
    - Integrate `ChatPanel` into the left sidebar.
    - Adjust the layout to share space between the existing `MemberList` and the new `ChatPanel`.

## User Experience
- **Location**: The chat will be located in the left sidebar, below the member list, making it easily accessible while listening.
- **Behavior**: Users will only see messages sent *after* they join the room.
- **Visuals**: Messages will show the sender's generated avatar and name, consistent with the member list style.
