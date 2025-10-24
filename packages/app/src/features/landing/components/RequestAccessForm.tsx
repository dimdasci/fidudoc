import { Button } from "@shared/ui/Button/Button";
import { Input } from "@shared/ui/Input";
import { useI18nContext } from "@shared/i18n/i18n";
import { useState } from "react";

interface RequestAccessFormProps {
  onSubmit: (email: string, company: string) => void;
  onBack: () => void;
}

export function RequestAccessForm({ onSubmit, onBack }: RequestAccessFormProps) {
  const { t } = useI18nContext();
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && company.trim()) {
      onSubmit(email, company);
      setSubmitted(true);
      setTimeout(() => {
        setEmail("");
        setCompany("");
        setSubmitted(false);
      }, 3000);
    }
  };

  if (submitted) {
    return (
      <div className="w-full max-w-sm text-center">
        <p className="text-body text-primary mb-4">
          {t("landing.form.success")}
        </p>
        <Button variant="secondary" onClick={onBack}>
          {t("landing.signin.button")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-body font-medium text-primary">
            {t("landing.form.emailLabel")}
          </label>
          <Input
            id="email"
            type="email"
            placeholder={t("landing.form.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="company" className="text-body font-medium text-primary">
            {t("landing.form.companyLabel")}
          </label>
          <Input
            id="company"
            type="text"
            placeholder={t("landing.form.companyPlaceholder")}
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full"
            required
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onBack}
            className="flex-1"
          >
            {t("landing.signin.button")}
          </Button>
          <Button
            type="submit"
            className="flex-1"
          >
            {t("landing.form.submit")}
          </Button>
        </div>
      </div>
    </form>
  );
}
