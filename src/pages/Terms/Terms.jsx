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

function Terms() {
  return (
    <div className="legalRoot">
      <p className="legalKicker">terms of use</p>
      <h1 className="legalTitle">The short version, in full.</h1>
      <p className="legalUpdated">Last updated: August 24, 2026</p>

      <p className="legalIntro">
        These terms cover the basics of using PonderFox. By creating an account, you agree to them. We&apos;ve kept them as plain and short as we reasonably can — if anything is unclear, <Link to="/contact">reach out</Link>.
      </p>

      <Section number="1" title="Your account">
        <p>
          You need an account to use PonderFox. You&apos;re responsible for keeping your login credentials secure and for anything that happens under your account. Give us accurate information when you sign up, and let us know if you think your account has been compromised.
        </p>
      </Section>

      <Section number="2" title="Your content">
        <p>
          Everything you write in PonderFox — your thoughts, messages, and anything you upload — belongs to you. We don&apos;t claim ownership of it. We store it and display it back to you so you can use the service; that&apos;s the extent of our involvement with it.
        </p>
        <p>
          You&apos;re responsible for what you post. Don&apos;t upload anything illegal, anything you don&apos;t have the right to share, or anything intended to harm someone else.
        </p>
      </Section>

      <Section number="3" title="Plans & billing">
        <p>
          PonderFox offers a free plan and paid plans (Thinker and Deep Thinker) with additional folders and history. Paid plans are billed on a recurring basis through Stripe.
        </p>
        <ul>
          <li>You can cancel a paid subscription anytime from Settings — it takes effect at the end of your current billing period, with no cancellation fee.</li>
          <li>Downgrading or canceling doesn&apos;t delete your existing thoughts. You&apos;ll just be limited by your new plan&apos;s folder count and history window going forward.</li>
          <li>Payments are generally non-refundable, except where required by law.</li>
        </ul>
      </Section>

      <Section number="4" title="Acceptable use">
        <p>You agree not to:</p>
        <ul>
          <li>Use PonderFox for anything illegal or to violate anyone else&apos;s rights.</li>
          <li>Try to break, disrupt, or gain unauthorized access to the service or other users&apos; accounts.</li>
          <li>Use automated tools to scrape, spam, or abuse the service.</li>
          <li>Impersonate another person or misrepresent your affiliation with anyone.</li>
        </ul>
      </Section>

      <Section number="5" title="Suspension & termination">
        <p>
          You can delete your own account anytime from Settings. We may suspend or terminate accounts that violate these terms or put the service or other users at risk. Where reasonably possible, we&apos;ll let you know why.
        </p>
      </Section>

      <Section number="6" title="The service, as-is">
        <p>
          We work to keep PonderFox reliable, but we provide it "as is," without warranties of any kind. We don&apos;t guarantee the service will be uninterrupted, error-free, or available at all times.
        </p>
      </Section>

      <Section number="7" title="Limitation of liability">
        <p>
          To the extent permitted by law, PonderFox and its operators aren&apos;t liable for indirect, incidental, or consequential damages arising from your use of the service. Our total liability for any claim relating to PonderFox is limited to the amount you paid us in the twelve months before the claim arose.
        </p>
      </Section>

      <Section number="8" title="Changes to these terms">
        <p>
          We may update these terms occasionally. If we make a meaningful change, we&apos;ll update the date at the top of this page. Continuing to use PonderFox after a change means you accept the updated terms.
        </p>
      </Section>

      <div className="legalContactBox">
        <p>Questions about these terms? We&apos;re happy to talk it through.</p>
        <Link to="/contact" className="legalContactBtn">
          <i className="fa-regular fa-envelope"></i> Contact Us
        </Link>
      </div>
      <p className="legalCrossLink">
        See also our <Link to="/privacy">Privacy Policy</Link>.
      </p>
    </div>
  );
}

export default Terms;
