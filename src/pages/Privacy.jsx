import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];
const EFFECTIVE = "May 26, 2026";

function H({ children, id }) {
  return <h2 id={id} className="font-display text-2xl text-slate-900 tracking-tight mt-10 mb-3 scroll-mt-24">{children}</h2>;
}
function P({ children }) {
  return <p className="text-[15px] text-slate-700 leading-relaxed mb-4">{children}</p>;
}
function LI({ children }) {
  return <li className="text-[15px] text-slate-700 leading-relaxed mb-2">{children}</li>;
}

export default function Privacy() {
  return (
    <section className="px-6 py-16 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="max-w-3xl mx-auto"
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-3">Legal</div>
        <h1 className="font-display text-4xl md:text-5xl text-slate-900 tracking-tight mb-3">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-6">Effective {EFFECTIVE}</p>

        <P>
          This Privacy Policy explains how <strong>Koemori</strong>, a registered trade name (DBA) of{" "}
          <strong>Driveway Detailers LLC</strong> ("Koemori," "we," "us"), collects, uses, and shares information
          when you visit koemori.ai, when a business engages our managed services, and when our AI receptionist
          handles calls on a client's behalf.
        </P>

        <H>1. Information We Collect</H>
        <P><strong>From website visitors:</strong> contact details you submit (name, email, phone, business name) and basic usage data.</P>
        <P><strong>From our business clients:</strong> business and contact information, configuration details, and billing information (payment is processed by Stripe; we do not store full card numbers).</P>
        <P><strong>From callers to a client's line (end customers / homeowners):</strong> phone number, the audio recording and transcript of the call, any information the caller provides (such as name, address, and the work requested), and a summary and sentiment generated from the call.</P>

        <H>2. Call Recordings & Transcripts</H>
        <P>
          When our AI receptionist answers a call on behalf of a client, the call is recorded, transcribed, and
          summarized so the lead can be delivered to that client and shown in their portal. Our business clients are
          responsible for providing any notice or consent that the law requires for recording or monitoring calls in
          the jurisdictions where their callers are located.
        </P>

        <H>3. How We Use Information</H>
        <ul className="list-disc pl-5 mb-4">
          <LI>To provide, operate, configure, and improve the managed Service;</LI>
          <LI>To deliver leads, summaries, and transcripts to the relevant business client;</LI>
          <LI>To process payments and manage subscriptions;</LI>
          <LI>To communicate with you about your account, the Service, or your inquiry;</LI>
          <LI>To maintain security, prevent abuse, and comply with legal obligations.</LI>
        </ul>

        <H id="sms">4. Text Messaging (SMS) & Consent</H>
        <P>
          If you opt in, we may send SMS messages related to your inquiry, account, or the Service. Message and data
          rates may apply; message frequency varies. Reply <strong>STOP</strong> to opt out at any time, or{" "}
          <strong>HELP</strong> for help. Consent to receive messages is not a condition of purchase. We register our
          messaging under the carrier A2P 10DLC framework where applicable. We do not sell or share mobile opt-in data
          or phone numbers with third parties for their own marketing.
        </P>

        <H>5. How We Share Information (Subprocessors)</H>
        <P>
          We do not sell your personal information. We share information only with service providers who help us run the
          Service, under terms that protect the data, including:
        </P>
        <ul className="list-disc pl-5 mb-4">
          <LI><strong>Retell AI / telephony &amp; voice providers</strong> — to answer, route, record, and transcribe calls;</LI>
          <LI><strong>AI/LLM providers</strong> — to generate call responses, summaries, and analysis;</LI>
          <LI><strong>Stripe</strong> — to process payments and subscriptions;</LI>
          <LI><strong>Supabase</strong> — to store account, client, and call data;</LI>
          <LI><strong>Resend</strong> — to send transactional email;</LI>
          <LI><strong>Netlify</strong> — to host the website and backend functions.</LI>
        </ul>
        <P>We may also disclose information to comply with law, enforce our Terms, or protect rights and safety.</P>

        <H>6. Data Retention</H>
        <P>
          We retain information for as long as needed to provide the Service and for legitimate business or legal
          purposes. Business clients may request deletion of call records associated with their account, subject to
          legal and operational limits.
        </P>

        <H>7. Security</H>
        <P>
          We use reasonable administrative and technical safeguards to protect information. No method of transmission or
          storage is completely secure, and we cannot guarantee absolute security.
        </P>

        <H>8. Your Choices & Rights</H>
        <P>
          You may request access to, correction of, or deletion of personal information we hold about you by emailing{" "}
          <a href="mailto:hello@koemori.ai" className="text-rain-700 underline hover:text-rain-600">hello@koemori.ai</a>.
          Depending on where you live, you may have additional rights under laws such as the CCPA/CPRA or similar.
        </P>

        <H id="do-not-sell">9. Do Not Sell or Share My Personal Information</H>
        <P>
          <strong>We do not sell your personal information, and we do not share it for cross-context behavioral
          advertising.</strong> If our practices ever change, we will update this section and provide a method to opt out.
          To make a privacy request, email{" "}
          <a href="mailto:hello@koemori.ai" className="text-rain-700 underline hover:text-rain-600">hello@koemori.ai</a>.
        </P>

        <H>10. Children's Privacy</H>
        <P>The Service is for businesses and is not directed to children under 13, and we do not knowingly collect their information.</P>

        <H>11. Changes to This Policy</H>
        <P>We may update this Policy. Material changes will be posted here with a new effective date.</P>

        <H>12. Contact</H>
        <P>
          Questions or privacy requests: <a href="mailto:hello@koemori.ai" className="text-rain-700 underline hover:text-rain-600">hello@koemori.ai</a>.
          Koemori is a DBA of Driveway Detailers LLC, Nashville, Tennessee.
        </P>
      </motion.div>
    </section>
  );
}
