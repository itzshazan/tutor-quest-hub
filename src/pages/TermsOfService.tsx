import { Link } from "react-router-dom";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Terms of Service"
        description="Read the Tutor Quest Terms of Service. Understand your rights and responsibilities when using our tutoring platform."
        url="/terms"
      />
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <GraduationCap className="h-7 w-7" />
            Tutor Quest
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-4xl py-12">
        <h1 className="mb-8 font-display text-4xl font-bold text-foreground">Terms of Service</h1>
        <p className="mb-6 text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using Tutor Quest, you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to abide by these terms, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Tutor Quest is an online platform that connects students with tutors for educational services. 
              We facilitate the matching process and provide tools for scheduling, communication, and payment processing.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              To use certain features of our service, you must register for an account. You agree to:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Provide accurate and complete information during registration</li>
              <li>Maintain the security of your password and account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">4. Tutor Responsibilities</h2>
            <p className="text-muted-foreground leading-relaxed">
              Tutors on our platform agree to:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Provide accurate information about qualifications and experience</li>
              <li>Deliver quality tutoring services as described in their profile</li>
              <li>Maintain professional conduct during all sessions</li>
              <li>Respond to booking requests in a timely manner</li>
              <li>Honor confirmed session commitments</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">5. Student Responsibilities</h2>
            <p className="text-muted-foreground leading-relaxed">
              Students using our platform agree to:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Attend scheduled sessions on time</li>
              <li>Treat tutors with respect and professionalism</li>
              <li>Pay for services as agreed upon</li>
              <li>Provide honest feedback and reviews</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">6. Payments and Fees</h2>
            <p className="text-muted-foreground leading-relaxed">
              Tutor Quest charges a 10% platform fee on all transactions. Payments are held in escrow until 
              the session is completed. Refunds may be issued in accordance with our refund policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">7. Cancellation Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Sessions may be cancelled up to 24 hours before the scheduled time for a full refund. 
              Cancellations made within 24 hours may be subject to a cancellation fee.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">8. Prohibited Conduct</h2>
            <p className="text-muted-foreground leading-relaxed">
              Users may not:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Use the service for any unlawful purpose</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Attempt to circumvent platform fees</li>
              <li>Post false or misleading information</li>
              <li>Impersonate others or misrepresent affiliations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">9. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              Tutor Quest is not liable for any disputes between tutors and students. We provide the platform 
              but do not guarantee the quality of tutoring services provided.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">10. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at support@tutorquest.com.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;
