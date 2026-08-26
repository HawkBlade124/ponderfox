import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import heroImg from "../../assets/hero.jpg";
import { PRICING_TIERS } from "../../data/pricing";
import { useCheckout } from "../../hooks/useCheckout.js";
import "../../css/Home.css";

const EVERYDAY_MOMENTS = [
  {
    icon: "fa-regular fa-arrows-rotate",
    title: "When it won't stop replaying",
    text: "You replay the same conversation five times before bed. Give it somewhere to go instead.",
  },
  {
    icon: "fa-regular fa-scale-balanced",
    title: "When you're weighing something big",
    text: "Talk it out loud, on the page, before you commit to anything.",
  },
  {
    icon: "fa-regular fa-book",
    title: "When you're already writing it down",
    text: "PonderFox gives your entries somewhere to go next.",
  },
];

const WHAT_IT_IS_ITEMS = [
  {
    title: "Write it down",
    text: "Start a thought whenever something's on your mind. No blank page, no sign-up flow to fight through first.",
    points: ["No prompts to follow", "No blank-page pressure", "Just start typing"],
  },
  {
    title: "Talk it through",
    text: "Respond to yourself and ask the follow-up question. It's a conversation with your own thought, never anything else.",
    points: ["Every reply is entirely your own", "No suggestions, no autocomplete", "Just your thinking, worked out loud"],
  },
  {
    title: "File it away",
    text: "Sort thoughts into folders as you go, so nothing gets lost in an endless scroll of half-finished ideas.",
    points: ["Drag any thought into a folder", "Search across everything you've written", "Nothing buried, nothing forgotten"],
  },
  {
    title: "Look back",
    text: "Revisit old thoughts whenever you want and see how your thinking, and you, have changed.",
    points: ["Your full history, always there", "Revisit reminders if you want them", "Watch your own thinking evolve"],
  },
];

