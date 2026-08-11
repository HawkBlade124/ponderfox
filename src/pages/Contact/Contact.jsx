import { useState } from "react";
import { buildApiUrl } from "../../utils/api.js";
import "../../css/Contact.css";

const STATUS_IDLE = "idle";
const STATUS_SUBMITTING = "submitting";
const STATUS_SUCCESS = "success";
const STATUS_ERROR = "error";

function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — real visitors never fill this in
  const [status, setStatus] = useState(STATUS_IDLE);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(STATUS_SUBMITTING);
    setErrorMessage("");

    try {
      const res = await fetch(`${buildApiUrl()}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim(), website }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || data.details || "Something went wrong. Please try again.");
        setStatus(STATUS_ERROR);
        return;
      }

      setStatus(STATUS_SUCCESS);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      console.error("Contact form error:", err);
      setErrorMessage("Couldn't reach the server. Please try again.");
      setStatus(STATUS_ERROR);
    }
  };

  return (
    <div className="contactRoot">
      <section className="contactHero">
        <div className="contactHeroBlob contactHeroBlobTopRight"></div>
        <div className="contactHeroBlob contactHeroBlobBottomLeft"></div>
        <div className="contactHeroInner">
          <p className="contactKicker">get in touch</p>
          <h1 className="contactHeroTitle">Have a thought about PonderFox?</h1>
          <p className="contactHeroSubtitle">
            Questions, feedback, bug reports — send it over and we'll get back to you.
          </p>
        </div>
      </section>

      <section className="contactFormSection">
        <div className="contactFormCard">
          <form onSubmit={handleSubmit}>
            <div className="contactFieldGroup">
              <label htmlFor="contact-name" className="contactLabel">Name</label>
              <input
                id="contact-name"
                type="text"
                className="contactInput"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>

            <div className="contactFieldGroup">
              <label htmlFor="contact-email" className="contactLabel">Email</label>
              <input
                id="contact-email"
                type="email"
                className="contactInput"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="contactFieldGroup">
              <label htmlFor="contact-message" className="contactLabel">Message</label>
              <textarea
                id="contact-message"
                className="contactTextarea"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                required
              />
            </div>

            <div className="contactHoneypot" aria-hidden="true">
              <label htmlFor="contact-website">Website</label>
              <input
                id="contact-website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <button type="submit" className="contactSubmitBtn" disabled={status === STATUS_SUBMITTING}>
              {status === STATUS_SUBMITTING ? "Sending..." : "Send Message"}
            </button>

            {status === STATUS_SUCCESS && (
              <p className="contactStatus contactStatusSuccess">
                Thanks — your message is on its way. We'll reply as soon as we can.
              </p>
            )}
            {status === STATUS_ERROR && (
              <p className="contactStatus contactStatusError">{errorMessage}</p>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}

export default Contact;
