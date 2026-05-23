exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.RETELL_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "RETELL_API_KEY not configured" }),
    };
  }

  // Optional personalization: the landing-page demo can pass the visitor's
  // business name + trade so the agent greets them as their own business.
  // These surface in Retell as dynamic variables — the agent prompt/greeting
  // must reference {{business_name}} / {{trade}} for them to take effect.
  let dynamicVars = {};
  try {
    const body = JSON.parse(event.body || "{}");
    if (body.business_name && typeof body.business_name === "string") {
      dynamicVars.business_name = body.business_name.slice(0, 80);
    }
    if (body.trade && typeof body.trade === "string") {
      dynamicVars.trade = body.trade.slice(0, 40);
    }
  } catch {
    // No/invalid body — fall back to the generic demo
  }

  try {
    const callBody = {
      agent_id: "agent_d5de35910a5d71b79710fb5d8b",
    };
    if (Object.keys(dynamicVars).length > 0) {
      callBody.retell_llm_dynamic_variables = dynamicVars;
    }

    const res = await fetch("https://api.retellai.com/v2/create-web-call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(callBody),
    });

    if (!res.ok) {
      const err = await res.text();
      return { statusCode: res.status, body: JSON.stringify({ error: err }) };
    }

    const data = await res.json();
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: data.access_token }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
