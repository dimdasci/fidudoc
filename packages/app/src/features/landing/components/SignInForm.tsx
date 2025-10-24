import { Button } from "@shared/ui/Button/Button";
import { Input } from "@shared/ui/Input";
import { useI18nContext } from "@shared/i18n/i18n";
import { useState } from "react";

const ALLOWED_DOMAINS = ["fastmail.com", "3f.lu", "easybiz.lu"];

interface SignInFormProps {
  onSignIn: (email: string) => void;
  onRequestAccess: () => void;
}

export function SignInForm({ onSignIn, onRequestAccess }: SignInFormProps) {
  const { t } = useI18nContext();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const getDomainFromEmail = (emailStr: string): string => {
    const parts = emailStr.split("@");
    return parts.length === 2 ? parts[1] : "";
  };

  const isAllowedDomain = (emailStr: string): boolean => {
    const domain = getDomainFromEmail(emailStr);
    return ALLOWED_DOMAINS.includes(domain);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }

    if (isAllowedDomain(email)) {
      onSignIn(email);
    } else {
      onRequestAccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-body font-medium text-primary">
            {t("landing.signin.emailLabel")}
          </label>
          <Input
            id="email"
            type="email"
            placeholder={t("landing.signin.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full"
          />
          {error && (
            <p className="text-body-sm text-error">
              {error}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
        >
          {t("landing.signin.button")}
        </Button>
      </div>
    </form>
  );
}
