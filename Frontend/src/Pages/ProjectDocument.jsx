import React from "react";
import {
  FaBullseye,
  FaCheckCircle,
  FaClipboardList,
  FaDatabase,
  FaFileSignature,
  FaLaptopCode,
  FaPrint,
  FaShieldAlt,
  FaUsers,
  FaUserTag,
  FaWallet,
} from "react-icons/fa";
import PublicPageShell from "../components/PublicPageShell";

const overviewPoints = [
  "Restaurant business discovery, operations, and management through one digital platform",
  "Role-based dashboards for administrators, managers, kitchen teams, service staff, inventory teams, accountants, and vendors",
  "Centralized business workflows for staff coordination, stock control, menu handling, reporting, billing, and vendor management",
];

const objectivePoints = [
  "Provide a single platform for restaurant and hospitality operations.",
  "Simplify staff, kitchen, inventory, and billing workflows.",
  "Connect restaurant operators with internal teams and external vendors.",
  "Support operational visibility across departments.",
  "Enable secure access, role management, and business reporting.",
  "Build a scalable restaurant management ecosystem.",
];

const audiencePoints = [
  "Restaurant owners and business operators",
  "Restaurant admins and managers",
  "Chefs, su chefs, waiters, cleaners, accountants, and inventory managers",
  "Vendors and suppliers connected to restaurant operations",
];

const roleSections = [
  {
    title: "Super Admin",
    items: [
      "Manage platform-level oversight and configuration.",
      "Handle subscriptions, user control, and global reporting.",
      "Monitor high-level administrative activity across the system.",
    ],
  },
  {
    title: "Admin",
    items: [
      "Manage restaurant operations, staff, tables, menus, and reports.",
      "Control restaurant-level access and internal management features.",
      "Handle subscriptions and vendor coordination where applicable.",
    ],
  },
  {
    title: "Manager",
    items: [
      "Oversee daily operations and staff activities.",
      "Monitor attendance, analytics, inventory, menu flow, and table management.",
      "Coordinate between kitchen, floor, and administration teams.",
    ],
  },
  {
    title: "Chef and Su Chef",
    items: [
      "Manage kitchen-side operations and execution workflow.",
      "Track inventory-related needs connected to preparation flow.",
      "Coordinate food preparation and internal updates.",
    ],
  },
  {
    title: "Waiter and Cleaner",
    items: [
      "Support restaurant floor workflow and assigned task execution.",
      "Access role-specific notes, attendance, messages, and updates.",
      "Participate in department-level operations through dedicated dashboards.",
    ],
  },
  {
    title: "Accountant and Inventory Manager",
    items: [
      "Handle billing, daily sales records, stock movement, and payment-related activities.",
      "Track inventory workflows and operational control data.",
      "Support financial visibility and resource accountability.",
    ],
  },
  {
    title: "Vendor",
    items: [
      "Participate in vendor onboarding and vendor-side management workflows.",
      "View and manage relevant inventory and business interactions.",
      "Coordinate supply-related activities within the platform structure.",
    ],
  },
];

const paymentPoints = {
  restaurants: [
    "Subscription payments for platform access",
    "Restaurant administration and business usage plans",
    "Future paid upgrades, add-ons, or premium service features where introduced",
  ],
  vendors: [
    "Vendor subscription or access-related payments",
    "Vendor business participation plans where applicable",
    "Future promotional or feature-based billing options if introduced",
  ],
  other: [
    "Platform fees",
    "Convenience or service charges, where applicable",
    "GST or other statutory taxes, where applicable",
  ],
};

const dataCollected = [
  "User information such as name, email, phone number, and profile details",
  "Authentication and session-related details",
  "Employee and role-related records",
  "Attendance, notes, internal messages, and workflow data",
  "Restaurant, menu, inventory, vendor, and order-related information",
  "Billing, subscription, and payment-related records",
  "Device, usage, and application analytics",
];

const dataPurpose = [
  "User Authentication and Account Management",
  "Restaurant Operations and Workflow Management",
  "Inventory, Menu, Vendor, and Billing Coordination",
  "Customer and Internal Support",
  "Platform Improvement and Performance Optimization",
  "Security and Fraud Prevention",
  "Legal, Taxation, and Regulatory Compliance",
];

