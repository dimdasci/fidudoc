import { Trans } from "@lingui/react";

export function KycRoute() {
  return (
    <div>
      <h2>
        <Trans id="msg.kyc">KYC</Trans>
      </h2>
      <p>
        <Trans id="msg.kyc.description">
          Know Your Client interface will go here.
        </Trans>
      </p>
    </div>
  );
}
