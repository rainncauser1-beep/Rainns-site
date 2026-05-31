import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];
const EFFECTIVE = "May 26, 2026";

function H({ children }) {
  return <h2 className="font-display text-2xl text-slate-900 tracking-tight mt-10 mb-3">{children}</h2>;
}
function P({ children }) {
  return <p className="text-[15px] text-slate-700 leading-relaxed mb-4">{children}</p>;
}
function LI({ children }) {
  return <li className="text-[15px] text-slate-700 leading-relaxed mb-2">{children}</li>;
}

export default function Terms() {
  return (
    <section className="px-6 py-16 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="max-w-3xl mx-auto"
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-3">Legal</div>
        <h1 className="font-display text-4xl md:text-5xl text-slate-900 tracking-tight mb-3">Terms of Service</h1>
        <p className="text-slate-500 text-sm mb-6">Effective {EFFECTIVE}</p>

        <P>
          These Terms of Service ("Terms") govern the managed services provided by{" "}
          <strong>Koemori</strong>, a registered trade name (DBA) of <strong>Driveway Detailers LLC</strong>,
          a Tennessee limited liability company ("Koemori," "we," "us," or "our"), to the business that
          engages us (the "Client," "you," or "your"). By booking, paying for, or using the Services, you
          agree to these Terms.
        </P>

        <H>1. The Services</H>
        <P>
          Koemori provides a <strong>done-for-you, managed communications service</strong> for roofing and
          related contracting businesses. Our service includes the design, configuration, deployment, ongoing
          management, monitoring, and optimization of an AI-assisted phone receptionist on your behalf, along
          with related human support. We configure and operate the system for you; we do not sell or license
          self-service software, and you are not granted a software license. The Services are professional,
          managed services delivered and supervised by Koemori personnel.
        </P>

        <H>2. Onboarding & Client Responsibilities</H>
        <P>You agree to:</P>
        <ul className="list-disc pl-5 mb-4">
          <LI>Provide accurate business information (hours, services, pricing guidance, and similar) used to configure the Service;</LI>
          <LI>Forward your business phone line to the number we provision, using your carrier's call-forwarding feature;</LI>
          <LI>Use the Service only for lawful purposes and in compliance with all applicable laws;</LI>
          <LI>Obtain and maintain any consents or disclosures required for calls, recordings, and messaging involving your customers (see Sections 4 and 5);</LI>
          <LI>Promptly call back or follow up on leads we deliver to you — Koemori captures and delivers leads but does not perform your sales or fulfillment.</LI>
        </ul>

        <H>3. Call Recording, Monitoring & Transcription</H>
        <P>
          The Service answers, records, and transcribes inbound telephone calls and generates summaries of those
          calls. You authorize Koemori to record, transcribe, store, and process these calls to provide the
          Service. You are responsible for ensuring that any notice or consent required by applicable law for
          the recording or monitoring of calls is provided to callers. Recording and consent laws vary by state;
          you are responsible for compliance in every jurisdiction from which your callers may originate.
        </P>

        <H>4. Telephone, SMS & Communications Compliance</H>
        <P>
          You are solely responsible for complying with all laws governing telephone and electronic communications,
          including the Telephone Consumer Protection Act (TCPA), CAN-SPAM, applicable Do-Not-Call rules, and carrier
          requirements such as A2P 10DLC registration. You represent that you have obtained all consents necessary
          for any outreach conducted through or in connection with the Service. You will not use the Service to send
          unlawful, deceptive, or unsolicited communications.
        </P>

        <H>5. Fees, Billing & Auto-Renewal</H>
        <P>
          Fees are quoted individually and may include a one-time setup fee and a recurring monthly fee, as agreed
          before activation. Recurring fees are billed monthly in advance through our payment processor (Stripe) and
          <strong> automatically renew each month</strong> until cancelled. By providing a payment method, you authorize
          recurring charges. Except as stated in Section 6, fees already paid are non-refundable. Platform usage costs
          incurred by Koemori on your behalf are included in your fee unless otherwise stated.
        </P>

        <H>6. Performance / ROI Guarantee</H>
        <P>
          We offer a first-month guarantee: if, during your first paid month, the Service has not generated value to
          your business that meets or exceeds the fees you paid for that month, you may request a refund of that first
          month's fee. To qualify, you must (a) have completed onboarding and forwarded your number so the Service
          could operate, and (b) make the request in writing within fifteen (15) days after the end of the first paid
          month. The guarantee applies once, to the first month only, and is Koemori's sole obligation and your sole
          remedy under this Section. <em>(Your attorney should tighten the measurable definition of "value" before launch.)</em>
        </P>

        <H>7. Term & Termination</H>
        <P>
          Service is month-to-month with no long-term contract. Either party may cancel at any time, effective at the
          end of the then-current billing month; cancellation stops future renewals but does not refund the current
          month except under Section 6. We may suspend or terminate the Service immediately for non-payment, misuse,
          or violation of these Terms. Upon termination, we will stop answering your calls and you should remove call
          forwarding from your line.
        </P>

        <H>8. Taxes</H>
        <P>
          All fees are <strong>exclusive of taxes</strong>. You are responsible for all sales, use, excise, and similar
          taxes arising from the Services, other than taxes on Koemori's net income. If Koemori is required to collect
          such taxes, they will be added to your invoice. Nothing here is tax advice; the tax treatment of the Services
          is determined by applicable law.
        </P>

        <H>9. AI Disclaimer & No Guarantee of Results</H>
        <P>
          The Service uses artificial intelligence, which is probabilistic and imperfect. While we work to answer every
          call and capture every lead, <strong>we do not warrant that the Service will answer 100% of calls, capture every
          lead, be error-free, or be uninterrupted.</strong> The AI may misunderstand callers, miss information, or be
          affected by carrier, network, or third-party outages outside our control. Koemori is not responsible for lost
          calls, lost leads, lost business, or actions taken by callers, and the Service is not a substitute for your own
          judgment or for emergency services.
        </P>

        <H>10. Intellectual Property</H>
        <P>
          Koemori retains all rights to its technology, configurations, prompts, methods, and the Service itself. You
          retain ownership of your business data and the leads and call records generated for you, which we make available
          to you through your portal. You grant us the limited rights needed to operate the Service for you.
        </P>

        <H>11. Confidentiality</H>
        <P>
          Each party will protect the other's non-public business information and use it only to perform or receive the
          Services. This does not apply to information that is public, independently developed, or required to be
          disclosed by law.
        </P>

        <H>12. Data Protection & Privacy</H>
        <P>
          Our handling of personal information is described in our{" "}
          <a href="/privacy" className="text-rain-700 underline hover:text-rain-600">Privacy Policy</a>. In providing the
          Service, Koemori processes call data and customer information on your behalf. You are responsible for having a
          lawful basis and any required notices/consents for the information your callers provide.
        </P>

        <H>13. Disclaimers of Warranties</H>
        <P>
          The Services are provided <strong>"AS IS" and "AS AVAILABLE"</strong> without warranties of any kind, express or
          implied, including merchantability, fitness for a particular purpose, and non-infringement, to the fullest
          extent permitted by law.
        </P>

        <H>14. Limitation of Liability</H>
        <P>
          To the fullest extent permitted by law, Koemori will not be liable for any indirect, incidental, special,
          consequential, or punitive damages, or for lost profits, revenue, leads, or business. Koemori's total
          liability arising out of or relating to the Services will not exceed the total fees you paid to Koemori in the
          <strong> three (3) months</strong> preceding the event giving rise to the claim.
        </P>

        <H>15. Indemnification</H>
        <P>
          You will indemnify and hold harmless Koemori and Driveway Detailers LLC from claims, damages, and costs
          (including reasonable attorneys' fees) arising from your use of the Service, your communications with your
          customers, your failure to obtain required consents, your content, or your violation of law or these Terms.
        </P>

        <H>16. Third-Party Services</H>
        <P>
          The Service relies on third-party providers (for example, telephony, AI/voice, payments, hosting, and email
          delivery). We are not responsible for their acts, omissions, outages, or changes, and your use of the Service
          may be subject to their terms.
        </P>

        <H>17. Governing Law & Disputes</H>
        <P>
          These Terms are governed by the laws of the State of Tennessee, without regard to conflict-of-laws rules. The
          exclusive venue for any dispute is the state or federal courts located in Davidson County, Tennessee, and you
          consent to their jurisdiction. <em>(Your attorney may wish to add an arbitration and/or class-action-waiver clause.)</em>
        </P>

        <H>18. Changes to These Terms</H>
        <P>
          We may update these Terms from time to time. Material changes will be posted here with a new effective date,
          and your continued use of the Service after changes take effect constitutes acceptance.
        </P>

        <H>19. Miscellaneous</H>
        <P>
          These Terms are the entire agreement between you and Koemori regarding the Services and supersede prior
          agreements. If any provision is held unenforceable, the rest remains in effect. We may assign these Terms to a
          successor or affiliate. Our failure to enforce a provision is not a waiver.
        </P>

        <H>Contact</H>
        <P>
          Questions about these Terms? Email <a href="mailto:hello@koemori.ai" className="text-rain-700 underline hover:text-rain-600">hello@koemori.ai</a>.
          Koemori is a DBA of Driveway Detailers LLC, Nashville, Tennessee.
        </P>
      </motion.div>
    </section>
  );
}
