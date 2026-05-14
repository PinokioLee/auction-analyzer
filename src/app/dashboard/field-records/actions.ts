"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function deleteFieldRecord(id: string) {
  const supabase = await createClient();
  await supabase.from("field_records").delete().eq("id", id);
  revalidatePath("/dashboard/field-records");
  redirect("/dashboard/field-records");
}
