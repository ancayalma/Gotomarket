
// ==========================================
// PROJECT WORKFLOW DIAGRAMS
// ==========================================

// Shared styles for prominent nodes
const NODE_STYLES = `
    classDef default fill:#1e293b,stroke:#94a3b8,stroke-width:1px,color:#e2e8f0,rx:5,ry:5;
    
    classDef startNode fill:#020617,stroke:#22c55e,stroke-width:2px,color:#4ade80;
    classDef step1_3 fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#bfdbfe;
    classDef step4_6 fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#bbf7d0;
    classDef step7_8 fill:#312e81,stroke:#6366f1,stroke-width:2px,color:#c7d2fe;
    classDef step9_10 fill:#4c1d95,stroke:#8b5cf6,stroke-width:2px,color:#e9d5ff;
    classDef conversionNode fill:#831843,stroke:#ec4899,stroke-width:2px,color:#fbcfe8,rx:20,ry:20;
`;

// Desktop: Horizontal Flow
export const PROJECT_WORKFLOW_DESKTOP = `
%%{
  init: {
    'theme': 'dark',
    'themeVariables': {
      'fontSize': '14px',
      'fontFamily': 'ui-sans-serif, system-ui, sans-serif',
      'edgeLabelBackground': '#0f172a',
      'lineColor': '#64748b'
    },
    'flowchart': {
      'curve': 'basis',
      'nodeSpacing': 40,
      'rankSpacing': 60
    }
  }
}%%
graph LR
    Start((Start)):::startNode --> C[1. Campaign Setup]:::step1_3
    C --> W[2. LeadGen Wizard]:::step1_3
    W --> L[3. Lists & Assignment]:::step1_3
    
    L --> O[4. Execute Outreach]:::step4_6
    O --> D[5. Contact Discovery]:::step4_6
    D --> P{6. Promote?}:::conversionNode
    
    P -->|Yes| Q[7. Opportunity]:::step7_8
    Q --> F[8. Quote & Contract]:::step7_8
    F --> CW[9. Invoice Sent]:::step9_10
    CW --> PROJ[10. Project Creation]:::step9_10
    
    PROJ -.-> E[Account Enrichment]:::step9_10
    E -.-> C

    ${NODE_STYLES}
`;

// Mobile: Vertical Flow
export const PROJECT_WORKFLOW_MOBILE = `
%%{
  init: {
    'theme': 'dark',
    'themeVariables': {
      'fontSize': '12px',
      'edgeLabelBackground': '#0f172a',
      'lineColor': '#64748b'
    }
  }
}%%
graph TB
    C[1. Campaign]:::step1_3 --> W[2. LeadGen Wizard]:::step1_3
    W --> L[3. Lists & Assignment]:::step1_3
    L --> O[4. Execute Outreach]:::step4_6
    O --> D[5. Contact Discovery]:::step4_6
    D --> P{6. Promote?}:::conversionNode
    P -->|Yes| Q[7. Opportunity]:::step7_8
    Q --> F[8. Quote & Contract]:::step7_8
    F --> CW[9. Invoice Sent]:::step9_10
    CW --> PROJ[10. Project Creation]:::step9_10
    
    ${NODE_STYLES}
`;

