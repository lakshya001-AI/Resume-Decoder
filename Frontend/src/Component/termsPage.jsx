import { Link } from "react-router-dom"
import PageShell, { Article, Bullets, Callout, Section } from "./pageShell"

const UPDATED = "16 September 2026"

const TermsPage = () => (
  <PageShell>
    <Article
      eyebrow="Legal"
      title="Terms of Service"
      intro="The agreement between you and TrueOffer.AI. Written to be read, not to be skipped."
      updated={UPDATED}
    >
      <Callout tone="amber" title="The one thing to take away">
        <p>
          TrueOffer.AI explains what your offer letter says. It is not a lawyer and it does not
          give legal advice. For a decision that matters — a bond, a non-compete, a dispute with
          an employer — speak to a qualified advocate.
        </p>
      </Callout>

      <Section title="1. What this service does">
        <p>
          You upload an employment offer letter as a PDF. We read its text, check it against a
          fixed list of 38 clauses commonly found in Indian offer letters, and return a report
          that tells you what each clause says, quotes the words it is based on, and gives you
          the page number so you can check it yourself.
        </p>
        <p>
          The report is a reading aid. Every finding cites the sentence it came from precisely so
          that you do not have to take our word for it.
        </p>
      </Section>

      <Section title="2. This is not legal advice">
        <p>
          Nothing on this site creates a lawyer–client relationship. We do not tell you whether a
          clause is enforceable, whether you should sign, or what a court would decide. We
          describe what the document says and what it would mean in practice.
        </p>
        <p>
          Employment law in India varies by state, by industry and by the facts of your
          situation. A clause that is routine for one person may matter enormously to another.
          Only a qualified advocate can advise you on your own position.
        </p>
      </Section>

      <Section title="3. Accuracy, and its limits">
        <p>
          The analysis is produced by an automated language model. It is good, and we check its
          work — every quote in your report is verified to appear in the document you uploaded,
          and anything we cannot confirm is marked unconfirmed rather than presented as fact. But
          it is not perfect.
        </p>
        <Bullets
          items={[
            "It can miss a clause that is present, and report it as “not specified”.",
            "It can misread an unusual or badly formatted document.",
            "It cannot read a scanned or photographed letter that has no text layer.",
            "A report covers only the file you uploaded — not annexures, policy handbooks or anything the letter refers to but does not contain.",
          ]}
        />
        <p>
          Read the report alongside your offer letter, not instead of it. Where the report and
          the document disagree, the document is what you signed.
        </p>
      </Section>

      <Section title="4. Your account">
        <p>
          You need an account to analyse a document. You are responsible for keeping your
          password confidential and for everything done through your account. Tell us promptly if
          you believe someone else has access to it.
        </p>
        <p>
          You must be old enough to enter a contract in your jurisdiction, and the details you
          give us must be accurate.
        </p>
      </Section>

      <Section title="5. What you may upload">
        <p>By uploading a document you confirm that:</p>
        <Bullets
          items={[
            "it is your own offer letter, or you have permission from the person it belongs to;",
            "you are not uploading it in breach of a confidentiality obligation you owe someone else;",
            "you are not using the service to process other people’s documents in bulk, or to build a competing dataset.",
          ]}
        />
        <p>
          We may suspend an account that uses the service to abuse, overload or reverse-engineer
          it, or that uploads material it has no right to.
        </p>
      </Section>

      <Section title="6. Your report link">
        <p>
          Each report has a long, randomly generated identifier, and that identifier is the only
          thing protecting it. Anyone you send the link to can open the report. Treat it as you
          would treat the offer letter itself.
        </p>
      </Section>

      <Section title="7. Price and availability">
        <p>
          The service is currently free. If we introduce paid features we will say so clearly
          before you are asked to pay, and nothing you have already generated will be taken away
          from you or put behind a paywall retrospectively.
        </p>
        <p>
          We do not promise uninterrupted availability. The service depends on third parties and
          may be unavailable for maintenance or for reasons outside our control.
        </p>
      </Section>

      <Section title="8. Liability">
        <p>
          The service is provided on an &ldquo;as is&rdquo; basis. To the fullest extent
          permitted by law, we are not liable for any loss arising from a decision you took in
          reliance on a report — including accepting or declining a job, or agreeing to a bond,
          notice period or restriction.
        </p>
        <p>
          Nothing in these terms limits liability that cannot lawfully be limited, including for
          fraud or for death or personal injury caused by negligence.
        </p>
      </Section>

      <Section title="9. Your content and ours">
        <p>
          Your offer letter remains yours. You grant us only the permission needed to run the
          analysis you asked for and to store the resulting report for you, as described in the{" "}
          <Link to="/privacy-policy" className="font-medium text-[#0c6b4e] hover:underline">
            Privacy Policy
          </Link>
          . We do not use your document to train models.
        </p>
        <p>
          The site, its wording, its 38-point checklist and the report format are ours. Your
          report is yours to keep, download and share.
        </p>
      </Section>

      <Section title="10. Ending your use">
        <p>
          You may stop using the service at any time and ask us to delete your account and your
          stored reports. We may end or suspend access where these terms are breached.
        </p>
      </Section>

      <Section title="11. Changes">
        <p>
          We may update these terms. If a change materially affects your rights we will make that
          clear rather than quietly changing the date at the top. Continuing to use the service
          after a change means you accept the updated terms.
        </p>
      </Section>

      <Section title="12. Governing law">
        <p>
          These terms are governed by the laws of India, and the courts of India have exclusive
          jurisdiction over any dispute arising from them.
        </p>
      </Section>

      <Section title="13. Contact">
        <p>
          Questions about these terms can go to{" "}
          <a href="mailto:support@trueoffer.ai" className="font-medium text-[#0c6b4e] hover:underline">
            support@trueoffer.ai
          </a>
          .
        </p>
      </Section>
    </Article>
  </PageShell>
)

export default TermsPage
