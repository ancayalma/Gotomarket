
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
