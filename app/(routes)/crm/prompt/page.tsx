'use client';

import React from 'react';
import PromptGeneratorPanel from './PromptGeneratorPanel';
import { LearnLink } from '@/components/ui/LearnLink';
import { UpgradeGate } from '@/components/UpgradeGate';

export default function Page() {
  return (
    <UpgradeGate featureId="openai" title="AI Persona Lab Locked" description="Advanced AI Prompt engineering requires an upgraded Individual Basic plan or higher.">
      <div className="w-full h-full">
        <LearnLink
          tab="prompt"
          overviewTitle="Neural Persona Engineering"
          overviewWhat="The workbench for designing and testing the system instructions that drive the BASALT AI Agents."
          overviewWhy="AI quality depends on precise 'prompt engineering'. This lab allows you to iterate on agent personalities, extraction logic, and outreach tone in a playground environment before deploying them to your live lead lists."
          overviewHow="Select an 'Agent Persona' and write the base instructions. Use the 'Variables' panel to simulate dynamic CRM data injections. Click 'Deploy' to push the new logic to your active prospecting workflows."
        />
        <PromptGeneratorPanel />
      </div>
    </UpgradeGate>
  );
}
