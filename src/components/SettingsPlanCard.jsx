import { Link } from "react-router-dom";
import { getTierColor } from "../utils/tier.js";
import { PRICING_TIERS } from "../data/pricing.js";
import { formatDate } from "../utils/format.js";

const PAYMENT_ISSUE_STATUSES = new Set(["past_due", "unpaid", "incomplete", "incomplete_expired"]);

function SettingsPlanCard({
  subscription,
  subscriptionLoading,
  subscriptionError,
  onJumpToBilling,
  choosePlan,
  loadingPlan,
  checkoutError,
  openBillingPortal,
  portalLoading,
}) {
  const loading = subscriptionLoading && !subscription;

  if (!subscription && !loading) {
    return (
      <aside className="planSidebar hidden lg:flex">
        <div className="planCard h-full flex items-center justify-center">
          <p className="text-sm text-red-400 text-center px-4">
            {subscriptionError || "Couldn't load your plan."}
          </p>
        </div>
      </aside>
    );
  }

  const tier = subscription?.tier;
  const tierIndex = PRICING_TIERS.findIndex((t) => t.title === tier);
  const tierInfo = tierIndex >= 0 ? PRICING_TIERS[tierIndex] : null;
  const nextTier = tierIndex >= 0 && tierIndex < PRICING_TIERS.length - 1 ? PRICING_TIERS[tierIndex + 1] : null;
  // nextTier's list opens with a rollup line ("Everything in X") that only
  // makes sense on the pricing table, not here where X is already this
  // user's plan.
  const lockedFeatures = nextTier ? nextTier.features.filter((feature) => !feature.startsWith("Everything in")) : [];
  const isFree = tier === "Free Thinker";
  const status = subscription?.status;
  const hasPaymentIssue = status && PAYMENT_ISSUE_STATUSES.has(status);
  const cancelAtPeriodEnd = subscription?.cancelAtPeriodEnd;
  const renewalDate = subscription?.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : "";
  const tierColor = getTierColor(tier);
  const tierGradient = `linear-gradient(160deg, color-mix(in srgb, ${tierColor} 70%, white) 0%, ${tierColor} 100%)`;

  let badgeLabel = "CURRENT PLAN";
  if (loading) badgeLabel = "LOADING…";
  else if (hasPaymentIssue) badgeLabel = "PAYMENT ISSUE";
  else if (cancelAtPeriodEnd) badgeLabel = "CANCELING";
  else if (isFree) badgeLabel = "FREE PLAN";

  let statusLabel = "";
  let statusLine = "You're on the Free plan";
  if (loading) {
    statusLine = "Checking your subscription…";
  } else if (hasPaymentIssue) {
    statusLabel = "Payment problem";
    statusLine = "We couldn't process your last payment";
  } else if (!isFree && cancelAtPeriodEnd) {
    statusLabel = "Subscription status";
    statusLine = renewalDate ? `Cancels on ${renewalDate}` : "Cancels at the end of this billing period";
  } else if (!isFree && status) {
    statusLabel = "Subscription status";
    const statusText = status.charAt(0).toUpperCase() + status.slice(1);
    statusLine = renewalDate ? `${statusText} — renews ${renewalDate}` : statusText;
  }

  return (
    <aside className="planSidebar hidden lg:flex">
      <div className="planCard h-full">
        <div className="planCardHeader" style={{ background: tierGradient }}>
          <span className="planCardBadge" style={{ color: hasPaymentIssue ? "#e34848" : tierColor }}>
            {badgeLabel}
          </span>
          <i className="fa-solid fa-brain planCardIcon"></i>
        </div>

        <div className="planCardBody">
          <div className="planCardName">{loading ? "…" : tier}</div>
          {tierInfo && (
            <div className="planCardPrice">
              {tierInfo.price}<span className="planCardPriceUnit">{tierInfo.unit}</span>
            </div>
          )}

          {loading ? null : hasPaymentIssue ? (
            <button type="button" className="planCardCta" style={{ background: tierGradient }} onClick={openBillingPortal} disabled={portalLoading}>
              {portalLoading ? "Opening…" : "Fix Payment Method"}
            </button>
          ) : nextTier ? (
            <button
              type="button"
              className="planCardCta"
              style={{ background: tierGradient }}
              onClick={() => choosePlan(nextTier.plan)}
              disabled={loadingPlan === nextTier.plan}
            >
              {loadingPlan === nextTier.plan
                ? isFree
                  ? "Redirecting…"
                  : "Updating…"
                : isFree
                ? "Pick a Plan"
                : `Upgrade to ${nextTier.title}`}
            </button>
          ) : (
            <div className="planCardMaxTierNote">You're on our top plan</div>
          )}

          {checkoutError && <p className="text-red-400 text-sm mt-2">{checkoutError}</p>}

          {tierInfo && (
            <ul className="planCardFeatureList">
              {tierInfo.features.map((feature) => (
                <li className="planCardFeatureItem" key={feature}>
                  <span className="planCardCheckDot"><i className="fa-solid fa-check"></i></span>
                  {feature}
                </li>
              ))}
            </ul>
          )}

          {lockedFeatures.length > 0 && (
            <>
              <div className="planCardDivider"></div>
              <ul className="planCardFeatureList">
                {lockedFeatures.map((feature) => (
                  <li className="planCardFeatureItem planCardFeatureItemLocked" key={feature}>
                    <span className="planCardLockDot"><i className="fa-solid fa-lock"></i></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="planCardDivider"></div>

          <div className="planCardFooter">
            {statusLabel && <div className="planCardFooterLabel">{statusLabel}</div>}
            <div className="planCardStatus">{statusLine}</div>
            {isFree ? (
              <Link to="/pricing" className="planCardBillingLink">See all plans</Link>
            ) : (
              <button type="button" className="planCardBillingLink" onClick={onJumpToBilling}>
                Jump to Billing &amp; Subscription
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default SettingsPlanCard;
