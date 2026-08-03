export type SqlColumn = {
  name: string;
  type: string;
  primary: boolean;
  foreign: boolean;
  nullable: boolean;
  reference?: string;
};

export type SqlRelationship = {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
};

export type SqlSchema = {
  mermaid: string;
  tables: Array<{ name: string; columns: SqlColumn[] }>;
  relationships: SqlRelationship[];
};

export type SqlTemplate = {
  id: string;
  title: string;
  description: string;
  category: "SaaS" | "Commerce" | "Content" | "Community" | "Productivity" | "Starter";
  dialect: "PostgreSQL" | "MySQL" | "SQLite";
  status: "Featured" | "Popular" | "New";
  accent: string;
  sql: string;
};

export const sqlTemplates: SqlTemplate[] = [
  {
    id: "saas-billing",
    title: "SaaS subscriptions",
    description: "Organizations, members, plans, subscriptions, and invoices.",
    category: "SaaS",
    dialect: "PostgreSQL",
    status: "Featured",
    accent: "#7c3aed",
    sql: `CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(160),
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE memberships (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  role VARCHAR(40) NOT NULL
);

CREATE TABLE plans (
  id UUID PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  price_cents INTEGER NOT NULL,
  billing_interval VARCHAR(20)
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  plan_id UUID REFERENCES plans(id),
  status VARCHAR(30) NOT NULL,
  renews_at TIMESTAMP
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  subscription_id UUID REFERENCES subscriptions(id),
  amount_cents INTEGER NOT NULL,
  paid_at TIMESTAMP
);`,
  },
  {
    id: "ecommerce",
    title: "E-commerce store",
    description: "Catalog, customers, orders, line items, and payments.",
    category: "Commerce",
    dialect: "MySQL",
    status: "Popular",
    accent: "#059669",
    sql: `CREATE TABLE customers (
  id BIGINT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(160)
);

CREATE TABLE products (
  id BIGINT PRIMARY KEY,
  sku VARCHAR(80) NOT NULL,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

CREATE TABLE orders (
  id BIGINT PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id),
  status VARCHAR(30) NOT NULL,
  total DECIMAL(10,2) NOT NULL
);

CREATE TABLE order_items (
  id BIGINT PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id),
  product_id BIGINT REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL
);

CREATE TABLE payments (
  id BIGINT PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id),
  provider VARCHAR(40),
  status VARCHAR(30),
  paid_at TIMESTAMP
);`,
  },
  {
    id: "content-platform",
    title: "Content platform",
    description: "Authors, posts, categories, comments, and publishing states.",
    category: "Content",
    dialect: "PostgreSQL",
    status: "Popular",
    accent: "#2563eb",
    sql: `CREATE TABLE authors (
  id UUID PRIMARY KEY,
  display_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL
);

CREATE TABLE categories (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL
);

CREATE TABLE posts (
  id UUID PRIMARY KEY,
  author_id UUID REFERENCES authors(id),
  category_id UUID REFERENCES categories(id),
  title VARCHAR(220) NOT NULL,
  body TEXT,
  published_at TIMESTAMP
);

CREATE TABLE comments (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id),
  author_name VARCHAR(120),
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL
);`,
  },
  {
    id: "project-management",
    title: "Project management",
    description: "Teams, projects, tasks, assignments, and activity history.",
    category: "Productivity",
    dialect: "PostgreSQL",
    status: "Featured",
    accent: "#ea580c",
    sql: `CREATE TABLE teams (
  id UUID PRIMARY KEY,
  name VARCHAR(120) NOT NULL
);

CREATE TABLE team_members (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id),
  email VARCHAR(255) NOT NULL,
  role VARCHAR(40)
);

CREATE TABLE projects (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id),
  name VARCHAR(160) NOT NULL,
  status VARCHAR(30)
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  assignee_id UUID REFERENCES team_members(id),
  title VARCHAR(220) NOT NULL,
  priority VARCHAR(20),
  due_at TIMESTAMP
);`,
  },
  {
    id: "social-network",
    title: "Social network",
    description: "Profiles, posts, follows, reactions, and conversations.",
    category: "Community",
    dialect: "MySQL",
    status: "New",
    accent: "#db2777",
    sql: `CREATE TABLE profiles (
  id BIGINT PRIMARY KEY,
  username VARCHAR(60) NOT NULL,
  bio TEXT,
  joined_at TIMESTAMP NOT NULL
);

CREATE TABLE posts (
  id BIGINT PRIMARY KEY,
  profile_id BIGINT REFERENCES profiles(id),
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE follows (
  id BIGINT PRIMARY KEY,
  follower_id BIGINT REFERENCES profiles(id),
  following_id BIGINT REFERENCES profiles(id),
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE reactions (
  id BIGINT PRIMARY KEY,
  post_id BIGINT REFERENCES posts(id),
  profile_id BIGINT REFERENCES profiles(id),
  kind VARCHAR(30) NOT NULL
);`,
  },
  {
    id: "authentication",
    title: "Authentication starter",
    description: "Users, sessions, verification tokens, and account providers.",
    category: "Starter",
    dialect: "SQLite",
    status: "New",
    accent: "#0891b2",
    sql: `CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  email_verified_at DATETIME
);

CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  session_token TEXT NOT NULL,
  expires_at DATETIME NOT NULL
);

CREATE TABLE verification_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  token TEXT NOT NULL,
  expires_at DATETIME NOT NULL
);`,
  },
];

