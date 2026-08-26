import Header from "../components/Header";

const sections = [
  {
    title: "Information We Collect",
    body:
      "We may collect account details, restaurant information, employee and vendor details, billing records, inventory activity, and support messages that are submitted through the platform.",
  },
  {
    title: "How We Use Information",
    body:
      "We use this information to operate restaurant workflows, manage users and permissions, process billing and inventory activity, support vendor coordination, improve system performance, and respond to service requests.",
  },
  {
    title: "Sharing Of Information",
    body:
      "We do not share business data except when required for platform operation, payment processing, legal compliance, security review, or support services that help deliver the product.",
  },
  {
    title: "Data Security",
    body:
      "We use reasonable administrative and technical safeguards to protect account, billing, and operations data. No internet-based system can be guaranteed fully secure, but we work to reduce risk and unauthorized access.",
  },
  {
    title: "Your Responsibilities",
    body:
      "Restaurants are responsible for keeping user access accurate, protecting login credentials, and entering only the data needed for lawful business operations.",
  },
  {
    title: "Contact",
    body:
      "For privacy questions, requests, or corrections, contact EFNBMMS support using the contact information provided on the website.",
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6f1ea_0%,#fffaf5_48%,#f3efe8_100%)] text-[#21160f]">
      <Header />

      <main className="px-4 pb-16 pt-28 md:px-8">
        <section className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-[#d9cbb9] bg-white/88 shadow-[0_30px_90px_-50px_rgba(35,20,12,0.45)] backdrop-blur">
          <div className="border-b border-[#eadfce] bg-[radial-gradient(circle_at_top_left,#f8e7c9,transparent_42%),linear-gradient(135deg,#fffaf3,#f5ede2)] px-6 py-10 md:px-10">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#a45d23]">
              Legal
            </p>
            <h1 className="mt-3 text-3xl font-black text-[#24140d] md:text-5xl">
              Privacy Policy
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#6b5445] md:text-base">
              This policy explains how EFNBMMS handles information related to restaurant
              operations, staff accounts, vendors, billing, inventory, and support activity.
            </p>
          </div>

          <div className="grid gap-6 px-6 py-8 md:px-10 md:py-10">
            {sections.map((section) => (
              <article
                key={section.title}
                className="rounded-[1.5rem] border border-[#ede2d3] bg-[#fffdfa] p-5 shadow-sm"
              >
                <h2 className="text-lg font-black text-[#2d1b12] md:text-xl">
                  {section.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#6a5648] md:text-[15px]">
                  {section.body}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
