export const metadata = {
  title: "Coming Soon",
  description: "Something weird and strange is on its way.",
  robots: {
    follow: false,
    index: false,
  },
};

export default function ComingSoonPage() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-ws-cream px-4 text-center text-ws-charcoal">
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
        {process.env.SITE_NAME || "Weird Strange"}
      </h1>
      <p className="max-w-md text-lg">
        Something weird and strange is on its way. Check back soon.
      </p>
    </div>
  );
}
