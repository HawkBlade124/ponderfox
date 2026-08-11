import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import heroImg from "../../assets/hero.jpg";
import { PRICING_TIERS } from "../../data/pricing";
import "../../css/Home.css";

const FOLDERS = [
  { name: "Career", count: 4 },
  { name: "Relationships", count: 7 },
  { name: "Late Night Spirals", count: 12 },
  { name: "Big Decisions", count: 3 },
];

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

const HOW_STEPS = [
  {
    num: "1",
    numClass: "howStepNum1",
    title: "Create a free account",
    text: "Sign up in under a minute. No credit card, no setup.",
  },
  {
    num: "2",
    numClass: "howStepNum2",
    title: "Start a thought",
    text: "Write down whatever's on your mind — a decision, a worry, a half-formed idea.",
  },
  {
    num: "3",
    numClass: "howStepNum3",
    title: "Talk & file it",
    text: "Respond to yourself, work through it, then file it into a folder so you can find it again.",
  },
];

const FAQS = [
  {
    q: "Is there really no AI involved?",
    a: "None. PonderFox doesn't generate responses, give advice, or analyze your thoughts. Every reply is written by you — the app just gives your own thinking a place to unfold.",
  },
  {
    q: "Is my data private?",
    a: "Your thoughts are yours. We don't sell data, and we don't feed your entries into any model, ours or anyone else's.",
  },
  {
    q: "Can I export my thoughts?",
    a: "Yes — Pro and Lifetime plans let you export any thought or folder whenever you want.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. The Free plan gives you unlimited thoughts, three folders, and 30 days of history — no credit card required.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Anytime, no questions asked. Your existing thoughts stay yours to export even after you cancel.",
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
  const [thoughtText, setThoughtText] = useState("");
  const [selectedFolder, setSelectedFolder] = useState(FOLDERS[0].name);
  const [filed, setFiled] = useState(false);
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

  const handleFileThought = () => {
    if (!thoughtText.trim()) return;
    setFiled(true);
    setThoughtText("");
    setTimeout(() => setFiled(false), 3000);
  };

  return (
    <div className="homeRoot" ref={rootRef}>
      <Header />
      {/* HERO */}
      <section className="heroSection">
        <div className="heroImageWrap">
          <img src={heroImg} alt="" className="heroImage" />
          <div className="heroImageFade"></div>
        </div>
        <div className="heroBlob heroBlobTopRight"></div>
        <div className="heroBlob heroBlobBottomLeft"></div>
        <div className="heroBlob heroBlobCenter"></div>

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
        <div className="productVisualGlow"></div>
        <div className="productVisualCard">
          <PlaceholderPanel label="App Screenshot" />
        </div>
      </section>

      {/* TRY IT */}
      <section className="tryItSection" data-reveal>
        <p className="sectionKicker" style={{ textAlign: "center" }}>try it yourself</p>
        <h2 className="sectionTitle" style={{ margin: "0 auto 40px", textAlign: "center", maxWidth: "100%" }}>
          Write a thought, file it away
        </h2>
        <div className="tryItCard">
          <textarea
            className="tryItTextarea"
            rows={4}
            placeholder="What's on your mind?"
            value={thoughtText}
            onChange={(e) => setThoughtText(e.target.value)}
          />
          <div className="tryItFooter">
            <div className="folderChips">
              {FOLDERS.map((folder) => {
                const isActive = selectedFolder === folder.name;
                return (
                  <div
                    key={folder.name}
                    className="folderChip"
                    onClick={() => setSelectedFolder(folder.name)}
                    style={{
                      background: isActive ? "#0466c8" : "#001233",
                      color: isActive ? "#001d24" : "#c7d3e0",
                      border: isActive ? "1px solid #0466c8" : "1px solid #33415c",
                    }}
                  >
                    {folder.name}
                    <span className="folderChipCount">{folder.count}</span>
                  </div>
                );
              })}
            </div>
            <button className="fileBtn" onClick={handleFileThought}>File it</button>
          </div>
          {filed && <p className="filedNote">Filed under "{selectedFolder}" — this is just a preview, sign up to save it for real.</p>}
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
        <div className="midCtaBox">
          <div className="midCtaGlow"></div>
          <div>
            <h3 className="midCtaTitle">Ready to think it through?</h3>
            <p className="midCtaSubtitle">Your first thought is free — no card required.</p>
          </div>
          <Link to="/register" className="midCtaBtn">Start a Thought</Link>
        </div>
      </section>

      {/* FEATURES */}
      <section className="featuresSection" data-reveal>
        <p className="sectionKicker featuresKicker">how it works, in detail</p>
        <h2 className="sectionTitle featuresTitle">Everything you need, nothing you don't</h2>
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

      {/* HOW IT WORKS TIMELINE */}
      <section className="howSection" data-reveal>
        <div className="howInner">
          <h2 className="sectionTitle howTitle">Three steps, no learning curve</h2>
          <div className="howTimeline">
            {HOW_STEPS.map((step) => (
              <div className="howStep" key={step.num}>
                <div className={`howStepNum ${step.numClass}`}>{step.num}</div>
                <div className="howStepBody">
                  <h3 className="howStepTitle">{step.title}</h3>
                  <p className="howStepText">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="/register" className="howStepCta">
            Get Started
            <i className="fa-solid fa-arrow-right"></i>
          </Link>
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
        <div className="pricingGlow"></div>
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

      {/* FAQ */}
      <section className="faqSection" data-reveal>
        <h2 className="sectionTitle faqTitle">Questions, answered</h2>
        <div className="faqList">
          {FAQS.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div className="faqItem" key={faq.q}>
                <button
                  className="faqButton"
                  onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                >
                  {faq.q}
                  <span className="faqPlus" style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
                </button>
                {isOpen && <p className="faqAnswer">{faq.a}</p>}
              </div>
            );
          })}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="finalCtaSection" data-reveal>
        <div className="finalCtaGlow"></div>
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
