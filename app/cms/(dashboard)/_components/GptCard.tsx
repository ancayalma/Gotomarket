
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const GptCard = async () => {
  return (
    <Card className="min-w-[350px]  max-w-[450px]">
      <CardHeader className="text-lg">
        <CardTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">AI Assistant Config</CardTitle>
        <div className="text-xs text-muted-foreground">
          Feature is being upgraded.
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* <SetGptModel models={gptModels} /> */}
      </CardContent>
    </Card>
  );
};

export default GptCard;
