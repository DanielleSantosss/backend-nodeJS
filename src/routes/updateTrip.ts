import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { dayjs } from "../lib/dayjs";

export async function updateTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put(
    "/trips/:tripId",
    {
      schema: {
        params: z.object({
          tripId: z.string().uuid(),
        }),
        body: z.object({
          destination: z.string().min(4),
          starts_at: z.coerce.date(),
          ends_at: z.coerce.date(),
        }),
      },
    },
    async (request, reply) => {
      const { tripId } = request.params;
      const { destination, starts_at, ends_at } = request.body;

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
      });

      if(!trip) {
        return reply.status(400).send({ message: "Viagem não encontrada"});
    }

    if (dayjs(starts_at).isBefore(new Date())) {
        return reply.status(400).send({ message: "Horário de início da viagem inválido"});
    }

    if (dayjs(ends_at).isBefore(starts_at)) {
        return reply.status(400).send({ message: "Horário de fim da viagem inválido"});
    }

    await prisma.trip.update({
        where: {
            id: tripId,
        },
        data: {
            destination,
            starts_at,
            ends_at,
        },
    });

    return reply.status(200).send({ tripId: trip.id });
});
}