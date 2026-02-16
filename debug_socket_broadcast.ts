
import { io } from "socket.io-client";
import { chromium } from "playwright";

const API_URL = "http://localhost:3001/api";
const WS_URL = "http://localhost:3001";

async function main() {
  console.log("--- Starting Socket Broadcast Debug ---");

  // 1. User A creates room
  const createRes = await fetch(`${API_URL}/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Debug Room", displayName: "User A" }),
  });
  const createData = await createRes.json();
  if (!createData.ok) {
    console.error("Create failed", createData);
    process.exit(1);
  }
  const { roomId, token: tokenA } = createData.data;
  console.log(`User A created room ${roomId}`);

  // 2. User A connects to Socket
  const socketA = io(WS_URL, {
    transports: ["websocket"],
    auth: { token: tokenA },
  });

  await new Promise<void>((resolve) => {
    socketA.on("connect", () => {
      console.log("User A connected to socket");
      socketA.emit("room:join", { roomId }, (ack: any) => {
        console.log("User A joined room (ack)", ack);
        resolve();
      });
    });
  });

  // Listen for room:state on User A
  socketA.on("room:state", (payload) => {
    console.log(`User A received room:state. Members: ${payload.members.length}`);
    payload.members.forEach((m: any) => console.log(` - ${m.displayName} (${m.id})`));
  });

  // 3. User B joins room via API
  console.log("User B joining via API...");
  const joinRes = await fetch(`${API_URL}/rooms/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: createData.data.state.room.code, displayName: "User B" }),
  });
  const joinData = await joinRes.json();
  if (!joinData.ok) {
    console.error("Join failed", joinData);
    process.exit(1);
  }
  const tokenB = joinData.data.token;
  console.log("User B joined via API");

  // 4. User B connects to Socket
  console.log("User B connecting to socket...");
  const socketB = io(WS_URL, {
    transports: ["websocket"],
    auth: { token: tokenB },
  });

  socketB.on("connect", () => {
    console.log("User B connected to socket");
    socketB.emit("room:join", { roomId }, (ack: any) => {
      console.log("User B joined room (ack)", ack);
    });
  });

  // Wait for events
  await new Promise((resolve) => setTimeout(resolve, 5000));

  socketA.disconnect();
  socketB.disconnect();
  console.log("--- End ---");
}

main().catch(console.error);
