import prisma from "@/lib/prisma";

export default async function Home() {
  const users = await prisma.user.findMany();
  return (
    <div>
      <h1>Users</h1>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}