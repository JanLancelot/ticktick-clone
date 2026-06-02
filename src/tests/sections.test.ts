import prisma from "../lib/prisma";
import assert from "node:assert";

async function runTests() {
  console.log("=========================================");
  console.log("🧪 RUNNING SECTIONS INTEGRATION TESTS 🧪");
  console.log("=========================================");

  try {
    // 1. Setup - Find or create a test project
    console.log("1. Setting up test project...");
    let testProject = await prisma.project.findFirst({
      where: { name: "Test Sections Project" },
    });

    if (!testProject) {
      let testUser = await prisma.user.findFirst();
      if (!testUser) {
        testUser = await prisma.user.create({
          data: {
            email: "test.sections@example.com",
            name: "Test Sections User",
          },
        });
      }
      testProject = await prisma.project.create({
        data: {
          name: "Test Sections Project",
          color: "#3b82f6",
          userId: testUser.id,
        },
      });
    }
    const projectId = testProject.id;
    console.log(`✅ Test project setup successful: ${testProject.name} (${projectId})`);

    // 2. Test Section Creation
    console.log("\n2. Testing section creation...");
    const sectionName = `Test Section ${Date.now()}`;
    const newSection = await prisma.section.create({
      data: {
        name: sectionName,
        projectId,
        sortOrder: 0.0,
      },
    });
    
    assert.strictEqual(newSection.name, sectionName);
    assert.strictEqual(newSection.projectId, projectId);
    console.log(`✅ Section created successfully: "${newSection.name}"`);

    // 3. Test Task Addition to Section
    console.log("\n3. Testing task linking to section...");
    const taskTitle = `Test Task in Section ${Date.now()}`;
    const newTask = await prisma.task.create({
      data: {
        title: taskTitle,
        projectId,
        sectionId: newSection.id,
        status: "NORMAL",
        priority: "NONE",
      },
    });

    assert.strictEqual(newTask.title, taskTitle);
    assert.strictEqual(newTask.sectionId, newSection.id);
    console.log(`✅ Task created and linked to section successfully`);

    // 4. Test Section Renaming
    console.log("\n4. Testing section renaming...");
    const updatedName = `${sectionName} (Renamed)`;
    const updatedSection = await prisma.section.update({
      where: { id: newSection.id },
      data: { name: updatedName },
    });

    assert.strictEqual(updatedSection.name, updatedName);
    console.log(`✅ Section renamed successfully to: "${updatedSection.name}"`);

    // 5. Test Section Deletion & Task Safety (onDelete: SetNull)
    console.log("\n5. Testing section deletion and task safety...");
    await prisma.section.delete({
      where: { id: newSection.id },
    });

    // Check if the section is deleted
    const deletedSectionCheck = await prisma.section.findUnique({
      where: { id: newSection.id },
    });
    assert.strictEqual(deletedSectionCheck, null);
    console.log("✅ Section deleted successfully from database");

    // Check if the task is still there and its sectionId is set to null
    const taskAfterSectionDeletion = await prisma.task.findUnique({
      where: { id: newTask.id },
    });
    
    assert.notStrictEqual(taskAfterSectionDeletion, null);
    assert.strictEqual(taskAfterSectionDeletion?.sectionId, null);
    console.log("✅ Task preserved! Verified sectionId was set to null (SetNull relation rule working)");

    // Cleanup - Delete the test task and project
    console.log("\n6. Cleaning up test data...");
    await prisma.task.delete({ where: { id: newTask.id } });
    await prisma.project.delete({ where: { id: projectId } });
    console.log("✅ Cleaned up successfully!");

    console.log("\n=========================================");
    console.log("🎉 ALL SECTIONS INTEGRATION TESTS PASSED 🎉");
    console.log("=========================================");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ TESTS FAILED with error:");
    console.error(error);
    process.exit(1);
  }
}

runTests();
