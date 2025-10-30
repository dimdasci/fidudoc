import { useAuth } from "@features/auth";
import { useNavigate } from "react-router-dom";
import { useI18nContext } from "../i18n/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";
import { ThemeSwitcher } from "./ThemeSwitcher/ThemeSwitcher";

interface AppHeaderProps {
  showBackToLanding?: boolean;
}

export function AppHeader({ showBackToLanding = false }: AppHeaderProps) {
  const navigate = useNavigate();
  const { t } = useI18nContext();
  const { authState, signOut } = useAuth();

  const handleAuthAction = async () => {
    if (authState.status === "authenticated") {
      await signOut();
      navigate("/");
    } else {
      navigate("/signin");
    }
  };

  const getAuthButtonText = () => {
    if (authState.status === "loading") return "...";
    if (authState.status === "authenticated") return t("auth.signout");
    return t("landing.header.signin");
  };

  return (
    <header className="flex-none h-16 bg-surface border-b border-subtle px-6 flex items-center justify-between">
      <Logo />
      <div className="flex items-center gap-4">
        {/* Authentication Button - Show on all screens when user is authenticated, or on landing/signin when not authenticated */}
        {authState.status !== "loading" && (
          <button
            type="button"
            onClick={handleAuthAction}
            className="text-accent hover:opacity-80 transition-opacity font-medium text-body"
          >
            {getAuthButtonText()}
          </button>
        )}

        {/* Back to Landing - Only show on signin page */}
        {showBackToLanding && (
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-body text-secondary hover:text-primary transition-colors"
          >
            ← {t("auth.backToLanding")}
          </button>
        )}

        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
