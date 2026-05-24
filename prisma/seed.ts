import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const sara = await prisma.author.upsert({
    where: { email: "sara.johnson@gmail.com" },
    update: {},
    create: {
      id: "3e2b5344-0a38-4a0b-a656-4d09f89a1001",
      fullName: "Sara Johnson",
      email: "sara.johnson@gmail.com",
      phone: "+919812345001",
      instagramHandle: "@sarapoetry23",
      dashboardUserId: "dash_sara_001",
      metadata: { segment: "debut_author", city: "Bengaluru" },
      identities: {
        create: [
          {
            type: "EMAIL",
            value: "sara.johnson@gmail.com",
            normalizedValue: "sara.johnson@gmail.com",
            source: "EMAIL",
            verified: true,
          },
          {
            type: "INSTAGRAM",
            value: "@sarapoetry23",
            normalizedValue: "sarapoetry23",
            source: "INSTAGRAM",
            verified: true,
          },
        ],
      },
    },
  });

  const arjun = await prisma.author.upsert({
    where: { email: "arjun.mehta@outlook.com" },
    update: {},
    create: {
      id: "3e2b5344-0a38-4a0b-a656-4d09f89a1002",
      fullName: "Arjun Mehta",
      email: "arjun.mehta@outlook.com",
      phone: "+919812345002",
      instagramHandle: "@arjunwrites",
      dashboardUserId: "dash_arjun_002",
      metadata: { segment: "premium_pr", city: "Mumbai" },
    },
  });

  const nisha = await prisma.author.upsert({
    where: { email: "nisha.kapoor@gmail.com" },
    update: {},
    create: {
      id: "3e2b5344-0a38-4a0b-a656-4d09f89a1003",
      fullName: "Nisha Kapoor",
      email: "nisha.kapoor@gmail.com",
      phone: "+919812345003",
      instagramHandle: "@nishapoems",
      dashboardUserId: "dash_nisha_003",
      metadata: { segment: "returning_author", city: "Delhi" },
    },
  });

  await prisma.book.upsert({
    where: { id: "9b8369d6-16d5-40d7-a5fd-7dc17f350001" },
    update: {},
    create: {
      id: "9b8369d6-16d5-40d7-a5fd-7dc17f350001",
      authorId: sara.id,
      title: "Dreams of Fire",
      status: "LIVE",
      isbn: "978-93-5891-421-7",
      royaltyStatus: "PROCESSING",
      royaltyAmountDue: "7420.50",
      royaltyPayoutDate: new Date("2026-05-31T00:00:00+05:30"),
      addOnServices: {
        editing: "COMPLETED",
        cover_design: "COMPLETED",
        pr_package: "IN_PROGRESS",
      },
      finalSubmissionDate: new Date("2026-03-05T00:00:00+05:30"),
      bookLiveDate: new Date("2026-04-19T00:00:00+05:30"),
      authorCopyStatus: "DISPATCHED",
      authorCopyTracking: "BL-DTDC-782911",
      prPackageStatus: "IN_PROGRESS",
      salesReportUrl: "https://bookleaf.example/reports/dreams-of-fire",
    },
  });

  await prisma.book.upsert({
    where: { id: "9b8369d6-16d5-40d7-a5fd-7dc17f350002" },
    update: {},
    create: {
      id: "9b8369d6-16d5-40d7-a5fd-7dc17f350002",
      authorId: arjun.id,
      title: "The Monsoon Letters",
      status: "PROOF_REVIEW",
      royaltyStatus: "NOT_DUE",
      addOnServices: {
        editing: "COMPLETED",
        cover_design: "REVISION_REQUESTED",
        pr_package: "NOT_STARTED",
      },
      finalSubmissionDate: new Date("2026-04-28T00:00:00+05:30"),
    },
  });

  await prisma.book.upsert({
    where: { id: "9b8369d6-16d5-40d7-a5fd-7dc17f350003" },
    update: {},
    create: {
      id: "9b8369d6-16d5-40d7-a5fd-7dc17f350003",
      authorId: nisha.id,
      title: "Paper Boats at Dawn",
      status: "ISBN_ASSIGNED",
      isbn: "978-93-5891-555-9",
      royaltyStatus: "PAID",
      royaltyPayoutDate: new Date("2026-04-30T00:00:00+05:30"),
      addOnServices: {
        editing: "COMPLETED",
        cover_design: "COMPLETED",
        author_copies: "QUEUED",
      },
      finalSubmissionDate: new Date("2026-04-01T00:00:00+05:30"),
      authorCopyStatus: "QUEUED",
      prPackageStatus: "SCHEDULED",
      dashboardStatus: "PASSWORD_RESET_REQUIRED",
    },
  });

  await prisma.knowledgeDocument.upsert({
    where: { checksum: "seed-publishing-timeline-v1" },
    update: {},
    create: {
      title: "Publishing Timeline SLA",
      source: "seed://publishing-timeline",
      category: "TIMELINE",
      checksum: "seed-publishing-timeline-v1",
      metadata: { owner: "operations" },
      chunks: {
        create: [
          {
            content:
              "After final manuscript submission, BookLeaf normally completes editorial QA, design handoff, proof review, ISBN assignment, listing, and live publication within 30 to 45 business days. Delays can occur when author proof approval or cover revisions are pending.",
            tokenCount: 39,
            metadata: { section: "standard_sla" },
          },
        ],
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
