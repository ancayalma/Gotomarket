import Feedback from "./Feedback";
import GlobalSearchDialog from "@/components/GlobalSearchDialog";
import AvatarDropdown from "./ui/AvatarDropdown";

import { ThemeToggle } from "@/components/ThemeToggle";
import NotificationCenter from "@/components/NotificationCenter";
import SupportComponent from "@/components/support";

type Props = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  lang: string;
  level?: number;
  xp?: number;
};

const Header = ({ id, name, email, avatar, lang, level = 1, xp = 0 }: Props) => {
  return (
    <div className="shrink-0 rounded-b-xl relative top-0 z-30 flex h-14 justify-between items-center px-4 md:px-5 lg:px-6 py-2 space-x-5 bg-background/60 backdrop-blur-xl border-b border-border/30 shadow-lg mt-6 md:mt-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="hidden md:block">
          <NotificationCenter />
        </div>
        <GlobalSearchDialog />
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden md:block">
          <Feedback />
        </div>
        <div className="hidden md:block">
          <ThemeToggle />
        </div>
        <div className="hidden md:block">
          <SupportComponent />
        </div>
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mr-1 shadow-inner">
           <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[10px] font-black text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]">
             {level}
           </div>
           <div className="flex flex-col items-start leading-none">
             <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest leading-none mb-0.5">Rank</span>
             <span className="text-[10px] font-black text-white leading-none flex items-center gap-0.5">
               <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
               {xp.toLocaleString()} XP
             </span>
           </div>
        </div>
        <AvatarDropdown
          avatar={avatar}
          userId={id}
          name={name}
          email={email}
        />
      </div>
    </div>
  );
};

export default Header;
