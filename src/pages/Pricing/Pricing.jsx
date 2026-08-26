import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PRICING_TIERS } from "../../data/pricing";
import { useCheckout } from "../../hooks/useCheckout.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { buildApiUrl } from "../../utils/api.js";
import "../../css/Pricing.css";

const PRICING_FAQS = [
  {
    q: "Is there a free plan?",
    a: "Yes. The Free plan gives you unlimited thoughts, three folders, and 30 days of history. No credit card required.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Anytime, no questions asked. Your existing thoughts stay yours to export even after you cancel.",
  },
  {
    q: "What happens to my thoughts if I downgrade?",
    a: "Nothing gets deleted. You'll just be limited by your new plan's folder count and history window going forward.",
  },
];

// `subscriptionConfirmed` reflects an actual GET /api/subscription read
// (see the effect below), never the mere presence of ?success=true — Stripe
// redirects here the instant checkout completes, but the Tier update lands
// a moment later via webhook, so the URL alone can't tell us the
// subscription is really active yet.
function CheckoutResultBanner({ searchParams, onDismiss, subscriptionConfirmed }) {
  if (searchParams.get("success")) {
    return (
      <div className="pricingResultBanner pricingResultBannerSuccess" onClick={onDismiss}>
        <i className={subscriptionConfirmed ? "fa-solid fa-circle-check" : "fa-solid fa-circle-notch fa-spin"}></i>
        <div>
          {subscriptionConfirmed ? (
            <>
              <strong>You're all set.</strong> Your subscription is active. Head to <Link to="/settings">Settings</Link> to manage billing anytime.
            </>
          ) : (
            <>
              <strong>Payment received.</strong> We're confirming your upgrade. Check <Link to="/settings">Settings</Link> in a moment to see your new plan.
            </>
          )}
        </div>
      </div>
    );
  }

  if (searchParams.get("canceled")) {
    return (
      <div className="pricingResultBanner pricingResultBannerCanceled"  onClick={onDismiss}>
        <i className="fa-regular fa-circle-xmark"></i>
        <div>Checkout was canceled. No charge was made. Pick a plan below whenever you're ready.</div>
      </div>
    );
  }

  return null;
}

function Pricing() {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const { startCheckout, loadingPlan, error: checkoutError } = useCheckout();
  const { refreshUser, token } = useAuth();
  const [subscriptionConfirmed, setSubscriptionConfirmed] = useState(false);

  // The success banner isn't allowed to claim the subscription is active
  // just because the URL says success=true — checkout completing and the
  // webhook actually updating the DB are two different moments. This polls
  // the same GET /api/subscription Settings uses (not local/URL state)
  // until it reports a paid tier, riding out the webhook's lag with one
  // retry rather than indefinitely.
  useEffect(() => {
    if (!searchParams.get("success") || !token) return;
    let cancelled = false;

    const checkSubscription = async () => {
      try {
        const res = await fetch(`${buildApiUrl()}/subscription`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (cancelled) return;
        if (data.success && data.tier && data.tier !== "Free Thinker") {
          setSubscriptionConfirmed(true);
          refreshUser();
        }
      } catch (err) {
        console.error("Error confirming subscription:", err);
      }
    };

    checkSubscription();
    const retry = setTimeout(checkSubscription, 3000);
    return () => {
      cancelled = true;
      clearTimeout(retry);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, token]);

  const dismissCheckoutBanner = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("success");
      next.delete("canceled");
      return next;
    }, { replace: true });
  };

  return (
    <div className="pricingPageRoot">
      <section className="pricingPageHero">
        <div className="pricingPageHeroBlob pricingPageHeroBlobTopRight"></div>
        <div className="pricingPageHeroBlob pricingPageHeroBlobBottomLeft"></div>
        <div className="pricingPageHeroInner">
          <p className="pricingPageKicker">pricing</p>
          <h1 className="pricingPageHeroTitle">Simple plans, no surprises</h1>
          <p className="pricingPageHeroSubtitle">
            Start free. Upgrade whenever you're ready for more room to think.
          </p>
        </div>
      </section>

      <CheckoutResultBanner searchParams={searchParams} onDismiss={dismissCheckoutBanner} subscriptionConfirmed={subscriptionConfirmed} />

      {checkoutError && (
        <div className="pricingResultBanner pricingResultBannerCanceled">
          <i className="fa-regular fa-circle-exclamation"></i>
          <div>{checkoutError}</div>
        </div>
      )}

      <section className="pricingPageGridSection">
        <div className="pricingPageGrid justify-between w-full">
          {PRICING_TIERS.map((tier) => (
            <div className={tier.featured ? "pricingPageCard pricingPageCardFeatured" : "pricingPageCard"} key={tier.title}>
              {tier.featured && <span className="pricingPageFeaturedBadge">Most Popular</span>}
              <h3 className="pricingPageCardTitle">{tier.title}</h3>
              <p className="pricingPagePrice">
                {tier.price}<span className="pricingPagePriceUnit">{tier.unit}</span>
              </p>
              <p className="pricingPageBlurb">{tier.blurb}</p>
              {tier.plan ? (
                <button
                  type="button"
                  onClick={() => startCheckout(tier.plan)}
                  disabled={loadingPlan === tier.plan}
                  className={tier.filled ? "pricingPageCta pricingPageCtaFilled pricingPageCtaButton" : "pricingPageCta pricingPageCtaButton"}
                >
                  {loadingPlan === tier.plan ? "Redirecting…" : `Choose ${tier.title}`}
                </button>
              ) : (
                <Link to="/register" className={tier.filled ? "pricingPageCta pricingPageCtaFilled" : "pricingPageCta"}>
                  Choose {tier.title}
                </Link>
              )}
              <ul className="pricingPageFeatureList">
                {tier.features.map((feature) => (
                  <li className="pricingPageFeatureItem" key={feature}>
                    <span className="pricingPageCheckDot"><i className="fa-solid fa-check"></i></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="pricingPageFaqSection">
        <div className="pricingPageFaqInner">
          <h2 className="pricingPageSectionTitle">Billing questions</h2>
          <div className="pricingPageFaqList">
            {PRICING_FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div className="pricingPageFaqItem" key={faq.q}>
                  <button
                    className="pricingPageFaqButton"
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                  >
                    {faq.q}
                    <span className="pricingPageFaqPlus" style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
                  </button>
                  {isOpen && <p className="pricingPageFaqAnswer">{faq.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pricingPageCtaSection">
        <div className="pricingPageCtaGlow"></div>
        <div className="pricingPageCtaInner">
          <h2 className="pricingPageCtaTitle">Ready to think it through?</h2>
          <Link to="/register" className="pricingPageCtaBtn">Get Started Free</Link>
        </div>
      </section>
    </div>
  );
}

export default Pricing;
