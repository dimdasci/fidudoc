import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Logo } from "@shared/ui/Logo";
import { LanguageSwitcher } from "@shared/ui/LanguageSwitcher";
import { showToast } from "@shared/ui/toast";
import { ToastContainer } from "@shared/ui/ToastContainer";
import { useI18nContext } from "@shared/i18n/i18n";
import { HeroSection } from "@features/landing/components/HeroSection";
import { ProblemSection } from "@features/landing/components/ProblemSection";
import { SolutionSection } from "@features/landing/components/SolutionSection";
import { StepsSection } from "@features/landing/components/StepsSection";
import { PrinciplesSection } from "@features/landing/components/PrinciplesSection";
import { FooterSection } from "@features/landing/components/FooterSection";
import { SignInForm } from "@features/landing/components/SignInForm";
import { RequestAccessForm } from "@features/landing/components/RequestAccessForm";

const ALLOWED_DOMAINS = ["fastmail.com", "3f.lu", "easybiz.lu"];

export function LandingRoute() {
  const navigate = useNavigate();
  const { t } = useI18nContext();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);

  const handleSignIn = (email: string) => {
    const domain = email.split("@")[1];
    if (ALLOWED_DOMAINS.includes(domain)) {
      // Store email in sessionStorage for now (not real auth)
      sessionStorage.setItem("userEmail", email);
      navigate("/documents/inbox");
    }
  };

  const handleRequestAccess = () => {
    setShowRequestForm(true);
  };

  const handleFormSubmit = (email: string, company: string) => {
    // For now, just show a success message
    console.log("Access request:", { email, company });
    showToast(t("landing.form.success"), "success");
    setTimeout(() => {
      setShowRequestForm(false);
      setShowSignIn(false);
    }, 2000);
  };

  if (showSignIn) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex-none h-16 bg-surface border-b border-subtle px-6 flex items-center justify-between">
          <Logo />
          <LanguageSwitcher />
        </header>

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-primary mb-2">
                {t("landing.signin.title")}
              </h2>
              <p className="text-body text-secondary mb-6">
                {t("landing.signin.betaMessage")}
              </p>
            </div>

            {showRequestForm ? (
              <RequestAccessForm
                onSubmit={handleFormSubmit}
                onBack={() => setShowRequestForm(false)}
              />
            ) : (
              <SignInForm
                onSignIn={handleSignIn}
                onRequestAccess={handleRequestAccess}
              />
            )}

            <div className="text-center mt-6">
              <button
                onClick={() => setShowSignIn(false)}
                className="text-body text-secondary hover:text-primary transition-colors"
              >
                ← Back to landing page
              </button>
            </div>
          </div>
        </main>

        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex-none h-16 bg-surface border-b border-subtle px-6 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSignIn(true)}
            className="text-accent hover:opacity-80 transition-opacity font-medium text-body"
          >
            {t("landing.header.signin")}
          </button>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <HeroSection onCTA={() => setShowSignIn(true)} />
        <ProblemSection />
        <SolutionSection />
        <StepsSection />
        <PrinciplesSection />
      </main>

      {/* Footer */}
      <FooterSection />

      <ToastContainer />
    </div>
  );
}
