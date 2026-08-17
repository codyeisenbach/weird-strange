import DoNotSellToggle from "components/privacy/do-not-sell-toggle";

export const metadata = {
  title: "Your Privacy Choices",
  description:
    "Manage whether Weird Strange shares your browsing and purchase activity with advertising partners.",
};

export default function PrivacyChoicesPage() {
  return (
    <div className="mx-auto max-w-screen-sm px-1 py-20 text-ws-charcoal md:px-4">
      <h1 className="mb-4 text-2xl font-bold">Your Privacy Choices</h1>
      <p>
        We use third-party advertising and analytics services (including Meta,
        Reddit, and Google) to understand how visitors use our site and to show
        you relevant ads. This may be considered a &ldquo;sale&rdquo; or
        &ldquo;sharing&rdquo; of personal information under some state privacy
        laws. You can opt out below at any time.
      </p>
      <DoNotSellToggle />
    </div>
  );
}
