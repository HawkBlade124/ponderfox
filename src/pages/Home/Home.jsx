import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import heroImg from "../../assets/hero.jpg";
import { PRICING_TIERS } from "../../data/pricing";
import "../../css/Home.css";

const WHO_CARDS = [
  {
    icon: "whoIconSquare",
    title: "Overthinkers",
    text: "You replay the same conversation five times before bed. Give it somewhere to go instead.",
  },
  {
    icon: "whoIconCircle",
    title: "Decision-makers",
    text: "Weighing a big choice? Talk it out loud, on the page, before you commit to anything.",
  },
  {
    icon: "whoIconDiamond",
    title: "Journalers",
    text: "Already writing things down? PonderFox gives your entries somewhere to go next.",
  },
  {
    icon: "whoIconRounded",
    title: "Anyone who needs to vent",
    text: "Some thoughts just need saying, not fixing. No advice, no algorithm — just space.",
  },
];

const FEATURES = [
  {
    num: "01",
    heading: "Write it down",
    headingClass: "featureHeading1",
    text: "Start a new thought whenever something's rattling around your head. No blank-page pressure — just start typing.",
    label: "New Thought",
  },
  {
    num: "02",
    heading: "Talk it through",
    headingClass: "featureHeading2",
    text: "Respond to yourself, ask the follow-up question, and think out loud in a conversation with your own thought — never an AI.",
    label: "Thought Thread",
    reversed: true,
  },
  {
    num: "03",
    heading: "File it away",
    headingClass: "featureHeading3",
    text: "Sort thoughts into folders as you go, so nothing gets lost in an endless scroll of half-finished ideas.",
    label: "Folders",
  },
  {
    num: "04",
    heading: "Look back",
    headingClass: "featureHeading4",
    text: "Revisit old thoughts whenever you want and see how your thinking — and you — have changed.",
    label: "Thought History",
    reversed: true,
  },
];


function PlaceholderPanel({ label }) {
  return (
    <div className="placeholderPanel">
      <span className="placeholderLabel">{label}</span>
    </div>
  );
}

