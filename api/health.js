export default {
  fetch() {
    return Response.json({
      ok: true,
      weatherApiConfigured: Boolean(process.env.DATA_GO_KR_SERVICE_KEY),
      platform: "vercel",
    });
  },
};
