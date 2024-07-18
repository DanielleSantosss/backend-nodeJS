import nodemailer from "nodemailer";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { getEmailClient } from "../lib/email";
import { dayjs } from "../lib/dayjs";

export async function createTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/trips",
    {
      schema: {
        body: z.object({
          destination: z.string().min(4),
          starts_at: z.coerce.date(),
          ends_at: z.coerce.date(),
          owner_name: z.string().min(4),
          owner_email: z.string().email(),
          emails_invite: z.array(z.string().email()),
        }),
      },
    },
    async (request, reply) => {
      const {
        destination,
        starts_at,
        ends_at,
        owner_name,
        owner_email,
        emails_invite,
      } = request.body;

      if (dayjs(starts_at).isBefore(new Date())) {
        return reply.status(400).send({ message: "Horário de ínicio da viagem inválido."});
      }

      const trip = await prisma.trip.create({
        data: {
          destination,
          starts_at,
          ends_at,
          participants: {
            createMany: {
              data: [
                {
                  name: owner_name,
                  email: owner_email,
                  is_owner: true,
                  is_confirmed: true,
                },
                ...emails_invite.map((email) => {
                  return {
                    name: "",
                    email,
                    is_owner: false,
                    is_confirmed: false,
                  };
                }),
              ],
            },
          },
        },
      });

      if (dayjs(ends_at).isBefore(starts_at)) {
        return reply.status(400).send({message: "Horário de finalização da viagem inválido."});
      }

      const formatStartDate = dayjs(starts_at).format("LL");
      const formatEndDate = dayjs(ends_at).format("LL");

      const confirmationLink = `https://localhost:3333/trips/${trip.id}/confirm`;

      const email = await getEmailClient();

      const message = await email.sendMail({
        from: {
          name: "Equipe de Viagem",
          address: "h6kS8@example.com",
        },
        to: {
          name: owner_name,
          address: owner_email,
        },
        subject: `Confirme sua viagem para ${destination} em ${formatStartDate}.`,
        html: `
          <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
          <p>Você solicitou a criação de uma viagem para <strong>${destination}</strong> nas datas <strong>de ${formatStartDate}</strong> até <strong>${formatEndDate}</strong></p>
          <p></p>
          <p>Para confirmar sua viagem, clique no link abaixo:</p>
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

      return reply.status(201).send({ tripId: trip.id });
    }
  );
}
