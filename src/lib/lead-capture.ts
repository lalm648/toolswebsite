type ProviderKind = "generic" | "beehiiv" | "convertkit" | "mailchimp";
type LeadType = "newsletter" | "waitlist";

type LeadConfig = {
  type: LeadType;
  provider: ProviderKind | "";
  providerLabel: string;
  action: string;
  method: "get" | "post";
  emailFieldName: string;
  sourceFieldName: string;
  target: "_blank" | "_self";
  hiddenFields: Array<{ name: string; value: string }>;
  hasProvider: boolean;
};

type ScopedLeadEnv = {
  provider: ProviderKind | "";
  action: string;
  method: "get" | "post";
  emailFieldName: string;
  sourceFieldName: string;
  target: "_blank" | "_self";
  hiddenFields: Array<{ name: string; value: string }>;
};

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "contact@example.com";

function normalizeProvider(value: string | undefined): ProviderKind | "" {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "beehiiv" || normalized === "convertkit" || normalized === "mailchimp" || normalized === "generic") {
    return normalized;
  }

  return "";
}

function getDefaultEmailFieldName(provider: ProviderKind | "") {
  switch (provider) {
    case "convertkit":
      return "email_address";
    case "mailchimp":
      return "EMAIL";
    default:
      return "email";
  }
}

function getDefaultProviderLabel(provider: ProviderKind | "") {
  switch (provider) {
    case "beehiiv":
      return "Beehiiv";
    case "convertkit":
      return "ConvertKit";
    case "mailchimp":
      return "Mailchimp";
    case "generic":
      return "External provider";
    default:
      return "Email fallback";
  }
}

function parseHiddenFields(value: string | undefined) {
  if (!value?.trim()) {
    return [] as Array<{ name: string; value: string }>;
  }

  try {
    const parsed = JSON.parse(value) as Record<string, string>;

    return Object.entries(parsed)
      .filter(([name, fieldValue]) => Boolean(name) && typeof fieldValue === "string")
      .map(([name, fieldValue]) => ({ name, value: fieldValue }));
  } catch {
    return [];
  }
}

function getScopedEnv(values: {
  provider?: string;
  action?: string;
  method?: string;
  emailFieldName?: string;
  sourceFieldName?: string;
  target?: string;
  hiddenFields?: string;
}): ScopedLeadEnv {
  const provider = normalizeProvider(values.provider);
  const action = values.action?.trim() || "";
  const methodValue = values.method?.trim().toLowerCase();
  const method = methodValue === "get" ? "get" : "post";
  const emailFieldName = values.emailFieldName?.trim() || getDefaultEmailFieldName(provider);
  const sourceFieldName = values.sourceFieldName?.trim() || "source";
  const targetValue = values.target?.trim().toLowerCase();
  const target = targetValue === "_self" ? "_self" : "_blank";
  const hiddenFields = parseHiddenFields(values.hiddenFields);

  return {
    provider,
    action,
    method,
    emailFieldName,
    sourceFieldName,
    target,
    hiddenFields,
  };
}

export function getLeadConfig(type: LeadType): LeadConfig {
  const env = getScopedEnv(
    type === "newsletter"
      ? {
          provider: process.env.NEXT_PUBLIC_NEWSLETTER_PROVIDER,
          action: process.env.NEXT_PUBLIC_NEWSLETTER_URL,
          method: process.env.NEXT_PUBLIC_NEWSLETTER_METHOD,
          emailFieldName: process.env.NEXT_PUBLIC_NEWSLETTER_EMAIL_FIELD,
          sourceFieldName: process.env.NEXT_PUBLIC_NEWSLETTER_SOURCE_FIELD,
          target: process.env.NEXT_PUBLIC_NEWSLETTER_TARGET,
          hiddenFields: process.env.NEXT_PUBLIC_NEWSLETTER_HIDDEN_FIELDS,
        }
      : {
          provider: process.env.NEXT_PUBLIC_WAITLIST_PROVIDER,
          action: process.env.NEXT_PUBLIC_WAITLIST_URL,
          method: process.env.NEXT_PUBLIC_WAITLIST_METHOD,
          emailFieldName: process.env.NEXT_PUBLIC_WAITLIST_EMAIL_FIELD,
          sourceFieldName: process.env.NEXT_PUBLIC_WAITLIST_SOURCE_FIELD,
          target: process.env.NEXT_PUBLIC_WAITLIST_TARGET,
          hiddenFields: process.env.NEXT_PUBLIC_WAITLIST_HIDDEN_FIELDS,
        }
  );

  return {
    type,
    provider: env.provider,
    providerLabel: getDefaultProviderLabel(env.provider),
    action: env.action,
    method: env.method,
    emailFieldName: env.emailFieldName,
    sourceFieldName: env.sourceFieldName,
    target: env.target,
    hiddenFields: env.hiddenFields,
    hasProvider: Boolean(env.action),
  };
}

export function getLeadFallbackHref(type: LeadType, email: string, source: string) {
  const subject = type === "newsletter" ? "Newsletter signup request" : "Waitlist request";
  const bodyLabel = type === "newsletter" ? "newsletter list" : "waitlist";

  return `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    `Please add this email to the ToolsWebsite ${bodyLabel}:\n\n${email || "[email address]"}\n\nSource: ${source}`
  )}`;
}