const platformResponsibilities = [
  "Maintain a secure and role-based digital platform.",
  "Provide access to business management modules and workflows.",
  "Protect user and operational information within the platform environment.",
  "Support platform-level functionality, subscription handling, and system operations.",
];

const userResponsibilities = [
  "Provide accurate account and operational information.",
  "Use the platform only within their authorized role and permissions.",
  "Review records, entries, and actions before submission or confirmation.",
  "Follow internal company policies and business rules outside the software scope.",
];

const limitations = [
  "Internal business disputes among staff, vendors, managers, or owners beyond platform-related issues",
  "Incorrect decisions made from inaccurate data entered by users",
  "Operational losses caused by delayed internal action, missed workflow steps, or human error outside system control",
  "Third-party interruptions, infrastructure issues, force majeure events, or external service downtime",
  "Business policy disputes between restaurants and vendors beyond the platform's technical scope",
];

const ProjectDocument = () => {
  return (
    <PublicPageShell
      eyebrow="Project Document"
      title="EFNBMMS product document for legal review"
      description="A lawyer-style project document page for EFNBMMS, adapted from your Better Pass structure and rewritten for your restaurant business management platform."
      homeOnly
    >
      <div className="grid gap-8">
        <section className="rounded-[2rem] border border-green-100 bg-white/88 p-6 shadow-[0_28px_80px_-48px_rgba(21,128,61,0.42)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-5 border-b border-green-100 pb-6 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-800">
                <FaFileSignature />
                Legal Project Summary
              </div>
              <h2 className="mt-5 text-3xl font-black text-green-950 md:text-4xl">
                EFNBMMS
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600 md:text-base">
                EFNBMMS is presented here as a restaurant and hospitality business management
                software product. This component is structured for lawyer review, ownership
                discussion, policy drafting, and formal project documentation.
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-3 rounded-full bg-green-900 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-green-800 print:hidden"
            >
              <FaPrint />
              Print / Save PDF
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Product", value: "EFNBMMS" },
              { label: "Document Type", value: "Product Document for Legal Review" },
              { label: "Industry", value: "Restaurant and Hospitality Technology" },
              { label: "Prepared For", value: "Lawyer / Legal Documentation" },
            ].map(({ label, value }) => (
              <article
                key={label}
                className="rounded-[1.5rem] border border-green-100 bg-[linear-gradient(145deg,_rgba(255,255,255,0.97),_rgba(240,253,244,0.9))] p-5"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-700/65">
                  {label}
                </p>
                <p className="mt-3 text-sm font-semibold leading-6 text-green-950">{value}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-green-100 bg-white/88 p-7 shadow-xl backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-950 to-green-700 text-lg text-white shadow-lg shadow-green-200/60">
              <FaLaptopCode />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-green-700/65">
                1. Product Overview
              </p>
              <h3 className="text-2xl font-black text-green-950">
                A centralized restaurant business management platform
              </h3>
            </div>
          </div>

          <p className="mt-5 text-sm leading-7 text-gray-700 md:text-base">
            EFNBMMS is a digital platform that enables restaurant businesses to manage operations,
            staff workflows, inventory, menus, billing, vendor coordination, and department-level
            activity through a single web-based application.
          </p>

          <div className="mt-6 grid gap-3">
            {overviewPoints.map((point) => (
              <div
                key={point}
                className="flex items-start gap-3 rounded-[1.35rem] border border-green-100 bg-green-50/65 p-4"
              >
                <FaCheckCircle className="mt-1 shrink-0 text-green-700" />
                <span className="text-sm leading-6 text-gray-700">{point}</span>
              </div>
            ))}
          </div>

          <div className="mt-7 rounded-[1.6rem] border border-green-100 bg-[linear-gradient(180deg,_#052e16_0%,_#166534_100%)] p-6 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-green-100/72">
              Unique Selling Proposition (USP)
            </p>
            <p className="mt-3 text-sm leading-7 text-white/86 md:text-base">
              An all-in-one restaurant business management platform that connects operational teams,
              management, finance, inventory, and vendors through a role-based digital workflow
              system.
            </p>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[2rem] border border-green-100 bg-white/88 p-7 shadow-xl backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-300 via-green-400 to-green-600 text-lg text-green-950 shadow-lg shadow-lime-100">
                <FaBullseye />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-green-700/65">
                  2. Product Objectives
                </p>
                <h3 className="text-2xl font-black text-green-950">Core product goals</h3>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {objectivePoints.map((point) => (
                <div key={point} className="flex items-start gap-3 text-sm leading-6 text-gray-700">
                  <FaCheckCircle className="mt-1 shrink-0 text-green-700" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-green-100 bg-white/88 p-7 shadow-xl backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-lg text-green-900">
                <FaUsers />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-green-700/65">
                  3. Audience and Users on Board
                </p>
                <h3 className="text-2xl font-black text-green-950">Who the platform serves</h3>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {audiencePoints.map((point) => (
                <div
                  key={point}
                  className="rounded-[1.3rem] border border-green-100 bg-[linear-gradient(145deg,_rgba(255,255,255,0.97),_rgba(240,253,244,0.88))] px-4 py-3 text-sm leading-6 text-gray-700"
                >
                  {point}
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-[2rem] border border-green-100 bg-white/88 p-7 shadow-xl backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-950 to-green-700 text-lg text-white shadow-lg shadow-green-200/60">
              <FaClipboardList />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-green-700/65">
                4. Relationship with Business Entity
              </p>
              <h3 className="text-2xl font-black text-green-950">Ownership positioning</h3>
            </div>
          </div>

          <p className="mt-5 text-sm leading-7 text-gray-700 md:text-base">
            EFNBMMS is a technology product developed for restaurant and hospitality business
            operations. If it is being operated under a parent company, brand, or business entity,
            that entity name should be inserted here before sharing the final version with the
            lawyer.
          </p>

          <div className="mt-5 rounded-[1.45rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
            Suggested placeholder: "EFNBMMS is a technology product developed under [Company /
            Business Name], expanding the company's presence in restaurant operations and business
            management technology."
          </div>
        </section>

        <section className="rounded-[2rem] border border-green-100 bg-white/88 p-7 shadow-xl backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-300 via-green-400 to-green-600 text-lg text-green-950 shadow-lg shadow-lime-100">
              <FaUserTag />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-green-700/65">
                5. User Roles
              </p>
              <h3 className="text-2xl font-black text-green-950">Platform roles and functions</h3>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {roleSections.map(({ title, items }) => (
              <article
                key={title}
                className="rounded-[1.6rem] border border-green-100 bg-[linear-gradient(160deg,_rgba(255,255,255,0.98),_rgba(240,253,244,0.9))] p-6"
              >
                <h4 className="text-xl font-bold text-green-950">{title}</h4>
                <div className="mt-4 grid gap-3">
                  {items.map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm leading-6 text-gray-700">
                      <FaCheckCircle className="mt-1 shrink-0 text-green-700" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[2rem] border border-green-100 bg-white/88 p-7 shadow-xl backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-lg text-green-900">
                <FaWallet />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-green-700/65">
                  6. Payment Services
                </p>
                <h3 className="text-2xl font-black text-green-950">Commercial flows</h3>
              </div>
            </div>

            <div className="mt-6 grid gap-5">
              <article className="rounded-[1.45rem] border border-green-100 bg-green-50/55 p-5">
                <h4 className="text-lg font-bold text-green-950">For Restaurant Operators</h4>
                <div className="mt-3 grid gap-2">
                  {paymentPoints.restaurants.map((point) => (
                    <div key={point} className="flex items-start gap-3 text-sm leading-6 text-gray-700">
                      <FaCheckCircle className="mt-1 shrink-0 text-green-700" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-[1.45rem] border border-green-100 bg-green-50/55 p-5">
                <h4 className="text-lg font-bold text-green-950">For Vendors</h4>
                <div className="mt-3 grid gap-2">
                  {paymentPoints.vendors.map((point) => (
                    <div key={point} className="flex items-start gap-3 text-sm leading-6 text-gray-700">
                      <FaCheckCircle className="mt-1 shrink-0 text-green-700" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-[1.45rem] border border-green-100 bg-green-50/55 p-5">
                <h4 className="text-lg font-bold text-green-950">Other Charges</h4>
                <div className="mt-3 grid gap-2">
                  {paymentPoints.other.map((point) => (
                    <div key={point} className="flex items-start gap-3 text-sm leading-6 text-gray-700">
                      <FaCheckCircle className="mt-1 shrink-0 text-green-700" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </article>

          <article className="rounded-[2rem] border border-green-100 bg-[linear-gradient(180deg,_#052e16_0%,_#166534_100%)] p-7 text-white shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-green-100/70">
              Payment Note
            </p>
            <h3 className="mt-4 text-3xl font-black leading-tight">
              Payment gateway details can be inserted before legal finalization
            </h3>
            <p className="mt-4 text-sm leading-7 text-white/82 md:text-base">
              If EFNBMMS uses Razorpay, Stripe, or another payment gateway for subscriptions or
              platform charges, that provider name and payment terms can be added here in the same
              way your Better Pass document mentions Razorpay.
            </p>
          </article>
        </section>

        <section className="rounded-[2rem] border border-green-100 bg-white/88 p-7 shadow-xl backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-950 to-green-700 text-lg text-white shadow-lg shadow-green-200/60">
              <FaDatabase />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-green-700/65">
                7. Data Collected
              </p>
              <h3 className="text-2xl font-black text-green-950">Data and purpose summary</h3>
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <article className="rounded-[1.55rem] border border-green-100 bg-[linear-gradient(145deg,_rgba(255,255,255,0.97),_rgba(240,253,244,0.9))] p-6">
              <h4 className="text-lg font-bold text-green-950">Data</h4>
              <div className="mt-4 grid gap-3">
                {dataCollected.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm leading-6 text-gray-700">
                    <FaCheckCircle className="mt-1 shrink-0 text-green-700" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[1.55rem] border border-green-100 bg-[linear-gradient(145deg,_rgba(255,255,255,0.97),_rgba(240,253,244,0.9))] p-6">
              <h4 className="text-lg font-bold text-green-950">Purpose</h4>
              <div className="mt-4 grid gap-3">
                {dataPurpose.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm leading-6 text-gray-700">
                    <FaCheckCircle className="mt-1 shrink-0 text-green-700" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="mt-6 rounded-[1.45rem] border border-green-100 bg-green-50/65 p-5 text-sm leading-7 text-gray-700">
            For security and infrastructure, database, storage, and authentication service details
            can be inserted here if you want the final legal wording to mention the actual provider.
            If you use Supabase, MongoDB, or any other infrastructure, we can add that exact line
            next.
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
          <article className="rounded-[2rem] border border-green-100 bg-white/88 p-7 shadow-xl backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-lg text-green-900">
                <FaShieldAlt />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-green-700/65">
                  Platform Responsibilities
                </p>
                <h3 className="text-2xl font-black text-green-950">What the platform covers</h3>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {platformResponsibilities.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.3rem] border border-green-100 bg-green-50/60 px-4 py-3 text-sm leading-6 text-gray-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-green-100 bg-white/88 p-7 shadow-xl backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-lg text-green-900">
                <FaUsers />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-green-700/65">
                  User Responsibilities
                </p>
                <h3 className="text-2xl font-black text-green-950">What users must handle</h3>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {userResponsibilities.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.3rem] border border-green-100 bg-green-50/60 px-4 py-3 text-sm leading-6 text-gray-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-[2rem] border border-green-100 bg-white/88 p-7 shadow-xl backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-300 via-green-400 to-green-600 text-lg text-green-950 shadow-lg shadow-lime-100">
              <FaShieldAlt />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-green-700/65">
                Limitations of Responsibility
              </p>
              <h3 className="text-2xl font-black text-green-950">Scope limitations</h3>
            </div>
          </div>

          <p className="mt-5 text-sm leading-7 text-gray-700 md:text-base">
            EFNBMMS serves as a software platform for business and operational management and is not
            responsible for the following beyond platform-related matters:
          </p>

          <div className="mt-6 grid gap-3">
            {limitations.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-[1.35rem] border border-green-100 bg-[linear-gradient(145deg,_rgba(255,255,255,0.97),_rgba(240,253,244,0.9))] p-4"
              >
                <FaCheckCircle className="mt-1 shrink-0 text-green-700" />
                <span className="text-sm leading-6 text-gray-700">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[1.45rem] border border-green-100 bg-green-50/65 p-5 text-sm leading-7 text-gray-700">
            Refunds, billing disputes, employee discipline issues, vendor conflicts, or internal
            business policy disagreements should ultimately be governed by the operating business
            policies, contracts, and applicable law rather than by the software platform alone.
          </div>
        </section>
      </div>
    </PublicPageShell>
  );
};

export default ProjectDocument;
