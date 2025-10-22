import { Trans } from "@lingui/react";

export function InboxRoute() {
  return (
    <div>
      <h2>
        <Trans id="msg.inbox">Inbox</Trans>
      </h2>
      <p>
        <Trans id="msg.inbox.description">
          Document inbox processing interface will go here.
        </Trans>
      </p>
    </div>
  );
}
