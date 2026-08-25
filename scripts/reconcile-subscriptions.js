// Reconciles the subscriptions table against Stripe directly. For every
// user with a StripeCustomerId, lists that customer's Stripe subscriptions
// (oldest first) and replays each one through the same upsert logic the
// webhook uses — including its duplicate-active-subscription handling
// (see uniq_subscriptions_active_user in sql/schema.sql), which cancels
// any active subscription beyond the first one found per customer.
//
// Run this once after deploying the subscriptions-table redesign to catch
// up on subscriptions Stripe already knows about that a prior bug never
// (fully) recorded locally — including canceling any duplicate
// subscriptions that resulted from it.
//
// IMPORTANT: this calls stripe.subscriptions.cancel() on real
// subscriptions when it finds more than one active for the same user.
// Confirm STRIPE_SECRET_KEY in .env is pointed at the mode (test/live) you
// intend before running, and read the "Reconciling ..." output as it goes
// — it prints exactly which subscription IDs it cancels and why.
import dotenv from "dotenv";
import pg from "pg";
import Stripe from "stripe";

dotenv.config({ path: process.env.NODE_ENV === "production" ? ".env.production" : ".env" });

const { Pool } = pg;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === "disable" ? false : { rejectUnauthorized: false },
});

// Mirrors PLAN_CONFIG / tierForPriceId in server.js — kept small and
// separate here since this is a one-off script, not the running server.
const PLAN_CONFIG = {
  thinker: { tierName: "Thinker", lookupKey: process.env.STRIPE_LOOKUP_KEY_THINKER || "Thinker-5931b6e" },
  "deep-thinker": { tierName: "Deep Thinker", lookupKey: process.env.STRIPE_LOOKUP_KEY_DEEP_THINKER || "" },
};

async function getPriceIdToTierMap() {
  const map = {};
  for (const config of Object.values(PLAN_CONFIG)) {
    if (!config.lookupKey) continue;
    const prices = await stripe.prices.list({ lookup_keys: [config.lookupKey] });
    for (const price of prices.data) map[price.id] = config.tierName;
  }
  return map;
}

async function syncUserTierFromSubscriptions(userId, priceMap) {
  const { rows } = await pool.query(
    `SELECT "StripeCustomerId", "StripePriceId" FROM subscriptions
     WHERE "UserID" = $1 AND "Status" IN ('active', 'trialing') LIMIT 1`,
    [userId]
  );
  if (rows.length === 0) {
    await pool.query('UPDATE users SET "Tier" = \'Free Thinker\' WHERE "UserID" = $1', [userId]);
    return;
  }
  const tier = priceMap[rows[0].StripePriceId] || "Free Thinker";
  await pool.query('UPDATE users SET "Tier" = $1, "StripeCustomerId" = $2 WHERE "UserID" = $3', [
    tier,
    rows[0].StripeCustomerId,
    userId,
  ]);
}

async function upsertSubscription(subscription, priceMap) {
  const userId = Number(subscription.metadata?.userId);
  if (!userId) {
    console.warn(`  skip ${subscription.id}: no userId metadata`);
    return;
  }

  const priceId = subscription.items?.data?.[0]?.price?.id || null;
  const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null;

  try {
    await pool.query(
      `INSERT INTO subscriptions
         ("StripeSubscriptionId", "UserID", "StripeCustomerId", "StripePriceId", "Status", "CurrentPeriodEnd", "CancelAtPeriodEnd", "UpdatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT ("StripeSubscriptionId") DO UPDATE SET
         "StripePriceId" = EXCLUDED."StripePriceId",
         "Status" = EXCLUDED."Status",
         "CurrentPeriodEnd" = EXCLUDED."CurrentPeriodEnd",
         "CancelAtPeriodEnd" = EXCLUDED."CancelAtPeriodEnd",
         "UpdatedAt" = NOW()`,
      [subscription.id, userId, subscription.customer, priceId, subscription.status, periodEnd, subscription.cancel_at_period_end ?? false]
    );
    console.log(`  ${subscription.id}: ${subscription.status}`);
  } catch (err) {
    if (err.code === "23505" && err.constraint === "uniq_subscriptions_active_user") {
      const price = subscription.items?.data?.[0]?.price;
      const amount = price?.unit_amount != null ? `$${(price.unit_amount / 100).toFixed(2)}/${price.recurring?.interval}` : "unknown amount";
      console.warn(`  DUPLICATE for user ${userId}: canceling ${subscription.id} (${amount}) — an earlier subscription already holds the active slot`);
      if (["active", "trialing"].includes(subscription.status)) {
        await stripe.subscriptions.cancel(subscription.id);
        console.warn(`  canceled ${subscription.id}`);
      }
      return;
    }
    throw err;
  }

  await syncUserTierFromSubscriptions(userId, priceMap);
}

const priceMap = await getPriceIdToTierMap();
const { rows: customers } = await pool.query('SELECT "UserID", "StripeCustomerId" FROM users WHERE "StripeCustomerId" IS NOT NULL');
console.log(`Reconciling ${customers.length} customer(s)...`);

for (const { UserID, StripeCustomerId } of customers) {
  console.log(`User ${UserID} (${StripeCustomerId}):`);
  const subs = await stripe.subscriptions.list({ customer: StripeCustomerId, status: "all", limit: 100 });
  // Oldest first, so the first-ever subscription wins the active slot and
  // any later duplicates are the ones that get canceled.
  const ordered = subs.data.sort((a, b) => a.created - b.created);
  for (const sub of ordered) {
    await upsertSubscription(sub, priceMap);
  }
}

await pool.end();
console.log("Done.");
