import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { dayjs } from "../lib/dayjs";

export async function getActivities(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/trips/:tripId/activities",
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
          activities: {
            orderBy: {
              occurs_at: "asc",
            },
          }  
        },
      });

      if (!trip) {
        return reply.status(400).send({ message: "Atividade não encontrada."});
      }


      const differenceInDayBetweenTripStartAndEnd = dayjs(trip.ends_at).diff(
        dayjs(trip.starts_at),
        "day"
      );

      const activities = Array.from({length: differenceInDayBetweenTripStartAndEnd + 1}).map( (_, index) => {
        const date = dayjs(trip.starts_at).add(index, "day").toDate();

        return {
            date: date,
            activities: trip.activities.filter(activity => {
                return dayjs(activity.occurs_at).isSame(date, "day");
            })
        }
      })

      return reply.status(200).send({ activities });
    }
  );
}