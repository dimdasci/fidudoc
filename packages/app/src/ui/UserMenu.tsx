import { useAuth } from "@features/auth";
import { ChevronDown, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useI18nContext } from "../i18n/i18n";
import { MenuItem, MenuPopup, MenuRoot, MenuSeparator, MenuTrigger } from "./Menu";

export function UserMenu() {
  const navigate = useNavigate();
  const { t } = useI18nContext();
  const { authState, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authState.status !== "authenticated") {
    return null;
  }

  const { user } = authState.session;
  const userEmail = user.email;
  const accountId = user.accountId;

  return (
    <MenuRoot>
      <MenuTrigger>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-background transition-colors text-body">
          <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white text-sm font-medium">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <span className="text-primary font-medium max-w-[150px] truncate">
            {userEmail}
          </span>
          <ChevronDown size={16} className="text-secondary" />
        </div>
      </MenuTrigger>

      <MenuPopup showArrow={false}>
        {/* User Info Header */}
        <div className="px-3 py-3 border-b border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-medium">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-body font-medium text-primary truncate">
                {userEmail}
              </div>
              {accountId && (
                <div className="text-body-sm text-secondary">
                  Account: {accountId}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <MenuItem
          onClick={() => {
            // Navigate to profile/account settings if needed
          }}
        >
          <div className="flex items-center gap-3">
            <User size={16} />
            {t("auth.profile")}
          </div>
        </MenuItem>

        <MenuSeparator />

        <MenuItem onClick={handleSignOut}>
          <div className="flex items-center gap-3">
            <LogOut size={16} />
            {t("auth.signout")}
          </div>
        </MenuItem>
      </MenuPopup>
    </MenuRoot>
  );
}
