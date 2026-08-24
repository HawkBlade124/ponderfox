import { Link } from "react-router-dom";
import "../../css/Legal.css";

function Section({ number, title, children }) {
  return (
    <section className="legalSection">
      <h2 className="legalSectionTitle">
        <span className="legalSectionNumber">{number}</span> {title}
      </h2>
      {children}
    </section>
  );
}

function Privacy() {
  return (
    <div className="legalRoot">
      <p className="legalKicker">privacy policy</p>
      <h1 className="legalTitle">Your thoughts are yours.</h1>
      <p className="legalUpdated">Last updated: August 24, 2026</p>

      <p className="legalIntro">
        This policy explains what information PonderFox collects, why, and what we do (and don&apos;t do) with it. We&apos;ve tried to write it the way we&apos;d want to read it — plainly, and without hiding anything in fine print. If something here isn&apos;t clear, <Link to="/contact">ask us</Link>.
      </p>

      <Section number="1" title="What we collect">
        <p>To run your account, we collect:</p>
        <ul>
          <li><strong>Account info</strong> — your name, username, email address, and a securely hashed password (we never store your password in plain text).</li>
          <li><strong>Your content</strong> — the thoughts, messages, categories, tags, lists, mood boards, goals, and timers you create. This is yours; we just store it so you can get it back.</li>
          <li><strong>Files you upload</strong> — any images or attachments you add to a thought.</li>
          <li><strong>Billing info</strong> — if you subscribe to a paid plan, our payment processor (Stripe) handles your card details directly. We never see or store your full card number.</li>
          <li><strong>Basic account activity</strong> — things like login timestamps and session tokens, used only to keep your account secure and working.</li>
        </ul>
      </Section>

      <Section number="2" title="What we don't do">
        <p>
          We don&apos;t run your thoughts through AI, machine learning, or any third-party language model — not to generate replies, not to "improve our product," not ever. What you write stays exactly between you and your account.
        </p>
        <p>
          We don&apos;t sell your data, and we don&apos;t use advertising trackers on this site.
        </p>
      </Section>

      <Section number="3" title="How we use your information">
        <p>We use what we collect only to:</p>
        <ul>
          <li>Store and display your thoughts back to you, the way you left them.</li>
          <li>Keep your account secure and let you log in.</li>
          <li>Process payments and manage your subscription, if you have one.</li>
          <li>Send account-related emails — password resets, receipts, and any reminder or digest emails you&apos;ve specifically turned on in Settings. We never send marketing email unless you&apos;ve opted in.</li>
          <li>Respond when you contact us with a question or bug report.</li>
        </ul>
      </Section>

      <Section number="4" title="Who we share it with">
        <p>
          We don&apos;t sell or rent your information to anyone. We share the minimum necessary with a small set of service providers who help us run PonderFox:
        </p>
        <ul>
          <li><strong>Stripe</strong>, to process payments for paid plans.</li>
          <li><strong>Our cloud storage provider</strong>, to store files you upload as attachments.</li>
          <li><strong>Our email provider</strong>, to deliver account and reminder emails.</li>
        </ul>
        <p>
          Each of these providers only receives what they need to do their specific job, and none of them are permitted to use your data for their own purposes. We may also disclose information if required by law.
        </p>
      </Section>

      <Section number="5" title="How we protect your data">
        <p>
          Passwords are hashed, not stored in readable form. Access to the database and file storage is restricted. That said, no online service can guarantee perfect security — if we ever become aware of a breach affecting your data, we&apos;ll let you know.
        </p>
      </Section>

      <Section number="6" title="Cookies & local storage">
        <p>
          We use your browser&apos;s local storage to keep you signed in and remember display preferences (like grid or list view). We don&apos;t use third-party advertising or tracking cookies.
        </p>
      </Section>

      <Section number="7" title="Your choices">
        <ul>
          <li><strong>Edit or delete your content</strong> anytime from within the app.</li>
          <li><strong>Turn email preferences on or off</strong> — newsletter, reminders, and digest emails are all opt-in and controlled from Settings.</li>
          <li><strong>Cancel your subscription</strong> anytime from Settings — no phone calls, no retention pitch.</li>
          <li><strong>Delete your account</strong> anytime from Settings. This permanently removes your account and content from our systems.</li>
        </ul>
      </Section>

      <Section number="8" title="Children's privacy">
        <p>
          PonderFox isn&apos;t directed at children under 13, and we don&apos;t knowingly collect information from anyone under that age.
        </p>
      </Section>

      <Section number="9" title="Changes to this policy">
        <p>
          If we change this policy in a meaningful way, we&apos;ll update the date at the top of this page. Continuing to use PonderFox after a change means you accept the update.
        </p>
      </Section>

      <div className="legalContactBox">
        <p>Questions about your data? We&apos;re happy to answer them.</p>
        <Link to="/contact" className="legalContactBtn">
          <i className="fa-regular fa-envelope"></i> Contact Us
        </Link>
      </div>
      <p className="legalCrossLink">
        See also our <Link to="/terms">Terms of Use</Link>.
      </p>
    </div>
  );
}

export default Privacy;
