import { useI18nContext } from "@shared/i18n/i18n";
import { AppHeader } from "@shared/ui/AppHeader";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OTPSignInForm } from "../components/OTPSignInForm";
import { UnknownUserMessage } from "../components/UnknownUserMessage";

export function SignInRoute() {
  const navigate = useNavigate();
  const { t } = useI18nContext();
  const [unknownUserEmail, setUnknownUserEmail] = useState<string | null>(null);

  const handleSignInSuccess = () => {
    navigate("/documents/inbox");
  };

  const handleUnknownUser = (email: string) => {
    setUnknownUserEmail(email);
  };

  const handleBackToSignIn = () => {
    setUnknownUserEmail(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <AppHeader showBackToLanding />

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-primary mb-2">
              {t("auth.title")}
            </h2>
            <p className="text-body text-secondary mb-6">
              {t("auth.subtitle")}
            </p>
          </div>

          {unknownUserEmail
            ? (
              <UnknownUserMessage
                email={unknownUserEmail}
                onBack={handleBackToSignIn}
              />
            )
            : (
              <OTPSignInForm
                onSuccess={handleSignInSuccess}
                onUnknownUser={handleUnknownUser}
              />
            )}
        </div>
      </main>
    </div>
  );
}
