import { sendAbandonedCheckoutEmail } from "lib/email/abandoned-checkout";
import { getSupabaseServerClient } from "lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const WINDOW_START_MINUTES = 75;
const WINDOW_END_MINUTES = 45;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ status: 401 }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  const now = Date.now();
  const windowStart = new Date(
    now - WINDOW_START_MINUTES * 60 * 1000,
  ).toISOString();
  const windowEnd = new Date(
    now - WINDOW_END_MINUTES * 60 * 1000,
  ).toISOString();

  const { data: checkouts, error } = await supabase
    .from("abandoned_checkouts")
    .select("id, email, checkout_url, total_price, currency, line_items")
    .gte("created_at", windowStart)
    .lte("created_at", windowEnd)
    .is("reminder_sent_at", null)
    .is("order_id", null);

  if (error) {
    console.error("Failed to fetch abandoned checkouts:", error.message);
    return NextResponse.json({ status: 500 }, { status: 500 });
  }

  let sent = 0;

  for (const checkout of checkouts ?? []) {
    try {
      await sendAbandonedCheckoutEmail(checkout);

      const { error: updateError } = await supabase
        .from("abandoned_checkouts")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", checkout.id);

      if (updateError) {
        console.error("Failed to mark reminder sent:", updateError.message);
        continue;
      }

      sent += 1;
    } catch (err) {
      console.error("Failed to send abandoned checkout email:", err);
    }
  }

  return NextResponse.json({ status: 200, sent });
}
