import { Link } from "react-router-dom";
import "../../css/About.css";

const PRINCIPLES = [
  {
    icon: "aboutPrincipleIconSquare",
    title: "No AI, ever",
    text: "We will never route your thoughts through a language model. Every word on the page is written by you, for you.",
  },
  {
    icon: "aboutPrincipleIconCircle",
    title: "Private by default",
    text: "Your thoughts aren't training data. We don't sell it, scan it, or share it — full stop.",
  },
  {
    icon: "aboutPrincipleIconDiamond",
    title: "Your pace, not a streak",
    text: "No streaks to protect and no notifications guilting you back. Come back when you have something to think through.",
  },
  {
    icon: "aboutPrincipleIconRounded",
    title: "Built to last",
    text: "Thoughts stay organized in folders, so you can revisit them months or years later and see how you've changed.",
  },
];

function About() {
  return (
    <div className="aboutRoot">
      <section className="aboutHero">
        <div className="aboutHeroBlob aboutHeroBlobTopRight"></div>
        <div className="aboutHeroBlob aboutHeroBlobBottomLeft"></div>
        <div className="aboutHeroInner">
          <p className="aboutKicker">why we're here</p>
          <h1 className="aboutHeroTitle">Not every thought needs an answer. Some just need room.</h1>
          <p className="aboutHeroSubtitle">
            PonderFox started from a simple frustration: journaling apps assume you'll write once and move on, and AI apps assume you want a machine's opinion. We wanted neither.
          </p>
        </div>
      </section>

      <section className="aboutMissionSection">
        <p className="aboutMissionText">
          Most nights, the thoughts that keep you up aren't complicated — they're just unfinished. A conversation you keep replaying. A decision you can't quite make. The instinct to talk it out, with no one around to talk to.
        </p>
        <p className="aboutMissionText">
          PonderFox is built for that moment. You write down what's on your mind, then respond to yourself — ask the follow-up question, push back, work it out loud. <strong>No one grades it, and no algorithm summarizes it.</strong> It's just you, thinking in writing.
        </p>
        <p className="aboutMissionText">
          That's the whole idea. Not a smarter assistant — just a quieter place to think.
        </p>
      </section>

      <section className="aboutPrinciplesSection">
        <div className="aboutPrinciplesInner">
          <p className="aboutSectionKicker">how we build</p>
          <h2 className="aboutSectionTitle">A few things we won't compromise on</h2>
          <div className="aboutPrinciplesGrid">
            {PRINCIPLES.map((principle) => (
              <div className="aboutPrincipleCard" key={principle.title}>
                <div className={`aboutPrincipleIcon ${principle.icon}`}></div>
                <h3 className="aboutPrincipleTitle">{principle.title}</h3>
                <p className="aboutPrincipleText">{principle.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="aboutCtaSection">
        <div className="aboutCtaGlow"></div>
        <div className="aboutCtaInner">
          <h2 className="aboutCtaTitle">Ready to think it through?</h2>
          <Link to="/register" className="aboutCtaBtn">Get Started Free</Link>
        </div>
      </section>
    </div>
  );
}

export default About;