function splitSqlColumns(body: string) {
  const columns: string[] = [];
  let current = "";
  let depth = 0;

  for (const character of body) {
    if (character === "(") depth += 1;
    if (character === ")") depth -= 1;
    if (character === "," && depth === 0) {
      columns.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  if (current.trim()) columns.push(current.trim());
  return columns;
}

export function visualizeSql(source: string): SqlSchema {
  const tableExpression =
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`\[]?([\w.-]+)["`\]]?\s*\(([\s\S]*?)\)\s*;/gi;
  const tableSources: Array<{ name: string; body: string }> = [];
  let match: RegExpExecArray | null;

  while ((match = tableExpression.exec(source))) {
    tableSources.push({ name: match[1], body: match[2] });
  }

  if (!tableSources.length) {
    throw new Error("No complete CREATE TABLE statements were found. End each statement with a semicolon.");
  }

  const relationships: SqlRelationship[] = [];
  const tables = tableSources.map((table) => {
    const lines = splitSqlColumns(table.body);
    const columns = lines
      .filter((line) => !/^(PRIMARY|FOREIGN|UNIQUE|CONSTRAINT|CHECK)\b/i.test(line.trim()))
      .map((column): SqlColumn | null => {
        const parts = column.replace(/["`\[\]]/g, "").trim().split(/\s+/);
        if (parts.length < 2) return null;
        const reference = column.match(
          /\bREFERENCES\s+["`\[]?([\w.-]+)["`\]]?\s*\(\s*["`\[]?(\w+)/i,
        );
        const parsed: SqlColumn = {
          name: parts[0],
          type: parts[1],
          primary: /PRIMARY\s+KEY/i.test(column),
          foreign: Boolean(reference),
          nullable: !/\bNOT\s+NULL\b/i.test(column) && !/PRIMARY\s+KEY/i.test(column),
          reference: reference ? `${reference[1]}.${reference[2]}` : undefined,
        };
        if (reference) {
          relationships.push({
            fromTable: table.name,
            fromColumn: parsed.name,
            toTable: reference[1],
            toColumn: reference[2],
          });
        }
        return parsed;
      })
      .filter((column): column is SqlColumn => column !== null);

    for (const line of lines) {
      const relation = line.match(
        /FOREIGN\s+KEY\s*\(\s*["`\[]?(\w+)["`\]]?\s*\)\s+REFERENCES\s+["`\[]?([\w.-]+)["`\]]?\s*\(\s*["`\[]?(\w+)/i,
      );
      if (relation && !relationships.some((item) =>
        item.fromTable === table.name && item.fromColumn === relation[1] &&
        item.toTable === relation[2] && item.toColumn === relation[3])) {
        relationships.push({
          fromTable: table.name,
          fromColumn: relation[1],
          toTable: relation[2],
          toColumn: relation[3],
        });
        const column = columns.find((item) => item.name === relation[1]);
        if (column) {
          column.foreign = true;
          column.reference = `${relation[2]}.${relation[3]}`;
        }
      }
    }
    return { name: table.name, columns };
  });

  const lines = ["erDiagram"];
  for (const table of tables) {
    lines.push(`  ${table.name.replace(/\W/g, "_")} {`);
    for (const column of table.columns) {
      const markers = [column.primary ? "PK" : "", column.foreign ? "FK" : ""]
        .filter(Boolean).join(",");
      lines.push(`    ${column.type.replace(/\W/g, "_")} ${column.name.replace(/\W/g, "_")}${markers ? ` ${markers}` : ""}`);
    }
    lines.push("  }");
  }
  for (const relationship of relationships) {
    lines.push(`  ${relationship.toTable.replace(/\W/g, "_")} ||--o{ ${relationship.fromTable.replace(/\W/g, "_")} : "${relationship.fromColumn}"`);
  }

  return { mermaid: lines.join("\n"), tables, relationships };
}