function Home() {
  const rootRef = useRef(null);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [openWhatItIsIndex, setOpenWhatItIsIndex] = useState(1);
  const { startCheckout, loadingPlan } = useCheckout();

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
          <div className="heroImageScrim"></div>
        </div>
        <div className="heroInner">
          <div className="heroTextCol flex flex-col items-center justify-center gap-6 w-100">
            <h1 className="heroTitle">
              Your thoughts have a lot to say.
              <br />
              <span className="heroTitleAccent">Give them somewhere to go.</span>
            </h1>
            <div className="heroActions">
              <Link to="/register" className="heroCtaBtn">
                Get Started
                <span className="heroCtaArrow"><i className="fa-solid fa-arrow-right"></i></span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT VISUAL / ABOUT */}
      <section className="productVisualSection" data-reveal>
        <div className="whatItIsHead">
          <p className="sectionKicker">what it is</p>
          <h2 className="sectionTitle" style={{ margin: "0 auto 20px" }}>
            A place to think out loud, on your own terms
          </h2>
          <p className="whatItIsSubtitle">
            Every thought gets its own space. Write it, talk it through, and come back to it whenever you want.
          </p>
        </div>

        <div className="whatItIsGrid">
          <div className="whatItIsAccordion">
            {WHAT_IT_IS_ITEMS.map((item, index) => {
              const isOpen = openWhatItIsIndex === index;
              return (
                <div className={`whatItIsRow ${isOpen ? "whatItIsRowOpen" : ""}`} key={item.title}>
                  <button
                    type="button"
                    className="whatItIsRowHead"
                    onClick={() => setOpenWhatItIsIndex(isOpen ? -1 : index)}
                    aria-expanded={isOpen}
                  >
                    <span className="whatItIsRowTitle">{item.title}</span>
                    <span className="whatItIsRowIcon">
                      <i className={isOpen ? "fa-solid fa-xmark" : "fa-solid fa-plus"}></i>
                    </span>
                  </button>
                  {isOpen && (
                    <div className="whatItIsRowBody">
                      <p className="whatItIsRowText">{item.text}</p>
                      <ul className="whatItIsRowPoints">
                        {item.points.map((point) => (
                          <li key={point}>
                            <i className="fa-solid fa-check"></i> {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="whatItIsVisual">
            <div className="whatItIsVisualTabs">
              <span className="whatItIsTab whatItIsTabActive">Thought</span>
              <span className="whatItIsTab">Folders</span>
              <span className="whatItIsTab">History</span>
            </div>
            <div className="whatItIsVisualBody">
              <div className="whatItIsBubble whatItIsBubbleSelf">
                <span className="whatItIsBubbleLine" style={{ width: "88%" }}></span>
                <span className="whatItIsBubbleLine" style={{ width: "62%" }}></span>
              </div>
              <div className="whatItIsBubble whatItIsBubbleReply">
                <span className="whatItIsBubbleLine" style={{ width: "70%" }}></span>
                <span className="whatItIsBubbleLine" style={{ width: "94%" }}></span>
                <span className="whatItIsBubbleLine" style={{ width: "40%" }}></span>
              </div>
              <div className="whatItIsBubble whatItIsBubbleSelf">
                <span className="whatItIsBubbleLine" style={{ width: "55%" }}></span>
              </div>
            </div>
          </div>
        </div>

                <div class="custom-shape-divider-bottom-1786486476">
            <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" class="shape-fill"></path>
                <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" class="shape-fill"></path>
                <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" class="shape-fill"></path>
            </svg>
        </div>
      </section>

      {/* FOR EVERYONE */}
      <section className="whoSection" data-reveal>
        <div className="whoInner">
          <div className="whoGrid">
            <div className="whoTextCol">
              <p className="sectionKicker">for everyone</p>
              <h2 className="sectionTitle" style={{ margin: "0 0 20px" }}>Made for however your mind works</h2>
              <p className="whoSubtitle">
                Whatever's on your mind and however it shows up, there's space for it here.
              </p>
              <Link to="/register" className="whoCtaBtn">Get Started</Link>

              <div className="whoList">
                {EVERYDAY_MOMENTS.map((item) => (
                  <div className="whoListRow" key={item.title}>
                    <div className="whoListIcon"><i className={item.icon}></i></div>
                    <div>
                      <h3 className="whoListTitle">{item.title}</h3>
                      <p className="whoListText">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="whoVisual">
              <div className="whoVisualGlowBlue"></div>
              <div className="whoVisualGlowGray"></div>
              <div className="whoVisualLabel">Thought Thread</div>
              <div className="whoVisualBody">
                <div className="whoBubble whoBubbleSelf">I keep replaying that conversation with my manager.</div>
                <div className="whoBubble whoBubbleReply">What part keeps coming back?</div>
                <div className="whoBubble whoBubbleSelf">The part where I didn't say what I meant.</div>
                <div className="whoTypingIndicator"><span></span><span></span><span></span></div>
              </div>
              <div className="whoVisualInput">
                <span>What would you say now?</span>
                <span className="whoVisualSendBtn"><i className="fa-solid fa-arrow-up"></i></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="featuresSection" data-reveal>
        <div className="featureSectionHead">
          <p className="sectionKicker featuresKicker" style={{ textAlign: "center" }}>how it works</p>
          <h2 className="sectionTitle featuresTitle" style={{ margin: "0 auto 16px", textAlign: "center", maxWidth: "100%" }}>
            Three steps, and you're already thinking out loud
          </h2>
          <p className="howItWorksSubtitle">No download, no setup. Just open a thought and start typing, from your phone or your laptop.</p>
        </div>

        <div className="howItWorksGrid">
          <div className="howItWorksCard">
            <div className="howItWorksMock">
              <div className="howItWorksMockHead">
                <span>New Thought</span>
                <span className="howItWorksMockDot"></span>
              </div>
              <div className="howItWorksMockBody">
                <span className="whatItIsBubbleLine" style={{ width: "92%" }}></span>
                <span className="whatItIsBubbleLine" style={{ width: "78%" }}></span>
                <span className="whatItIsBubbleLine" style={{ width: "85%" }}></span>
                <span className="whatItIsBubbleLine" style={{ width: "48%" }}></span>
              </div>
            </div>
            <span className="howItWorksStepBadge">STEP 01</span>
            <h3 className="howItWorksCardTitle">Start a thought</h3>
            <p className="howItWorksCardText">Write down whatever's on your mind. No blank-page pressure, no prompts to follow.</p>
          </div>

          <div className="howItWorksCard">
            <div className="howItWorksMock howItWorksMockChat">
              <div className="whatItIsBubble whatItIsBubbleSelf">
                <span className="whatItIsBubbleLine" style={{ width: "80%" }}></span>
                <span className="whatItIsBubbleLine" style={{ width: "55%" }}></span>
              </div>
              <div className="whatItIsBubble whatItIsBubbleReply">
                <span className="whatItIsBubbleLine" style={{ width: "70%" }}></span>
              </div>
              <div className="whatItIsBubble whatItIsBubbleSelf">
                <span className="whatItIsBubbleLine" style={{ width: "60%" }}></span>
              </div>
            </div>
            <span className="howItWorksStepBadge">STEP 02</span>
            <h3 className="howItWorksCardTitle">Talk it through</h3>
            <p className="howItWorksCardText">Respond to yourself and ask the follow-up question. It's a conversation with your own thought, never anything else.</p>
          </div>

          <div className="howItWorksCard">
            <div className="howItWorksMock">
              <div className="howItWorksMockList">
                <div className="howItWorksMockListRow">
                  <span className="howItWorksMockListIcon"><i className="fa-regular fa-folder"></i></span>
                  <div className="howItWorksMockListLines">
                    <span className="whatItIsBubbleLine" style={{ width: "75%" }}></span>
                    <span className="whatItIsBubbleLine" style={{ width: "40%" }}></span>
                  </div>
                </div>
                <div className="howItWorksMockListRow">
                  <span className="howItWorksMockListIcon"><i className="fa-regular fa-folder"></i></span>
                  <div className="howItWorksMockListLines">
                    <span className="whatItIsBubbleLine" style={{ width: "60%" }}></span>
                    <span className="whatItIsBubbleLine" style={{ width: "35%" }}></span>
                  </div>
                </div>
                <div className="howItWorksMockListRow">
                  <span className="howItWorksMockListIcon"><i className="fa-regular fa-folder"></i></span>
                  <div className="howItWorksMockListLines">
                    <span className="whatItIsBubbleLine" style={{ width: "82%" }}></span>
                    <span className="whatItIsBubbleLine" style={{ width: "30%" }}></span>
                  </div>
                </div>
              </div>
            </div>
            <span className="howItWorksStepBadge">STEP 03</span>
            <h3 className="howItWorksCardTitle">Come back to it</h3>
            <p className="howItWorksCardText">File it away, then revisit it anytime and see how your thinking has changed.</p>
          </div>
        </div>

        <div className="howItWorksCtaWrap">
          <Link to="/register" className="howItWorksCta">
            Get Started <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
      </section>

      {/* SHOWCASE */}
      <section className="gallerySection" data-reveal>
        <p className="sectionKicker" style={{ textAlign: "center" }}>up close</p>
        <h2 className="sectionTitle" style={{ margin: "0 auto 72px", textAlign: "center", maxWidth: "100%" }}>
          What using PonderFox actually looks like
        </h2>

        <div className="showcaseRow">
          <div className="showcaseText">
            <h3 className="showcaseTitle">Every thought, sorted your way</h3>
            <p className="showcaseCopy">
              Drop a thought into a folder, tag it, pin it, or leave it exactly where it landed. Sort by mood, by project, by whatever makes sense to you today, and move things around anytime. Nothing is ever locked into place.
            </p>
          </div>
          <div className="showcaseFolderGrid">
            {[
              { icon: "fa-solid fa-heart", name: "Feelings" },
              { icon: "fa-solid fa-briefcase", name: "Work" },
              { icon: "fa-solid fa-users", name: "People" },
              { icon: "fa-solid fa-compass", name: "Big decisions" },
              { icon: "fa-solid fa-moon", name: "Late night" },
              { icon: "fa-solid fa-seedling", name: "Ideas" },
            ].map((folder) => (
              <div className="showcaseFolderTile" key={folder.name}>
                <span className="showcaseFolderIcon"><i className={folder.icon}></i></span>
                <span className="showcaseFolderName">{folder.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="showcaseRow showcaseRowReversed">
          <div className="showcaseCompare">
            <div className="showcaseCompareCard">
              <span className="showcaseCompareLabel">2 weeks ago</span>
              <span className="whatItIsBubbleLine" style={{ width: "85%" }}></span>
              <span className="whatItIsBubbleLine" style={{ width: "60%" }}></span>
            </div>
            <span className="showcaseCompareArrow"><i className="fa-solid fa-arrow-right"></i></span>
            <div className="showcaseCompareCard showcaseCompareCardAfter">
              <span className="showcaseCompareLabel">Today</span>
              <span className="whatItIsBubbleLine" style={{ width: "90%" }}></span>
              <span className="whatItIsBubbleLine" style={{ width: "70%" }}></span>
              <span className="whatItIsBubbleLine" style={{ width: "80%" }}></span>
              <span className="whatItIsBubbleLine" style={{ width: "45%" }}></span>
            </div>
          </div>
          <div className="showcaseText">
            <h3 className="showcaseTitle">Come back and add to it</h3>
            <p className="showcaseCopy">
              Nothing is final the moment you hit send. Reopen any thought and keep the conversation going. Revisit reminders nudge you back when one's gone quiet for a while.
            </p>
          </div>
        </div>

        <div className="showcaseHighlight">
          <div className="showcaseText">
            <h3 className="showcaseTitle">Nothing to set up first</h3>
            <p className="showcaseCopy">
              There's no calendar to book and no template to fill out. Open a new thought and start typing. It's saved the moment you stop.
            </p>
          </div>
          <div className="showcaseStatusCard">
            <div className="showcaseStatusHead">Today</div>
            <div className="showcaseStatusRow">
              <span className="showcaseStatusDot"><i className="fa-solid fa-pen"></i></span>
              <div>
                <span className="showcaseStatusTitle">Thought started</span>
                <span className="showcaseStatusTime">12:04 PM</span>
              </div>
            </div>
            <div className="showcaseStatusRow">
              <span className="showcaseStatusDot showcaseStatusDotDone"><i className="fa-solid fa-check"></i></span>
              <div>
                <span className="showcaseStatusTitle">Autosaved</span>
                <span className="showcaseStatusTime">Just now</span>
              </div>
            </div>
          </div>
        </div>

        <div className="showcaseRow showcaseRowReversed">
          <div className="showcaseVoice">
            <div className="showcaseVoiceMic"><i className="fa-solid fa-microphone"></i></div>
            <div className="showcaseVoiceWave">
              {[40, 70, 100, 55, 85, 35, 65, 90, 45].map((height, i) => (
                <span key={i} style={{ height: `${height}%`, animationDelay: `${i * 0.08}s` }}></span>
              ))}
            </div>
            <div className="showcaseVoiceText">
              <span className="whatItIsBubbleLine" style={{ width: "92%" }}></span>
              <span className="whatItIsBubbleLine" style={{ width: "68%" }}></span>
            </div>
          </div>
          <div className="showcaseText">
            <h3 className="showcaseTitle">Or just say it out loud</h3>
            <p className="showcaseCopy">
              Talk instead of type when your hands are busy or your thoughts move faster than you can write. Every word gets captured, ready to read back later.
            </p>
          </div>
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
                {tier.plan ? (
                  <button
                    type="button"
                    onClick={() => startCheckout(tier.plan)}
                    disabled={loadingPlan === tier.plan}
                    className={tier.filled ? "pricingCta pricingCtaFilled pricingCtaButton" : "pricingCta pricingCtaButton"}
                  >
                    {loadingPlan === tier.plan ? "Redirecting…" : `Choose ${tier.title}`}
                  </button>
                ) : (
                  <Link to="/register" className={tier.filled ? "pricingCta pricingCtaFilled" : "pricingCta"}>
                    Choose {tier.title}
                  </Link>
                )}
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
