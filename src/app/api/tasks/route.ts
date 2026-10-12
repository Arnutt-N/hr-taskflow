import { prismaTaskStore, prismaTokenStore } from "@/lib/tasks/prisma-store";
import { createTask, listTasks } from "@/lib/tasks/handlers";

const deps = { tasks: prismaTaskStore, tokens: prismaTokenStore };

export function GET(request: Request): Promise<Response> {
  return listTasks(request, deps);
}

export function POST(request: Request): Promise<Response> {
  return createTask(request, deps);
}
