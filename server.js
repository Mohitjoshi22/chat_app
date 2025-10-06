const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
const clients = new Map();
const MAX_USERS = 2;

wss.on('connection', (ws) => {
    ws.userId = null;

    ws.on('message', (message) => {
        let data;
        try { data = JSON.parse(message); } catch { return; }

        if (data.type === "login") {
            if (clients.size >= MAX_USERS) {
                ws.send(JSON.stringify({ type: "error", text: "Server full" }));
                ws.close();
                return;
            }
            if (clients.has(data.userId)) {
                ws.send(JSON.stringify({ type: "error", text: "UserId already connected" }));
                ws.close();
                return;
            }
            ws.userId = data.userId;
            clients.set(ws.userId, ws);
            ws.send(JSON.stringify({ type: "info", text: `Logged in as ${ws.userId}` }));
            console.log(`User ${ws.userId} connected`);
            return;
        }

        if (data.type === "message") {
            const targetWs = clients.get(data.targetId);
            if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                targetWs.send(JSON.stringify({
                    type: "message",
                    from: ws.userId,
                    text: data.text
                }));
            } else {
                ws.send(JSON.stringify({ type: "error", text: `User ${data.targetId} not online` }));
            }
        }
    });

    ws.on('close', () => {
        if (ws.userId) {
            clients.delete(ws.userId);
            console.log(`User ${ws.userId} disconnected`);
        }
    });
});

console.log("WebSocket 1-to-1 chat server for 2 users running on ws://localhost:8080");
