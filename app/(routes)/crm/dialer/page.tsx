import Container from "../../components/ui/Container";
import DialerPanel from './DialerPanel';
import { LearnLink } from "@/components/ui/LearnLink";
import { UpgradeGate } from "@/components/UpgradeGate";

export default function DialerPage() {
  return (
    <Container
      title="Dialer"
      description="Dialer uses Amazon Connect CCP (Streams SDK) for outbound calls. BasaltCRM controls dialing and sequencing."
    >
      <UpgradeGate featureId="voice" title="Voice Dialer Locked" description="AI-powered voice dialing requires a Scale plan or higher.">
        <LearnLink
          tab="dialer"
          overviewTitle="High-Velocity Dialer Terminal"
          overviewWhat="A unified communications interface for managing outbound calling campaigns and real-time lead interaction."
          overviewWhy="Phone outreach is the highest-conversion sales channel. This terminal streamlines the calling process by integrating with Amazon Connect, allowing for automatic call logging, recording, and status updates directly within the CRM."
          overviewHow="Select an active outreach list to populate the queue. Use the 'CCP Panel' to handle the audio stream. Calls made through this terminal are automatically indexed against the relevant Contact and Account records."
        />
        <DialerPanel />
      </UpgradeGate>
    </Container>
  );
}
