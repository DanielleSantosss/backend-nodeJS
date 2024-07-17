import fastify from "fastify";
import cors from "@fastify/cors"
import { createTrip } from "./routes/createTrip";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { confirmTrip } from "./routes/confirmTrip";
import { confirmParticipants } from "./routes/confirmParticipants";
import { createActivity } from "./routes/createActivity";
import { getActivities } from "./routes/getActivities";
import { createLink } from "./routes/createLinks";
import { getLinks } from "./routes/getLinks";
import { getParticipants } from "./routes/getParticipants";
import { updateTrip } from "./routes/updateTrip";
import { getTripDetails } from "./routes/getTripDetails";
import { getParticipant } from "./routes/getParticipant";

const app = fastify();

app.register(cors, {
   origin: '*', 
})

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler)

app.register(createTrip);
app.register(confirmTrip);
app.register(confirmParticipants);
app.register(createActivity);
app.register(getActivities);
app.register(createLink);
app.register(getLinks);
app.register(getParticipants);
app.register(updateTrip);
app.register(getTripDetails);
app.register(getParticipant);

app.listen({ port: 3333 }).then(() => {
    console.log('Server is running on http://localhost:3333')
})