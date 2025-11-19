import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TaskAssignmentRequest {
  taskId: string;
  taskTitle: string;
  taskDescription: string | null;
  dueDate: string | null;
  assignedByUserId: string;
  assignedToUserId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      taskId,
      taskTitle,
      taskDescription,
      dueDate,
      assignedByUserId,
      assignedToUserId,
    }: TaskAssignmentRequest = await req.json();

    console.log("Processing task assignment email:", {
      taskId,
      assignedToUserId,
      assignedByUserId,
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get assignee profile
    const { data: assigneeProfile, error: assigneeError } = await supabase
      .from("profiles")
      .select("email, full_name, nickname")
      .eq("id", assignedToUserId)
      .single();

    if (assigneeError || !assigneeProfile) {
      console.error("Error fetching assignee profile:", assigneeError);
      throw new Error("Could not fetch assignee profile");
    }

    // Get assigner profile
    const { data: assignerProfile, error: assignerError } = await supabase
      .from("profiles")
      .select("full_name, nickname")
      .eq("id", assignedByUserId)
      .single();

    if (assignerError || !assignerProfile) {
      console.error("Error fetching assigner profile:", assignerError);
      throw new Error("Could not fetch assigner profile");
    }

    const assigneeName =
      assigneeProfile.nickname || assigneeProfile.full_name || "Usuário";
    const assignerName =
      assignerProfile.nickname || assignerProfile.full_name || "Alguém";
    const assigneeEmail = assigneeProfile.email;

    if (!assigneeEmail) {
      console.error("Assignee has no email");
      throw new Error("Assignee has no email");
    }

    const formattedDueDate = dueDate
      ? new Date(dueDate).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "Sem prazo definido";

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Nova Task Atribuída</h1>
        <p>Olá <strong>${assigneeName}</strong>,</p>
        <p>Você foi atribuído a uma nova task por <strong>${assignerName}</strong>:</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #555; margin-top: 0;">${taskTitle}</h2>
          ${
            taskDescription
              ? `<p style="color: #666;">${taskDescription}</p>`
              : ""
          }
          <p style="color: #888; margin-bottom: 0;">
            <strong>Prazo:</strong> ${formattedDueDate}
          </p>
        </div>
        
        <p>Acesse o sistema para visualizar mais detalhes da task.</p>
        <p style="color: #888; font-size: 12px; margin-top: 30px;">
          Este é um email automático, por favor não responda.
        </p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "Task Manager <onboarding@resend.dev>",
      to: [assigneeEmail],
      subject: `Nova Task: ${taskTitle}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-task-assignment-email function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
