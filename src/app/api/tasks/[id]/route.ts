import { prismaTaskStore, prismaTokenStore } from "@/lib/tasks/prisma-store";
import { getTask, updateTask } from "@/lib/tasks/handlers";

const deps = { tasks: prismaTaskStore, tokens: prismaTokenStore };

type TaskRouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: TaskRouteContext): Promise<Response> {
  const { id } = await context.params;
  return getTask(request, id, deps);
}

export async function PATCH(request: Request, context: TaskRouteContext): Promise<Response> {
  const { id } = await context.params;
  return updateTask(request, id, deps);
}
