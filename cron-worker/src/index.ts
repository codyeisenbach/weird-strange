export interface Env {
  CRON_SECRET: string;
  CRON_TARGET_URL: string;
}

export default {
  async scheduled(
    _event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    ctx.waitUntil(
      fetch(env.CRON_TARGET_URL, {
        headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
      }).then((res) => {
        if (!res.ok) {
          console.error(
            "Abandoned checkout cron request failed",
            res.status,
          );
        }
      }),
    );
  },
};
