import { Link } from "react-router-dom"
import PageShell, { Article, Bullets, Callout, Section } from "./pageShell"

const UPDATED = "16 September 2026"

const PrivacyPolicyPage = () => (
  <PageShell>
    <Article
      eyebrow="Legal"
      title="Privacy Policy"
      intro="What we collect, what we keep, who else sees it, and how to make us delete it."
      updated={UPDATED}
    >
      <Callout tone="amber" title="Read this part if you read nothing else">
        <p>
          Your offer letter is not stored. The PDF exists in memory for the length of one request
          and is then gone — it is never written to a disk or a database.
        </p>
        <p>
          But the <strong>text</strong> of it is sent to Google&apos;s Gemini API to be analysed,
          and the report we keep for you contains <strong>quotes from your letter</strong>,
          including salary figures. Sections 3 and 4 explain both in full.
        </p>
      </Callout>

      <Section title="1. Who we are">
        <p>
          TrueOffer.AI is an informational tool for people reading Indian employment offer
          letters. This policy covers the website and the analysis service.
        </p>
      </Section>

      <Section title="2. What we collect">
        <p>
          <strong>Your account.</strong> Your name and email address. If you sign in with a
          password we store a bcrypt hash of it, never the password itself. If you sign in with
          Google we store the account identifier Google gives us and your profile picture URL.
          We also record when the account was created and last used.
        </p>
        <p>
          <strong>Your offer letter.</strong> The file you upload, and the text we extract from
          it. What happens to each is different, and section 3 sets it out.
        </p>
        <p>
          <strong>Nothing else.</strong> No analytics, no advertising identifiers, no third-party
          trackers, no location data. We do not ask for your phone number, address or PAN, and
          you should not put them anywhere we can see them.
        </p>
      </Section>

      <Section title="3. What happens to your offer letter">
        <p>Step by step, when you press Analyse:</p>
        <Bullets
          items={[
            "The PDF is uploaded and held in the server’s memory. It is never written to disk and never saved to our database.",
            "We extract the text, page by page, so that findings can cite a page number.",
            "That text is sent to Google’s Gemini API, which performs the analysis and returns structured findings. See section 4.",
            "We check every quote the model returned actually appears in your document, and discard any that do not.",
            "We save the finished report. The PDF is released from memory as soon as the text has been extracted from it.",
          ]}
        />
        <p>
          So we do not have a copy of your offer letter. We do have the report, and the report
          quotes your letter.
        </p>
      </Section>

      <Section title="4. Google processes the text of your letter">
        <p>
          The analysis runs on Google&apos;s Gemini API. To produce your report, the text of your
          offer letter is sent to Google and processed on Google&apos;s infrastructure. We cannot
          analyse a document without doing this.
        </p>
        <Callout tone="amber" title="On our current access tier">
          <p>
            We use Google&apos;s free API tier. Under Google&apos;s terms for that tier, Google
            may use content submitted through the API to improve its products, and human
            reviewers may read it. Do not upload a document you would not want a third party to
            see.
          </p>
          <p>
            If you are not comfortable with this, do not upload your offer letter.
          </p>
        </Callout>
        <p>
          We do not use your document to train any model of our own, and we do not sell or share
          your data with anyone else.
        </p>
      </Section>

      <Section title="5. What the stored report contains">
        <p>For each analysis we keep:</p>
        <Bullets
          items={[
            "the file name and page count of the document you uploaded;",
            "the date and time of the analysis;",
            "the 38 findings — each with its status, the short value we extracted (for example a salary figure or a notice period), our plain-English explanation, and a verbatim quote from your letter with its page number;",
            "the summary counts and the suggested questions for HR.",
          ]}
        />
        <p>
          Those quotes are taken from your offer letter, so the report can contain your salary,
          your bond amount, your notice period and the name of your employer. Treat the report as
          you would treat the letter.
        </p>
      </Section>

      <Section title="6. Who can see a report">
        <p>
          Each report has a long, randomly generated identifier, and that identifier is the only
          thing protecting it. Anyone with the link can open it, including people you forward it
          to. Reports are not currently tied to your account, so there is no list of your past
          reports to browse — keep the link if you want to come back to one.
        </p>
      </Section>

      <Section title="7. How long we keep things">
        <p>
          <strong>Your account</strong> is kept until you ask us to delete it.
        </p>
        <p>
          <strong>Reports</strong> are kept until deleted. We can configure automatic deletion
          after a set number of days, and intend to; until then, ask us and we will delete a
          report for you.
        </p>
        <p>
          <strong>Your uploaded PDF</strong> is not kept at all, so there is nothing to delete.
        </p>
      </Section>

      <Section title="8. Storage and security">
        <p>
          Account data and reports are stored in MongoDB. Passwords are hashed with bcrypt.
          Sessions use a signed token held in your browser&apos;s local storage; clearing your
          browser data signs you out.
        </p>
        <p>
          We take reasonable measures to protect your data, but no internet service can promise
          perfect security. Please do not upload anything more sensitive than the offer letter
          itself.
        </p>
      </Section>

      <Section title="9. Cookies">
        <p>
          We do not use advertising or analytics cookies. We store one item in your browser: the
          token that keeps you signed in. It is not shared with anyone.
        </p>
      </Section>

      <Section title="10. Email">
        <p>
          We email you only when you ask us to — specifically, to reset your password. We do not
          send marketing email.
        </p>
      </Section>

      <Section title="11. Your choices">
        <Bullets
          items={[
            "Ask for a copy of the personal data we hold about you.",
            "Ask us to correct your name or email.",
            "Ask us to delete your account, or a specific report, or both.",
            "Simply not upload a document — the rest of the site works without one.",
          ]}
        />
        <p>
          Write to{" "}
          <a href="mailto:privacy@trueoffer.ai" className="font-medium text-[#0c6b4e] hover:underline">
            privacy@trueoffer.ai
          </a>{" "}
          and we will act on it.
        </p>
      </Section>

      <Section title="12. Children">
        <p>
          The service is intended for people old enough to be entering employment and is not
          directed at children.
        </p>
      </Section>

      <Section title="13. Changes to this policy">
        <p>
          If we change how your data is handled — particularly section 3 or 4 — we will say so
          plainly rather than quietly updating the date. The date at the top always reflects the
          current version.
        </p>
      </Section>

      <Section title="14. Contact">
        <p>
          Privacy questions go to{" "}
          <a href="mailto:privacy@trueoffer.ai" className="font-medium text-[#0c6b4e] hover:underline">
            privacy@trueoffer.ai
          </a>
          . Everything else is covered by the{" "}
          <Link to="/terms" className="font-medium text-[#0c6b4e] hover:underline">
            Terms of Service
          </Link>
          .
        </p>
      </Section>
    </Article>
  </PageShell>
)

export default PrivacyPolicyPage
