export function createEventsController({ sseClients, uploadEvents }) {
  function getEvents(req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write(': connected\n\n');
    sseClients.add(res);

    const keepAlive = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(keepAlive);
        sseClients.delete(res);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(res);
    });
  }

  function attachUploadEvents(broadcastSse) {
    uploadEvents.on('task-event', (payload) => {
      if (!payload?.event) return;
      // 广播负载剥离 URL 类字段:匿名 SSE 连接不应获得上传文件地址
      const { targetUrl, url, ...safePayload } = payload;
      broadcastSse(payload.event, safePayload);
    });
  }

  return { getEvents, attachUploadEvents };
}
