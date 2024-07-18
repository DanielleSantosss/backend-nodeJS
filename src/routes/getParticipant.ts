import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";

export async function getParticipant(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/participants/:participantId",
    {
      schema: {
        params: z.object({
        participantId: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const { participantId } = request.params;

      const participant = await prisma.participants.findUnique({
        select: {
          id: true,
          name: true,
          email: true,
          is_confirmed: true,
        },
        where: { id: participantId },
      });

      if (!participant) {
        return reply.status(400).send({message: "Participante não encontrado."});
      }

      return reply.status(200).send({ participant });
    }
  );
}