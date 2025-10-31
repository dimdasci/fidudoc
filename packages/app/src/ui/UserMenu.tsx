import { useAuth } from "@features/auth";
import { ChevronDown, LogOut } from "lucide-react";
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
  const displayName = user.displayName || user.email;
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <MenuRoot>
      <MenuTrigger>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-background transition-colors text-body">
          <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white text-sm font-medium">
            {initials}
          </div>
          <span className="text-primary font-medium max-w-[150px] truncate">
            {displayName}
          </span>
          <ChevronDown size={16} className="text-secondary" />
        </div>
      </MenuTrigger>

      <MenuPopup showArrow={false}>
        {/* User Info Header */}
        <div className="px-3 py-3 border-b border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-medium">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-body font-medium text-primary truncate">
                {displayName}
              </div>
              <div className="text-body-sm text-secondary truncate">
                {user.email}
              </div>
            </div>
          </div>
        </div>

        {/* User Details */}
        <div className="px-3 py-2 text-body-sm space-y-1">
          {user.accountId && (
            <div className="text-secondary">
              <div className="font-medium mb-1">Account ID:</div>
              <div className="font-mono text-xs break-all">{user.accountId}</div>
            </div>
          )}
        </div>

        <MenuSeparator />

        <MenuItem onClick={handleSignOut} showCheckmark={false}>
          <div className="flex items-center gap-3">
            <LogOut size={16} />
            {t("auth.signout")}
          </div>
        </MenuItem>
      </MenuPopup>
    </MenuRoot>
  );
}
