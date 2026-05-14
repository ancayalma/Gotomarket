import { CloudWatchLogsClient, FilterLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs";

async function run() {
  const client = new CloudWatchLogsClient({ region: "us-west-2" });
  const command = new FilterLogEventsCommand({
    logGroupName: "/aws/lambda/chime-sma-bridge",
    limit: 50,
  });

  try {
    const response = await client.send(command);
    console.log(JSON.stringify(response.events?.map(e => e.message), null, 2));
  } catch (error) {
    console.error("Error fetching logs:", error);
  }
}

run();
