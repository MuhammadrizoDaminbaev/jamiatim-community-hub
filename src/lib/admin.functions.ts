import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ADMIN_USER = "root";
const ADMIN_PASS = "root";

export const adminDeleteProblem = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; password: string; problemId: string }) => d)
  .handler(async ({ data }) => {
    if (data.username !== ADMIN_USER || data.password !== ADMIN_PASS) {
      throw new Error("Unauthorized");
    }
    const { error } = await supabaseAdmin
      .from("problems")
      .delete()
      .eq("id", data.problemId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
