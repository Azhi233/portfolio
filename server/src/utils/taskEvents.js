const sseClients = new Set();

export function registerSseClient(client) {
  sseClients.add(client);
  return () => sseClients.delete(client);
}

export function broadcastSseEvent(eventName, payload) {
  const message = `event: ${String(eventName || 'message')}\ndata: ${JSON.stringify(payload ?? {})}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
}

export function normalizeTaskEventPayload(payload = {}) {
  return {
    event: String(payload.event || 'task-updated'),
    taskId: String(payload.taskId || ''),
    status: String(payload.status || ''),
    targetUrl: payload.targetUrl ?? null,
    errorMsg: payload.errorMsg ?? null,
  };
}

export function emitTaskEvent(payload = {}) {
  const normalized = normalizeTaskEventPayload(payload);
  broadcastSseEvent(normalized.event, normalized);
  return normalized;
}