function Home() {
  const rootRef = useRef(null);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  useEffect(() => {
    const targets = rootRef.current.querySelectorAll("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("isRevealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="homeRoot" ref={rootRef}>
      <Header />
      {/* HERO */}
      <section className="heroSection">
        <div className="heroImageWrap">
          <img src={heroImg} alt="" className="heroImage" />
        </div>
        <div className="heroInner">
          <div className="heroTextCol flex flex-col items-center justify-center gap-6 w-100">
            <p className="heroKicker">organize your thoughts, your way</p>
            <h1 className="heroTitle">
              No AI here,
              <br />
              <span className="heroTitleAccent">and there never will be.</span>
            </h1>
            <p className="heroSubtitle">
              PonderFox is an app that helps you talk things out with yourself. Create a thought and chat with it as if you were thinking.
            </p>
            <div className="heroActions">
              <Link to="/register" className="heroCtaBtn">
                Get Started
                <span className="heroCtaArrow"><i className="fa-solid fa-arrow-right"></i></span>
              </Link>
              <Link to="/about" className="heroCtaGhost">Learn More</Link>
            </div>
          </div>
        </div>

      </section>

      {/* PRODUCT VISUAL / ABOUT */}
      <section className="productVisualSection" data-reveal>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p className="sectionKicker">what it is</p>
          <h2 className="sectionTitle" style={{ margin: "0 auto" }}>
            A place to think out loud, on your own terms
          </h2>
        </div>
        <div className="productVisualCard">
          <PlaceholderPanel label="App Screenshot" />
        </div>
                <div class="custom-shape-divider-bottom-1786486476">
            <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" class="shape-fill"></path>
                <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" class="shape-fill"></path>
                <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" class="shape-fill"></path>
            </svg>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="whoSection" data-reveal>
        <div className="whoInner">
          <p className="sectionKicker">who it's for</p>
          <h2 className="sectionTitle">You don't need a diagnosis to need to think</h2>
          <div className="whoGrid">
            {WHO_CARDS.map((card) => (
              <div className="whoCard" key={card.title}>
                <div className={`whoIcon ${card.icon}`}></div>
                <h3 className="whoCardTitle">{card.title}</h3>
                <p className="whoCardText">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MID CTA */}
      <section className="midCtaSection" data-reveal>
        <div className="custom-shape-divider-top-1786485915">
          <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M1200 120L0 16.48 0 0 1200 0 1200 120z" className="shape-fill"></path>
          </svg>
        </div>
        <div className="midCtaBox">
          <div>
            <h3 className="midCtaTitle">Ready to think it through?</h3>
            <p className="midCtaSubtitle">Your first thought is free — no card required.</p>
          </div>
          <Link to="/register" className="midCtaBtn">Start a Thought</Link>
        </div>
        <div class="custom-shape-divider-bottom-1786486393">
            <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M1200 120L0 16.48 0 0 1200 0 1200 120z" class="shape-fill"></path>
            </svg>
        </div>
      </section>

      {/* FEATURES */}
      <section className="featuresSection" data-reveal>
        <div className="featureSectionHead">
          <p className="sectionKicker featuresKicker">how it works, in detail</p>
          <h2 className="sectionTitle featuresTitle">Everything you need, nothing you don't</h2>
        </div>
        <div className="featureList">
          {FEATURES.map((feature) => (
            <div className="featureRow" key={feature.num}>
              <div className={feature.reversed ? "featureVisual featureVisualReversed" : "featureVisual"}>
                <PlaceholderPanel label={feature.label} />
              </div>
              <div className={feature.reversed ? "featureTextReversed" : ""}>
                <p className="featureNum">{feature.num}</p>
                <h3 className={`featureHeading ${feature.headingClass}`}>{feature.heading}</h3>
                <p className="featureText">{feature.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* GALLERY */}
      <section className="gallerySection" data-reveal>
        <p className="sectionKicker" style={{ textAlign: "center" }}>see it in action</p>
        <h2 className="sectionTitle" style={{ margin: "0 auto 56px", textAlign: "center", maxWidth: "100%" }}>
          A closer look at PonderFox
        </h2>
        <div className="galleryGrid">
          <div className="galleryItem"><PlaceholderPanel label="Home View" /></div>
          <div className="galleryItem"><PlaceholderPanel label="Thought View" /></div>
          <div className="galleryItem"><PlaceholderPanel label="Folder View" /></div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricingSection" data-reveal>
        <div className="pricingInner">
          <p className="sectionKicker pricingKicker">pricing</p>
          <h2 className="sectionTitle pricingTitle">Simple plans, no surprises</h2>
          <p className="pricingSubtitle">Start free. Upgrade whenever you're ready for more room to think.</p>
          <div className="pricingGrid">
            {PRICING_TIERS.map((tier) => (
              <div className={tier.featured ? "pricingCard pricingCardFeatured" : "pricingCard"} key={tier.title}>
                {tier.featured && <span className="featuredBadge">Most Popular</span>}
                <h3 className="pricingCardTitle">{tier.title}</h3>
                <p className="pricingPrice">
                  {tier.price}<span className="pricingPriceUnit">{tier.unit}</span>
                </p>
                <p className="pricingBlurb">{tier.blurb}</p>
                <Link
                  to="/register"
                  className={tier.filled ? "pricingCta pricingCtaFilled" : "pricingCta"}
                >
                  Choose {tier.title}
                </Link>
                <ul className="pricingFeatureList">
                  {tier.features.map((feature) => (
                    <li className="pricingFeatureItem" key={feature}>
                      <span className="pricingCheckDot"><i className="fa-solid fa-check"></i></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="finalCtaSection" data-reveal>
        <div className="finalCtaInner">
          <p className="sectionKicker finalCtaKicker">no ai, ever</p>
          <h2 className="finalCtaTitle">Your thoughts deserve somewhere to go.</h2>
          <Link to="/register" className="finalCtaBtn">Get Started Free</Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Home;