export const PROJECT_WORKFLOW_LEGEND = [
  { label: "Phase 1: Discovery (1-3)", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { label: "Phase 2: Engage (4-6)", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { label: "Phase 3: Qualify (7-8)", color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" },
  { label: "Phase 4: Deliver (9-10)", color: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
  { label: "Decision Point", color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
];


// ==========================================
// CAMPAIGN PIPELINE FLOW DIAGRAMS
// Shows how Brand Identity flows through
// Campaign > LeadGen > Pool > Outreach > Leads
// ==========================================

// Desktop: Campaign Pipeline with Brand Identity flow
export const CAMPAIGN_PIPELINE_DESKTOP = `
%%{
  init: {
    'theme': 'dark',
    'themeVariables': {
      'fontSize': '13px',
      'fontFamily': 'ui-sans-serif, system-ui, sans-serif',
      'edgeLabelBackground': '#0f172a',
      'lineColor': '#64748b',
      'clusterBkg': 'rgba(15, 23, 42, 0.4)',
      'clusterBorder': '#334155'
    },
    'flowchart': {
      'curve': 'basis',
      'nodeSpacing': 50,
      'rankSpacing': 70,
      'useMaxWidth': true
    }
  }
}%%
graph TB
    subgraph SETUP [" Brand Identity - One-Time Setup "]
        direction LR
        BI["Company, Mission, Voice"]:::brandNode
        ICP_DEF["Target ICP and Products"]:::brandNode
        MEET["Meeting Link and CTAs"]:::brandNode
    end

    subgraph CAMPAIGN [" Campaign Creation "]
        direction LR
        CC["Create Campaign"]:::campaignNode
        CC --- BRIEF["Campaign Brief"]:::campaignNode
        CC --- PROD["Product Focus"]:::campaignNode
    end

    subgraph SCRAPE [" Account Scraping "]
        direction LR
        WIZARD["LeadGen Wizard"]:::wizardNode
        WIZARD --> POOL["List / Pool Created"]:::poolNode
        POOL -.->|"pool linked back"| CC
    end

    subgraph OUT [" Outreach Execution "]
        direction LR
        FC["First Contact Wizard"]:::outreachNode
        FC --> EMAIL_GEN["AI Email Generated"]:::outreachNode
        FC --> SMS_CH["SMS Channel"]:::smsNode
    end

    subgraph RES [" Results "]
        direction LR
        CNTCTS["Contacts Identified"]:::contactNode
        CNTCTS --> LDS["Leads Converted"]:::leadNode
        LDS --> OPPS["Opportunities Created"]:::oppNode
    end

    BI -->|"auto-populates"| CC
    ICP_DEF -->|"pre-fills ICP"| WIZARD
    MEET -->|"pre-fills CTA"| FC
    CC -->|"campaign context"| WIZARD
    POOL -->|"lists ready"| FC
    CC -->|"brief + brand"| FC
    EMAIL_GEN --> CNTCTS

    classDef brandNode fill:#7c3aed,stroke:#a78bfa,stroke-width:2px,color:#ede9fe
    classDef campaignNode fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#bfdbfe
    classDef wizardNode fill:#312e81,stroke:#818cf8,stroke-width:2px,color:#c7d2fe
    classDef poolNode fill:#0c4a6e,stroke:#38bdf8,stroke-width:2px,color:#e0f2fe
    classDef outreachNode fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#d1fae5
    classDef smsNode fill:#065f46,stroke:#34d399,stroke-width:1px,color:#a7f3d0
    classDef contactNode fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#fef3c7
    classDef leadNode fill:#831843,stroke:#ec4899,stroke-width:2px,color:#fce7f3
    classDef oppNode fill:#164e63,stroke:#22d3ee,stroke-width:2px,color:#cffafe
`;

// Mobile: Vertical Campaign Pipeline
export const CAMPAIGN_PIPELINE_MOBILE = `
%%{
  init: {
    'theme': 'dark',
    'themeVariables': {
      'fontSize': '11px',
      'fontFamily': 'ui-sans-serif, system-ui, sans-serif',
      'edgeLabelBackground': '#0f172a',
      'lineColor': '#64748b'
    },
    'flowchart': {
      'curve': 'basis',
      'useMaxWidth': true
    }
  }
}%%
graph TB
    BRAND["Brand Identity Setup"]:::brandNode
    BRAND -->|"auto-populates"| CAMP["Campaign Created"]:::campaignNode
    CAMP -->|"context flows"| WIZ["LeadGen Wizard"]:::wizardNode
    BRAND -->|"pre-fills ICP"| WIZ
    WIZ --> POOL_C["Pool / List Created"]:::poolNode
    POOL_C -.->|"linked back"| CAMP
    BRAND -->|"pre-fills prompt"| FCW["First Contact Wizard"]:::outreachNode
    CAMP -->|"brief"| FCW
    POOL_C -->|"leads ready"| FCW
    FCW --> EMAILX["AI Email Sent"]:::outreachNode
    EMAILX --> CNTCTS_M["Contacts Found"]:::contactNode
    CNTCTS_M --> LDS_M["Leads Converted"]:::leadNode
    LDS_M --> OPPS_M["Opportunities"]:::oppNode

    classDef brandNode fill:#7c3aed,stroke:#a78bfa,stroke-width:2px,color:#ede9fe
    classDef campaignNode fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#bfdbfe
    classDef wizardNode fill:#312e81,stroke:#818cf8,stroke-width:2px,color:#c7d2fe
    classDef poolNode fill:#0c4a6e,stroke:#38bdf8,stroke-width:2px,color:#e0f2fe
    classDef outreachNode fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#d1fae5
    classDef contactNode fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#fef3c7
    classDef leadNode fill:#831843,stroke:#ec4899,stroke-width:2px,color:#fce7f3
    classDef oppNode fill:#164e63,stroke:#22d3ee,stroke-width:2px,color:#cffafe
`;

export const CAMPAIGN_PIPELINE_LEGEND = [
  { label: "Brand Identity", color: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
  { label: "Campaign", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { label: "LeadGen Wizard", color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" },
  { label: "Lists / Pools", color: "bg-sky-500/20 text-sky-400 border-sky-500/30" },
  { label: "Outreach", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { label: "Contacts", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { label: "Leads", color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
  { label: "Opportunities", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
];
