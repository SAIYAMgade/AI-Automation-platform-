import type { AuthorRecord, ConversationSummary, RetrievedKnowledgeChunk } from "@/types/domain";

export const mockAuthors: AuthorRecord[] = [
  {
    id: "3e2b5344-0a38-4a0b-a656-4d09f89a1001",
    fullName: "Sara Johnson",
    email: "sara.johnson@gmail.com",
    phone: "+919812345001",
    instagramHandle: "@sarapoetry23",
    dashboardUserId: "dash_sara_001",
    locale: "en-IN",
    metadata: { segment: "debut_author", city: "Bengaluru" },
    books: [
      {
        id: "9b8369d6-16d5-40d7-a5fd-7dc17f350001",
        authorId: "3e2b5344-0a38-4a0b-a656-4d09f89a1001",
        title: "Dreams of Fire",
        status: "LIVE",
        isbn: "978-93-5891-421-7",
        royaltyStatus: "PROCESSING",
        royaltyAmountDue: 7420.5,
        royaltyPayoutDate: "2026-05-31T00:00:00+05:30",
        addOnServices: {
          editing: "COMPLETED",
          cover_design: "COMPLETED",
          pr_package: "IN_PROGRESS",
        },
        finalSubmissionDate: "2026-03-05T00:00:00+05:30",
        bookLiveDate: "2026-04-19T00:00:00+05:30",
        authorCopyStatus: "DISPATCHED",
        authorCopyTracking: "BL-DTDC-782911",
        prPackageStatus: "IN_PROGRESS",
        dashboardStatus: "ACTIVE",
        salesReportUrl: "https://bookleaf.example/reports/dreams-of-fire",
      },
    ],
  },
  {
    id: "3e2b5344-0a38-4a0b-a656-4d09f89a1002",
    fullName: "Arjun Mehta",
    email: "arjun.mehta@outlook.com",
    phone: "+919812345002",
    instagramHandle: "@arjunwrites",
    dashboardUserId: "dash_arjun_002",
    locale: "en-IN",
    metadata: { segment: "premium_pr", city: "Mumbai" },
    books: [
      {
        id: "9b8369d6-16d5-40d7-a5fd-7dc17f350002",
        authorId: "3e2b5344-0a38-4a0b-a656-4d09f89a1002",
        title: "The Monsoon Letters",
        status: "PROOF_REVIEW",
        royaltyStatus: "NOT_DUE",
        royaltyAmountDue: 0,
        addOnServices: {
          editing: "COMPLETED",
          cover_design: "REVISION_REQUESTED",
          pr_package: "NOT_STARTED",
        },
        finalSubmissionDate: "2026-04-28T00:00:00+05:30",
        authorCopyStatus: "NOT_DISPATCHED",
        prPackageStatus: "NOT_STARTED",
        dashboardStatus: "ACTIVE",
      },
    ],
  },
  {
    id: "3e2b5344-0a38-4a0b-a656-4d09f89a1003",
    fullName: "Nisha Kapoor",
    email: "nisha.kapoor@gmail.com",
    phone: "+919812345003",
    instagramHandle: "@nishapoems",
    dashboardUserId: "dash_nisha_003",
    locale: "en-IN",
    metadata: { segment: "returning_author", city: "Delhi" },
    books: [
      {
        id: "9b8369d6-16d5-40d7-a5fd-7dc17f350003",
        authorId: "3e2b5344-0a38-4a0b-a656-4d09f89a1003",
        title: "Paper Boats at Dawn",
        status: "ISBN_ASSIGNED",
        isbn: "978-93-5891-555-9",
        royaltyStatus: "PAID",
        royaltyAmountDue: 0,
        royaltyPayoutDate: "2026-04-30T00:00:00+05:30",
        addOnServices: {
          editing: "COMPLETED",
          cover_design: "COMPLETED",
          author_copies: "QUEUED",
        },
        finalSubmissionDate: "2026-04-01T00:00:00+05:30",
        authorCopyStatus: "QUEUED",
        prPackageStatus: "SCHEDULED",
        dashboardStatus: "PASSWORD_RESET_REQUIRED",
      },
    ],
  },
];

