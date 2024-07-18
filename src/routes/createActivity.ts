import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { dayjs } from "../lib/dayjs";

export async function createActivity(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/trips/:tripId/activities",
    {
      schema: {
        params: z.object({
          tripId: z.string().uuid(),
        }),
        body: z.object({
          title: z.string().min(4),
          occurs_at: z.coerce.date(),
        }),
      },
    },
    async (request, reply) => {
      const { tripId } = request.params;
      const { title, occurs_at } = request.body;

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
      });

      if (!trip) {
        return reply.status(400).send({ message: "Viagem não encontrada. "});
      }
      
      if (dayjs(occurs_at).isBefore(trip.starts_at)) {
        return reply.status(400).send({ message: "Horário de início da atividade inválido."});
      }

      if (dayjs(occurs_at).isAfter(trip.ends_at)) {
        return reply.status(400).send({ message: "Horário de início da atividade inválido."});
      }

      const activity = await prisma.activity.create({
        data: {
          title,
          occurs_at,
          tripId: tripId,
        },
      });

      return reply.status(201).send({ activityId: activity.id });
    }
  );
}
