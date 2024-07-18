import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { dayjs } from "../lib/dayjs";
import { getEmailClient } from "../lib/email";
import nodemailer from "nodemailer";

export async function confirmTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/trips/:tripId/confirm",
    {
      schema: {
        params: z.object({
          tripId: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const { tripId } = request.params;

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
        include: {
          participants: {
            where: {
              is_owner: false
            }
          }
        }
      })

      if (!trip) {
        return reply.status(400).send({ message: "Viagem não encontrada." })
      }

      if (trip.is_confirmed) {
        return reply.status(400).send({ message: "Viagem ja confirmada." })
      }

      await prisma.trip.update({
        where: {
          id: tripId,
        },
        data: {
          is_confirmed: true
        }
      })

      const formatStartDate = dayjs(trip.starts_at).format('LL')
      const formatEndDate = dayjs(trip.ends_at).format('LL')

      const confirmationLink = `https://localhost:3333/participants/${trip.id}/confirm/ID_DO_PARTICIPANTE`;

      const email = await getEmailClient();

      await Promise.all(
        trip.participants.map(async (participant) => {

          const confirmationLink = `https://localhost:3333/participants/${participant.id}/confirm`;
          const message = await email.sendMail({
            from: {
              name: "Equipe de Viagem",
              address: "h6kS8@example.com",
            },
            to: participant.email,           
            subject: `Confirme sua presença na viagem para ${trip.destination} em ${formatStartDate}.`,
            html: `
              <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
              <p>Você foi convidado(a) para participar de uma viagem <strong>${trip.destination}</strong> nas datas <strong>de ${formatStartDate}</strong> até <strong>${formatEndDate}</strong></p>
              <p></p>
              <p>Para confirmar sua presença na viagem, clique no link abaixo:</p>
              <p></p>
              <p>
                <a href="${confirmationLink}">Confirmar viagem</a>
              </p>
              <p></p>
              <p>Caso não tenha solicitado esta viagem, ignore este e-mail.</p>
              </div>
              `.trim(),
          });
    
          console.log(nodemailer.getTestMessageUrl(message));
        })
      )

      return reply.status(201).send({tripId: request.params.tripId});
    }
  );
}