export const mockKnowledgeChunks: RetrievedKnowledgeChunk[] = [
  {
    id: "kb-timeline-1",
    documentId: "kb-doc-timeline",
    title: "Publishing Timeline SLA",
    category: "TIMELINE",
    similarity: 0.91,
    content:
      "After final manuscript submission, BookLeaf normally completes editorial QA, design handoff, proof review, ISBN assignment, listing, and live publication within 30 to 45 business days. Delays can occur when author proof approval or cover revisions are pending.",
  },
  {
    id: "kb-royalty-1",
    documentId: "kb-doc-royalty",
    title: "Royalty Payout Process",
    category: "ROYALTY",
    similarity: 0.89,
    content:
      "Royalty statements are reconciled monthly after sales channels report settled sales. Eligible payouts are processed by the last business day of the following month, provided bank and tax details are verified.",
  },
  {
    id: "kb-isbn-1",
    documentId: "kb-doc-isbn",
    title: "ISBN Assignment Policy",
    category: "ISBN",
    similarity: 0.87,
    content:
      "ISBNs are generated after final title metadata, author name, imprint, trim size, and category are approved. A missing ISBN usually means metadata validation or proof approval is still pending.",
  },
  {
    id: "kb-pr-1",
    documentId: "kb-doc-pr",
    title: "PR Package Workflow",
    category: "ADDON",
    similarity: 0.85,
    content:
      "PR packages begin after the book has a confirmed live date or approved release date. Campaign setup includes media kit creation, channel targeting, and distribution calendar confirmation.",
  },
  {
    id: "kb-author-copy-1",
    documentId: "kb-doc-author-copy",
    title: "Author Copy Fulfillment",
    category: "FULFILLMENT",
    similarity: 0.84,
    content:
      "Author copies move from print queue to quality check and dispatch. Once dispatched, tracking usually appears within 24 hours and courier delivery depends on destination serviceability.",
  },
  {
    id: "kb-company-1",
    documentId: "kb-doc-company",
    title: "BookLeaf Company Overview",
    category: "COMPANY",
    similarity: 0.88,
    content:
      "BookLeaf helps authors publish books through assisted publishing workflows that include manuscript onboarding, editorial QA, cover coordination, ISBN and listing support, author copy fulfillment, royalty reconciliation, and optional PR or marketing add-ons.",
  },
  {
    id: "kb-pricing-1",
    documentId: "kb-doc-pricing",
    title: "Publishing Package Cost Policy",
    category: "PRICING",
    similarity: 0.86,
    content:
      "BookLeaf package costs depend on the selected publishing plan, manuscript scope, print specifications, and add-on services such as editing, cover design, author copies, or PR. Exact invoice amounts must be verified from the author's account or by a support specialist.",
  },
  {
    id: "kb-challenge-overview-1",
    documentId: "kb-doc-assignment-kb",
    title: "21-Day Writing Challenge Overview",
    category: "GETTING_STARTED",
    similarity: 0.9,
    content:
      "Authors can join the BookLeaf 21-Day Writing Challenge from the BookLeaf challenge page, complete registration, and pay the publishing package fee. The challenge is designed to help authors complete a poetry manuscript with daily writing momentum. BookLeaf allows pen names as long as the final author name is consistently used in metadata, cover, and dashboard submission. Authors who do not want the challenge can still publish through BookLeaf's assisted publishing workflow.",
  },
  {
    id: "kb-package-1999-1",
    documentId: "kb-doc-assignment-kb",
    title: "Rs. 1999 Publishing Package",
    category: "PAYMENTS_REFUNDS",
    similarity: 0.9,
    content:
      "The Rs. 1999 publishing package covers participation in the writing challenge and core publishing workflow access. It typically includes dashboard access, guided poem submission, cover setup tools, basic book setup, and publishing workflow support. It does not automatically include every premium add-on such as advanced PR, award submissions, bestseller campaigns, extra author copies, or custom services unless those are purchased separately.",
  },
  {
    id: "kb-refunds-upgrades-1",
    documentId: "kb-doc-assignment-kb",
    title: "Payments, Refunds, and Upgrades",
    category: "PAYMENTS_REFUNDS",
    similarity: 0.88,
    content:
      "Refund eligibility depends on BookLeaf's active payment policy and whether publishing work has already started. If an author changes their mind, support should verify the payment stage before promising a refund. Authors can usually upgrade later with add-on services such as editing, cover design, PR, award support, bestseller package, or additional copies when those services are available for the current workflow stage.",
  },
  {
    id: "kb-dashboard-login-1",
    documentId: "kb-doc-assignment-kb",
    title: "Dashboard Login and Access",
    category: "DASHBOARD_SUBMISSION",
    similarity: 0.89,
    content:
      "If an author did not receive dashboard login details, they should check spam and promotions folders first, then contact support with the registered email or phone number. If they forgot the password, they should use the password reset option on the dashboard login page. If reset email is not received, support should verify the author identity and trigger a manual reset.",
  },
  {
    id: "kb-writing-saving-poems-1",
    documentId: "kb-doc-assignment-kb",
    title: "Writing, Saving, and Submitting Poems",
    category: "DASHBOARD_SUBMISSION",
    similarity: 0.89,
    content:
      "Authors submit poems through the BookLeaf dashboard by entering each poem in the submission area and saving progress. Hindi poems are acceptable when the dashboard and publishing workflow support the selected script/font. Authors should save progress after each poem. Rearranging poems is usually possible before final submission; after final submission, changes may require support review.",
  },
  {
    id: "kb-finalizing-submission-1",
    documentId: "kb-doc-assignment-kb",
    title: "Finalizing Submission",
    category: "DASHBOARD_SUBMISSION",
    similarity: 0.88,
    content:
      "After all poems are submitted, authors should review poem order, spelling, author details, cover information, and back cover text before finalizing. Once final submission is completed, BookLeaf starts the publishing workflow such as editorial QA, cover setup checks, metadata validation, ISBN/listing steps, and production scheduling.",
  },
  {
    id: "kb-cover-creator-1",
    documentId: "kb-doc-assignment-kb",
    title: "Cover Creator Tool",
    category: "COVER_DESIGN",
    similarity: 0.87,
    content:
      "Authors can design their cover in the BookLeaf cover creator by choosing an available template, updating title and author name, and reviewing the preview. If only four templates are visible, those are the templates currently available for that workflow. Authors may upload their own cover only if the selected package/workflow supports custom cover upload and the file meets print requirements.",
  },
  {
    id: "kb-back-cover-author-info-1",
    documentId: "kb-doc-assignment-kb",
    title: "Back Cover and Author Information",
    category: "COVER_DESIGN",
    similarity: 0.87,
    content:
      "Back cover text should briefly describe the book, theme, or author voice. Authors can upload a profile photo when the dashboard provides that option and the image meets quality guidelines. Back cover text can usually be edited or removed before final submission; after finalization, support should verify whether production has started before changing it.",
  },
  {
    id: "kb-publishing-distribution-1",
    documentId: "kb-doc-assignment-kb",
    title: "Publishing Timeline and Distribution",
    category: "PUBLISHING_DISTRIBUTION",
    similarity: 0.9,
    content:
      "BookLeaf publishing timelines depend on final submission date, proof review, cover readiness, metadata validation, ISBN/listing steps, and add-ons. Standard publishing can take several weeks after final submission. The Rs. 8899 add-on may provide a faster or enhanced workflow when available, but the exact timeline should be checked against the author's package and current production queue.",
  },
  {
    id: "kb-sales-royalties-1",
    documentId: "kb-doc-assignment-kb",
    title: "Sales and Royalties",
    category: "PUBLISHING_DISTRIBUTION",
    similarity: 0.9,
    content:
      "Books may be made available through BookLeaf-supported sales and distribution channels after publishing and listing approval. Royalty rate and report timing depend on the author's package, sales channel reporting cycle, and settled sales. Royalty reports are generally shared after sales data is reconciled; account-specific royalty status must be checked in author records.",
  },
  {
    id: "kb-ownership-copyright-1",
    documentId: "kb-doc-assignment-kb",
    title: "Ownership and Copyright",
    category: "POLICIES_SUPPORT",
    similarity: 0.88,
    content:
      "Authors retain ownership of their original writing unless a separate written agreement says otherwise. BookLeaf's role is to support publishing, production, listing, and related services. Copyright or legal disputes should always be escalated to a human support specialist for careful review.",
  },
  {
    id: "kb-technical-support-1",
    documentId: "kb-doc-assignment-kb",
    title: "Technical Issues and Support",
    category: "POLICIES_SUPPORT",
    similarity: 0.88,
    content:
      "If the dashboard is not working, authors should try refreshing, clearing cache, switching browser/device, and checking internet connectivity. If the portal is still not loading, they should contact support with registered email, phone number, screenshot, and issue description. Email submission should be treated as an exception and accepted only after support confirms the portal issue and author identity.",
  },
];

export const mockConversations: ConversationSummary[] = [
  {
    id: "7d35cf31-929f-47e8-a25d-19f3261b4001",
    authorName: "Sara Johnson",
    channel: "DASHBOARD",
    status: "OPEN",
    intent: "ROYALTY_STATUS",
    confidence: 0.93,
    lastMessage: "When will my royalty arrive for Dreams of Fire?",
    createdAt: "2026-05-20T09:10:00.000Z",
    updatedAt: "2026-05-20T09:11:00.000Z",
  },
  {
    id: "7d35cf31-929f-47e8-a25d-19f3261b4002",
    authorName: "Arjun Mehta",
    channel: "WHATSAPP",
    status: "ESCALATED",
    intent: "ADDON_STATUS",
    confidence: 0.67,
    lastMessage: "Did my PR package start?",
    createdAt: "2026-05-20T08:45:00.000Z",
    updatedAt: "2026-05-20T08:47:00.000Z",
  },
];
