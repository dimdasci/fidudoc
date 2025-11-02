import { useAuth } from "@features/auth";
import { useNavigate } from "react-router-dom";
import { useI18nContext } from "../i18n/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";
import { ThemeSwitcher } from "./ThemeSwitcher/ThemeSwitcher";
import { UserMenu } from "./UserMenu";

export function AppHeader() {
  const navigate = useNavigate();
  const { t } = useI18nContext();
  const { authState } = useAuth();

  return (
    <header className="flex-none h-16 bg-surface border-b border-subtle px-6 flex items-center justify-between">
      <div className="flex items-baseline gap-6">
        <Logo />
        {/* Account name - Only show when authenticated */}
        {authState.status === "authenticated" && (
          <>
            <span className="text-secondary text-body">/</span>
            <button
              type="button"
              onClick={() => navigate("/documents/inbox")}
              className="text-primary hover:text-accent transition-colors font-medium text-body"
            >
              {authState.session.user.accountDisplayName || t("nav.application")}
            </button>
          </>
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
              className="px-4 py-2 bg-accent text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              {t("landing.header.signin")}
            </button>
          )
          : null}

        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
