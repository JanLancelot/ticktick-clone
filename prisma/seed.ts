import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  ProjectKind,
  ProjectView,
  TaskStatus,
  TaskPriority,
  MemberRole,
  HabitFrequency,
  HabitStatus,
  FocusType
} from "../src/app/_generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Starting database seeding...");

  // 1. Database Cleanup
  console.log("🧹 Cleaning up database tables in order of dependencies...");
  await prisma.tagTask.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.focusRecord.deleteMany();
  await prisma.habitRecord.deleteMany();
  await prisma.habit.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Cleanup complete!");

  // 2. Create Users
  console.log("👤 Creating user accounts...");
  const userJane = await prisma.user.create({
    data: {
      email: "jane@example.com",
      name: "Jane Doe",
      passwordHash: "$2b$10$xyz123abc456def789ghiO5a8c9d10e11f12g13h14i15j16k17l", // mock bcrypt hash
      timezone: "America/New_York",
    },
  });

  const userJohn = await prisma.user.create({
    data: {
      email: "john@example.com",
      name: "John Smith",
      passwordHash: "$2b$10$xyz123abc456def789ghiO5a8c9d10e11f12g13h14i15j16k17l",
      timezone: "Europe/London",
    },
  });

  // 3. Create Folders for Jane Doe
  console.log("📂 Creating task folders...");
  const folderWork = await prisma.folder.create({
    data: {
      name: "💼 Work & Projects",
      userId: userJane.id,
      sortOrder: 1.0,
    },
  });

  const folderPersonal = await prisma.folder.create({
    data: {
      name: "✨ Personal Life",
      userId: userJane.id,
      sortOrder: 2.0,
    },
  });

  // 4. Create Projects
  console.log("🎯 Creating projects and default inbox lists...");
  // Jane's Projects
  const inboxJane = await prisma.project.create({
    data: {
      name: "Inbox",
      kind: ProjectKind.INBOX,
      view: ProjectView.LIST,
      isDefault: true,
      userId: userJane.id,
      sortOrder: 0.0,
    },
  });

  const projectClone = await prisma.project.create({
    data: {
      name: "🎯 NextJS TickTick Clone",
      color: "#4F46E5",
      icon: "target",
      kind: ProjectKind.PROJECT,
      view: ProjectView.KANBAN,
      userId: userJane.id,
      folderId: folderWork.id,
      sortOrder: 1.0,
    },
  });

  const projectGroceries = await prisma.project.create({
    data: {
      name: "🛍️ Weekly Groceries",
      color: "#10B981",
      icon: "shopping-bag",
      kind: ProjectKind.LIST,
      view: ProjectView.LIST,
      userId: userJane.id,
      folderId: folderPersonal.id,
      sortOrder: 1.0,
    },
  });

  const projectRoadmap = await prisma.project.create({
    data: {
      name: "📅 Work Roadmap",
      color: "#F59E0B",
      icon: "calendar",
      kind: ProjectKind.PROJECT,
      view: ProjectView.TIMELINE,
      userId: userJane.id,
      folderId: folderWork.id,
      sortOrder: 2.0,
    },
  });

  const projectFitness = await prisma.project.create({
    data: {
      name: "💪 Healthy Lifestyle",
      color: "#EF4444",
      icon: "heart",
      kind: ProjectKind.PROJECT,
      view: ProjectView.CALENDAR,
      userId: userJane.id,
      folderId: folderPersonal.id,
      sortOrder: 2.0,
    },
  });

  // John's Projects
  const inboxJohn = await prisma.project.create({
    data: {
      name: "Inbox",
      kind: ProjectKind.INBOX,
      view: ProjectView.LIST,
      isDefault: true,
      userId: userJohn.id,
      sortOrder: 0.0,
    },
  });

  // 5. Establish Project Membership (Collaborative list)
  console.log("🤝 Setting up project collaborations...");
  await prisma.projectMember.create({
    data: {
      role: MemberRole.EDITOR,
      projectId: projectClone.id,
      userId: userJohn.id,
    },
  });

  // 6. Create Tags
  console.log("🏷️ Creating categories/tags...");
  const tagUrgent = await prisma.tag.create({
    data: {
      name: "urgent",
      color: "#EF4444",
      userId: userJane.id,
      sortOrder: 1.0,
    },
  });

  const tagQuick = await prisma.tag.create({
    data: {
      name: "quick",
      color: "#3B82F6",
      userId: userJane.id,
      sortOrder: 2.0,
    },
  });

  const tagDeepWork = await prisma.tag.create({
    data: {
      name: "deep-work",
      color: "#8B5CF6",
      userId: userJane.id,
      sortOrder: 3.0,
    },
  });

  // 7. Seed Tasks
  console.log("📝 Populating tasks and checklists...");
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  // 7.1. Inbox Tasks
  const taskBuyMilk = await prisma.task.create({
    data: {
      title: "Buy organic whole milk",
      status: TaskStatus.NORMAL,
      priority: TaskPriority.NONE,
      projectId: inboxJane.id,
      sortOrder: 1.0,
    },
  });

  const taskDentist = await prisma.task.create({
    data: {
      title: "Call dentist to reschedule appointment",
      content: "Reschedule the routine cleaning originally planned for next Tuesday. Preferred times: morning between 9 AM and 11 AM.",
      status: TaskStatus.NORMAL,
      priority: TaskPriority.MEDIUM,
      dueDate: tomorrow,
      isAllDay: false,
      timezone: "America/New_York",
      projectId: inboxJane.id,
      sortOrder: 2.0,
    },
  });

  // Add a reminder to dentist task
  await prisma.reminder.create({
    data: {
      triggerAt: new Date(tomorrow.getTime() - 2 * 60 * 60 * 1000), // 2 hours before dentist call
      taskId: taskDentist.id,
    },
  });

  const taskNextjs = await prisma.task.create({
    data: {
      title: "Watch Next.js 15 routing tutorial",
      content: "Reviewed the new app router updates and Server Action form state enhancements.",
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.LOW,
      completedAt: yesterday,
      projectId: inboxJane.id,
      sortOrder: 3.0,
    },
  });

  // 7.2. Project: NextJS TickTick Clone Tasks
  const taskLandingPage = await prisma.task.create({
    data: {
      title: "Design landing page with modern dark mode & glassmorphism",
      content: "Create a breathtaking experience with Outfit font, harmony hues, smooth card gradients, and subtle hover scale animations.",
      status: TaskStatus.NORMAL,
      priority: TaskPriority.HIGH,
      projectId: projectClone.id,
      sortOrder: 1.0,
    },
  });

  // Associate deep-work tag
  await prisma.tagTask.create({
    data: {
      tagId: tagDeepWork.id,
      taskId: taskLandingPage.id,
    },
  });

  const taskPrismaSetup = await prisma.task.create({
    data: {
      title: "Setup Prisma ORM and seed database",
      content: "Configure PostgreSQL and prepare sample data for local testing.",
      status: TaskStatus.NORMAL,
      priority: TaskPriority.HIGH,
      projectId: projectClone.id,
      sortOrder: 2.0,
    },
  });

  // Associate urgent tag
  await prisma.tagTask.create({
    data: {
      tagId: tagUrgent.id,
      taskId: taskPrismaSetup.id,
    },
  });

  // Create Subtasks for Prisma Setup
  const subtaskSchema = await prisma.task.create({
    data: {
      title: "Define relational schema models in schema.prisma",
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.NONE,
      parentId: taskPrismaSetup.id,
      projectId: projectClone.id,
      sortOrder: 1.0,
      completedAt: yesterday,
    },
  });

  const subtaskConfig = await prisma.task.create({
    data: {
      title: "Configure prisma.config.ts for Prisma 7 compliance",
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.NONE,
      parentId: taskPrismaSetup.id,
      projectId: projectClone.id,
      sortOrder: 2.0,
      completedAt: now,
    },
  });

  const subtaskSeed = await prisma.task.create({
    data: {
      title: "Write rich and compliant seed.ts script",
      status: TaskStatus.NORMAL,
      priority: TaskPriority.NONE,
      parentId: taskPrismaSetup.id,
      projectId: projectClone.id,
      sortOrder: 3.0,
    },
  });

  const taskFocusPage = await prisma.task.create({
    data: {
      title: "Implement Focus/Pomodoro tracking page",
      content: "Includes interactive countdown, audio notification sound, statistics summary chart.",
      status: TaskStatus.NORMAL,
      priority: TaskPriority.MEDIUM,
      projectId: projectClone.id,
      sortOrder: 3.0,
    },
  });

  // Associate quick tag
  await prisma.tagTask.create({
    data: {
      tagId: tagQuick.id,
      taskId: taskFocusPage.id,
    },
  });

  // Add Focus Record for Jane Doe on Focus Page task
  await prisma.focusRecord.create({
    data: {
      type: FocusType.POMODORO,
      duration: 1500, // 25 mins
      startedAt: new Date(now.getTime() - 40 * 60 * 1000), // started 40 mins ago
      endedAt: new Date(now.getTime() - 15 * 60 * 1000), // ended 15 mins ago
      userId: userJane.id,
      taskId: taskFocusPage.id,
    },
  });

  const taskMobileResp = await prisma.task.create({
    data: {
      title: "Fix mobile responsiveness on dashboard sidebar navigation",
      content: "Use tailwind screen sizes or custom media queries to collapse sidebar on small devices.",
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.HIGH,
      projectId: projectClone.id,
      sortOrder: 4.0,
      completedAt: yesterday,
    },
  });

  // 7.3. Project: Weekly Groceries Tasks
  await prisma.task.create({
    data: {
      title: "Avocado (x4) - ripe",
      status: TaskStatus.NORMAL,
      priority: TaskPriority.NONE,
      projectId: projectGroceries.id,
      sortOrder: 1.0,
    },
  });

  await prisma.task.create({
    data: {
      title: "Fresh spinach leaves",
      status: TaskStatus.NORMAL,
      priority: TaskPriority.NONE,
      projectId: projectGroceries.id,
      sortOrder: 2.0,
    },
  });

  await prisma.task.create({
    data: {
      title: "Sourdough bread loaf",
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.LOW,
      projectId: projectGroceries.id,
      sortOrder: 3.0,
      completedAt: yesterday,
    },
  });

  // 7.4. Project: Work Roadmap Tasks (Timeline)
  const startOfWeek = new Date();
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  const endOfWeek = new Date();
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday

  const taskArchPlan = await prisma.task.create({
    data: {
      title: "Q2 Architecture & Service Planning",
      content: "Review system block diagrams, microservice bounds, and data caching policy.",
      status: TaskStatus.NORMAL,
      priority: TaskPriority.HIGH,
      startDate: startOfWeek,
      dueDate: endOfWeek,
      isAllDay: true,
      projectId: projectRoadmap.id,
      sortOrder: 1.0,
    },
  });

  // Add PDF attachment to Architecture Planning
  await prisma.attachment.create({
    data: {
      fileName: "architecture_proposal.pdf",
      fileUrl: "https://example.com/files/architecture_proposal.pdf",
      fileSize: 1245000,
      mimeType: "application/pdf",
      taskId: taskArchPlan.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Sprint 5 Engineering Team Retrospective",
      content: "Highlight wins, friction points, and action items for next sprint cycles.",
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.MEDIUM,
      startDate: yesterday,
      dueDate: yesterday,
      isAllDay: true,
      projectId: projectRoadmap.id,
      sortOrder: 2.0,
      completedAt: yesterday,
    },
  });

  // 7.5. Project: Healthy Lifestyle Tasks (Calendar)
  await prisma.task.create({
    data: {
      title: "Cardio: 5km morning run",
      content: "Keep steady heart rate in zone 3 (130-150 bpm). Goal: sub 28 mins.",
      status: TaskStatus.NORMAL,
      priority: TaskPriority.MEDIUM,
      startDate: tomorrow,
      dueDate: tomorrow,
      isAllDay: true,
      projectId: projectFitness.id,
      sortOrder: 1.0,
    },
  });

  await prisma.task.create({
    data: {
      title: "Weight training: Upper body strength",
      content: "Bench press, shoulder press, pull-ups, and bicep curls.",
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.HIGH,
      startDate: yesterday,
      dueDate: yesterday,
      isAllDay: true,
      projectId: projectFitness.id,
      sortOrder: 2.0,
      completedAt: yesterday,
    },
  });

  // 8. Seed Habits & Habit Completion Records
  console.log("🔄 Seeding habits and tracking history...");
  const habitWater = await prisma.habit.create({
    data: {
      name: "Drink 8 glasses of water",
      icon: "droplet",
      color: "#3B82F6",
      status: HabitStatus.ACTIVE,
      frequency: HabitFrequency.DAILY,
      goal: 8,
      unit: "glasses",
      reminderTime: "08:00",
      userId: userJane.id,
    },
  });

  const d2 = new Date();
  d2.setDate(now.getDate() - 2);
  const d1 = new Date();
  d1.setDate(now.getDate() - 1);

  await prisma.habitRecord.createMany({
    data: [
      {
        habitId: habitWater.id,
        date: d2,
        value: 8,
      },
      {
        habitId: habitWater.id,
        date: d1,
        value: 6,
      },
      {
        habitId: habitWater.id,
        date: now,
        value: 4, // in-progress water intake for today
      },
    ],
  });

  const habitRead = await prisma.habit.create({
    data: {
      name: "Read 15 pages of a book",
      icon: "book-open",
      color: "#8B5CF6",
      status: HabitStatus.ACTIVE,
      frequency: HabitFrequency.DAILY,
      goal: 15,
      unit: "pages",
      reminderTime: "21:00",
      userId: userJane.id,
    },
  });

  await prisma.habitRecord.createMany({
    data: [
      {
        habitId: habitRead.id,
        date: d2,
        value: 20,
      },
      {
        habitId: habitRead.id,
        date: d1,
        value: 15,
      },
    ],
  });

  await prisma.habit.create({
    data: {
      name: "Meditate 10 minutes",
      icon: "sparkles",
      color: "#10B981",
      status: HabitStatus.PAUSED, // Paused habit demo
      frequency: HabitFrequency.DAILY,
      goal: 10,
      unit: "minutes",
      reminderTime: "07:30",
      userId: userJane.id,
    },
  });

  console.log("🌟 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
