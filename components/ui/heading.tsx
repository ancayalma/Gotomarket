import { Lock } from "lucide-react";

interface HeadingProps {
  title: string;
  description: string;
  visibility?: string;
}

const Heading = ({ title, description, visibility }: HeadingProps) => {
  return (
    <div className="space-y-1">
      <h2 className="flex items-center gap-3 text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent italic tracking-tight uppercase leading-tight py-2 px-1">
        {title}
        {visibility === "private" ? <Lock className="text-primary/60 w-6 h-6" /> : ""}
      </h2>
      <p className="text-muted-foreground/80 text-sm md:text-base font-medium tracking-wide">
        {description}
      </p>
    </div>
  );
};

export default Heading;
