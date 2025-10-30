import { useI18nContext } from "@shared/i18n/i18n";
import { useState } from "react";
import { sendOTP, verifyOTP } from "../services/auth";
import type { OTPStep } from "../types";

interface OTPSignInFormProps {
  onSuccess: () => void;
  onUnknownUser?: (email: string) => void;
}

function isUserNotFoundError(
  errorCode?: string,
  errorMessage?: string,
): boolean {
  if (errorCode === "user_not_found") return true;
  const msg = errorMessage?.toLowerCase() ?? "";
  return msg.includes("user not found") || msg.includes("email not found");
}

export function OTPSignInForm({ onSuccess, onUnknownUser }: OTPSignInFormProps) {
  const { t } = useI18nContext();
  const [step, setStep] = useState<OTPStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error: otpError } = await sendOTP(email);

      if (otpError) {
        if (isUserNotFoundError(otpError.code, otpError.message)) {
          if (onUnknownUser) {
            onUnknownUser(email);
          } else {
            setError(t("auth.errors.userNotFound"));
          }
        } else {
          setError(otpError.message || t("auth.errors.sendOTPFailed"));
        }
      } else {
        setStep("code");
      }
    } catch (err) {
      console.error("Failed to send OTP:", err);
      setError(t("auth.errors.sendOTPFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { session, error } = await verifyOTP(email, code);

      if (error) {
        setError(error.message || t("auth.errors.verifyOTPFailed"));
      } else if (session) {
        onSuccess();
      } else {
        setError(t("auth.errors.verifyOTPFailed"));
      }
    } catch (err) {
      console.error("Failed to verify OTP:", err);
      setError(t("auth.errors.verifyOTPFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    setCode("");
    setError(null);
  };

  if (step === "code") {
    return (
      <form onSubmit={handleVerifyOTP} className="space-y-4">
        <div>
          <label
            htmlFor="code"
            className="block text-sm font-medium text-primary mb-2"
          >
            {t("auth.code.label")}
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            maxLength={6}
            placeholder={t("auth.code.placeholder")}
            disabled={isLoading}
            className="w-full px-4 py-2 border border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-surface text-primary"
          />
          <p className="text-sm text-secondary mt-2">
            {t("auth.code.hint", { email })}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || code.length !== 6}
          className="w-full px-4 py-2 bg-accent text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? t("auth.verifying") : t("auth.verify")}
        </button>

        <button
          type="button"
          onClick={handleBackToEmail}
          disabled={isLoading}
          className="w-full px-4 py-2 text-body text-secondary hover:text-primary transition-colors"
        >
          {t("auth.backToEmail")}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendOTP} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-primary mb-2"
        >
          {t("auth.email.label")}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder={t("auth.email.placeholder")}
          disabled={isLoading}
          className="w-full px-4 py-2 border border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-surface text-primary"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-accent text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? t("auth.sending") : t("auth.sendCode")}
      </button>
    </form>
  );
}
