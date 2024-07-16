import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";

export async function confirmParticipants(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/participants/:participantId/confirm",
    {
      schema: {
        params: z.object({
          participantId: z.string().uuid()
        }),
      },
    },
    async (request) => {
      const { participantId } = request.params;

      const participants = await prisma.participants.findUnique({
        where: {
          id: participantId,
        }
     })

     if (!participants){
       throw new Error("Participante não encontrado.")
     }

     if (participants.is_confirmed){
       throw new Error("Participante já confirmado.")
     }

     await prisma.participants.update({
       where: {
         id: participantId,
       },
       data: {
         is_confirmed: true,
       },
     })

      return {participantId: request.params.participantId}
    })
      
}
  

