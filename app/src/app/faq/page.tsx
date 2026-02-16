"use client";

import Image from "next/image";
import Link from "next/link";
import { WalletButton } from "@/components/WalletButton";
import { BoardNav } from "@/components/BoardNav";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  items: FAQItem[];
}

const faqSections: FAQSection[] = [
  {
    title: "General",
    items: [
      {
        question: "What is Solchan?",
        answer:
          "Solchan is a decentralized imageboard built on the Solana blockchain. It combines the classic imageboard experience with blockchain technology, providing a censorship-resistant platform for discussion.",
      },
      {
        question: "How do I use Solchan?",
        answer:
          "Connect your Solana wallet using the button in the top right corner, browse available boards, and start participating in threads. You can create new threads or reply to existing ones.",
      },
      {
        question: "Do I need to register?",
        answer:
          "No registration is required. Your Solana wallet address serves as your identity. Simply connect your wallet and you're ready to post.",
      },
      {
        question: "Is Solchan anonymous?",
        answer:
          "Solchan is pseudonymous rather than anonymous. Your posts are associated with your wallet address, which doesn't reveal your real identity but does create a consistent identity across your posts.",
      },
    ],
  },
  {
    title: "Boards",
    items: [
      {
        question: "What boards are available?",
        answer:
          "Solchan offers various themed boards for different topics including technology, random discussion, and more. Check the board navigation at the top of the page to see all available boards.",
      },
      {
        question: "What is /b/?",
        answer:
          "/b/ is the Random board. It has more relaxed content rules compared to other boards and allows a wider variety of discussion topics.",
      },
      {
        question: "What are work-safe boards?",
        answer:
          "Work-safe boards are boards where explicit or NSFW content is not allowed. These boards are suitable for viewing in public or professional environments.",
      },
    ],
  },
  {
    title: "Posting",
    items: [
      {
        question: "How do I start a new thread?",
        answer:
          'Navigate to the board where you want to post, click "Start a New Thread", fill in the subject and comment fields, optionally attach an image, and submit your post.',
      },
      {
        question: "How do I reply to a thread?",
        answer:
          "Click on a thread to open it, then use the reply form at the bottom of the page to submit your response.",
      },
      {
        question: 'What is "bumping"?',
        answer:
          "When you reply to a thread, it gets bumped to the top of the board. This keeps active threads visible. Threads that don't receive replies will eventually fall off the board.",
      },
      {
        question: 'What is "sage"?',
        answer:
          'Sage (pronounced "sah-geh") is a way to reply to a thread without bumping it. This is useful when you want to respond but don\'t think the thread deserves more visibility.',
      },
      {
        question: "What file types are supported?",
        answer:
          "Solchan supports common image formats: JPG, PNG, GIF, and WEBP. There are file size limits in place, so make sure your images aren't too large.",
      },
    ],
  },
  {
    title: "Solana & Wallets",
    items: [
      {
        question: "Why do I need a wallet?",
        answer:
          "A Solana wallet is required to post on Solchan. Since all posts are stored on the blockchain, you need a wallet to sign transactions and pay for the small transaction fees.",
      },
      {
        question: "Which wallets work with Solchan?",
        answer:
          "Solchan supports popular Solana wallets including Phantom, Solflare, and other wallets that implement the Solana wallet adapter standard.",
      },
      {
        question: "What network is Solchan on?",
        answer: "Solchan operates on Solana mainnet.",
      },
      {
        question: "Does posting cost SOL?",
        answer:
          "Yes, posting requires a small amount of SOL to cover Solana transaction fees. On devnet, you can get free SOL from faucets. On mainnet, the fees are typically fractions of a cent.",
      },
    ],
  },
  {
    title: "Moderation",
    items: [
      {
        question: "How do I report a post?",
        answer:
          "Use the report button available on each post. Select the reason for reporting and submit. Moderators will review the report and take appropriate action.",
      },
      {
        question: "What happens if I break the rules?",
        answer:
          "Violating the rules may result in your wallet address being banned from posting. The severity of the ban depends on the nature of the violation.",
      },
      {
        question: "Can I appeal a ban?",
        answer:
          "Yes, you can appeal a ban by contacting the moderation team. Provide your wallet address and explain why you believe the ban should be lifted.",
      },
    ],
  },
];

export default function FAQPage() {
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

      <h1 className="text-2xl font-bold text-[#800000] mb-6">
        Frequently Asked Questions
      </h1>

      <div className="space-y-6">
        {faqSections.map((section) => (
          <div
            key={section.title}
            className="bg-[#F0E0D6] border border-[#D9BFB7] p-4 rounded-lg"
          >
            <h2 className="text-lg font-bold text-[#800000] mb-4">
              {section.title}
            </h2>
            <dl className="space-y-4">
              {section.items.map((item) => (
                <div key={item.question}>
                  <dt className="font-semibold text-sm text-[#333333]">
                    {item.question}
                  </dt>
                  <dd className="text-sm text-[#333333] mt-1 ml-4">
                    {item.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </main>
  );
}
