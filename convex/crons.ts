import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.cron(
  "reset-leave-balances",
  "0 0 1 1 *",
  internal.leaveBalances.resetForNewYear
);

export default crons;
