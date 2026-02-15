import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const eventType = body.type as string;

    switch (eventType) {
      case "user.created":
      case "user.updated": {
        const userData = body.data;
        await ctx.runMutation(internal.users.upsertFromClerk, {
          clerkId: userData.id,
          email: userData.email_addresses?.[0]?.email_address ?? "",
          firstName: userData.first_name ?? "",
          lastName: userData.last_name ?? "",
          imageUrl: userData.image_url,
        });
        break;
      }
      case "user.deleted": {
        const userData = body.data;
        await ctx.runMutation(internal.users.deleteFromClerk, {
          clerkId: userData.id,
        });
        break;
      }
    }
    return new Response(null, { status: 200 });
  }),
});

export default http;
