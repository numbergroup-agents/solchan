"use client";

import Image from "next/image";
import Link from "next/link";
import { WalletButton } from "@/components/WalletButton";
import { BoardNav } from "@/components/BoardNav";

export default function RulesPage() {
  return (
    <main className="max-w-4xl mx-auto p-4">
      <header className="flex items-center justify-between mb-4">
        <Link href="/">
          <Image
            src="/solchan_logo.webp"
            alt="Solchan - Home"
            width={225}
            height={75}
            className="h-15 w-auto"
          />
        </Link>
        <WalletButton />
      </header>

      <BoardNav />

      <h1 className="text-2xl font-bold text-[#800000] mb-6">Rules</h1>

      <div className="bg-[#F0E0D6] border border-[#D9BFB7] p-4 rounded-lg">
        <ol className="list-decimal list-inside space-y-4 text-sm text-[#333333]">
          <li>
            <strong>You will not upload, post, discuss, request, or link to anything that violates local or United States law.</strong>
          </li>
          <li>
            You must be 18 years of age or older to access solchan.
          </li>
          <li>
            The following content is <strong>NOT allowed</strong> anywhere on solchan:
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Loli, shota, or furry pornography</li>
              <li>Guro images</li>
              <li>Illegal content</li>
            </ul>
          </li>
          <li>
            You will not post or request personal information (&quot;dox&quot;) or calls to invasion (&quot;raid&quot; requests).
          </li>
          <li>
            All boards marked as &quot;work safe&quot; are to remain work safe. No explicit content is allowed on work-safe boards.
          </li>
          <li>
            Quality of posting is extremely important on solchan. Users are encouraged to contribute content of value. The following are examples of content that may result in a ban:
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Copypasta and other spam</li>
              <li>Gibberish text</li>
              <li>Ironic shitposting</li>
              <li>Indecipherable text (including attempting to post in a non-standard language)</li>
            </ul>
          </li>
          <li>
            Submitting false or misclassified reports, or otherwise abusing the reporting system may result in a ban. Announcing reports (&quot;I just reported you&quot;) and &quot;sage&quot; in the message field is not allowed.
          </li>
          <li>
            Complaining about solchan (its policies, moderation, etc.) on the boards may result in a ban.
          </li>
          <li>
            Attempting to evade bans will result in a permanent ban. Instead, wait until your ban expires or appeal it.
          </li>
          <li>
            Spamming or flooding of any kind is not allowed. Do not flood the boards with similar posts.
          </li>
          <li>
            Advertising (promoting your own content, streams, or communities) is not allowed, except on boards where it is explicitly permitted.
          </li>
          <li>
            Impersonating solchan staff, moderators, or administrators will result in a permanent ban.
          </li>
          <li>
            Use of &quot;avatars&quot; or &quot;signatures&quot; is not allowed. Repeated posting of the same image or phrase to identify yourself is not permitted.
          </li>
          <li>
            The use of bots, scrapers, or automated tools is prohibited. Using proxies, VPNs, or Tor may result in a ban.
          </li>
          <li>
            All request-type threads belong in their respective boards. Threads for requesting content should go to the appropriate designated boards.
          </li>
          <li>
            Embedding hidden data, such as steganography or malicious code, in images is not allowed.
          </li>
          <li>
            <strong>All global rules apply to every board on solchan unless explicitly stated otherwise.</strong>
          </li>
        </ol>

        <p className="mt-6 text-sm italic text-[#800000]">
          Remember: The use of solchan is a privilege, not a right. The administration reserves the right to revoke access and remove content for any reason without notice.
        </p>
      </div>
    </main>
  );
}
