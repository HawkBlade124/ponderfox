import { useState } from "react";
import { Link } from "react-router-dom";
import { PRICING_TIERS } from "../../data/pricing";
import "../../css/Pricing.css";

const PRICING_FAQS = [
  {
    q: "Is there a free plan?",
    a: "Yes. The Free plan gives you unlimited thoughts, three folders, and 30 days of history — no credit card required.",
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

function Pricing() {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

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

      <section className="pricingPageGridSection">
        <div className="pricingPageGrid">
          {PRICING_TIERS.map((tier) => (
            <div className={tier.featured ? "pricingPageCard pricingPageCardFeatured" : "pricingPageCard"} key={tier.title}>
              {tier.featured && <span className="pricingPageFeaturedBadge">Most Popular</span>}
              <h3 className="pricingPageCardTitle">{tier.title}</h3>
              <p className="pricingPagePrice">
                {tier.price}<span className="pricingPagePriceUnit">{tier.unit}</span>
              </p>
              <p className="pricingPageBlurb">{tier.blurb}</p>
              <Link
                to="/register"
                className={tier.filled ? "pricingPageCta pricingPageCtaFilled" : "pricingPageCta"}
              >
                Choose {tier.title}
              </Link>
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
