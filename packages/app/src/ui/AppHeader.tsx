import { useAuth } from "@features/auth";
import { useNavigate } from "react-router-dom";
import { useI18nContext } from "../i18n/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";
import { ThemeSwitcher } from "./ThemeSwitcher/ThemeSwitcher";
import { UserMenu } from "./UserMenu";

interface AppHeaderProps {
  showBackToLanding?: boolean;
}

export function AppHeader({ showBackToLanding = false }: AppHeaderProps) {
  const navigate = useNavigate();
  const { t } = useI18nContext();
  const { authState } = useAuth();

  return (
    <header className="flex-none h-16 bg-surface border-b border-subtle px-6 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Logo />
        {/* Application link - Only show when authenticated */}
        {authState.status === "authenticated" && (
          <button
            type="button"
            onClick={() => navigate("/documents/inbox")}
            className="text-primary hover:text-accent transition-colors font-medium text-body"
          >
            {t("nav.application")}
          </button>
        )}
      </div>
      <div className="flex items-center gap-4">
        {/* Authentication - Show UserMenu when authenticated, Sign in button when not */}
        {authState.status === "authenticated"
          ? <UserMenu />
          : authState.status === "unauthenticated"
          ? (
            <button
              type="button"
              onClick={() => navigate("/signin")}
              className="text-accent hover:opacity-80 transition-opacity font-medium text-body"
            >
              {t("landing.header.signin")}
            </button>
          )
          : null}

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
