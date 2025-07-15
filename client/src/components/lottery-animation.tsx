import { useEffect, useState } from "react";
import { Heart, Star, Sparkles } from "lucide-react";

interface LotteryAnimationProps {
  onComplete: () => void;
  duration?: number;
}

export function LotteryAnimation({ onComplete, duration = 6000 }: LotteryAnimationProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (100 / (duration / 100));
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  return (
    <div className="text-center py-12 space-y-8">
      <div className="relative">
        <div className="animate-lottery text-8xl mb-8">
          <Heart className="w-20 h-20 mx-auto text-[hsl(330,100%,71%)] animate-pulse" />
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex space-x-4">
            <Star className="w-6 h-6 text-yellow-400 animate-bounce" />
            <Sparkles className="w-6 h-6 text-[hsl(225,73%,57%)] animate-bounce delay-100" />
            <Star className="w-6 h-6 text-yellow-400 animate-bounce delay-200" />
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-gray-800">
          Finding Your Perfect Match...
        </h3>
        
        <div className="w-64 mx-auto bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[hsl(225,73%,57%)] to-[hsl(330,100%,71%)] rounded-full transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <p className="text-gray-600">
          Analyzing {Math.floor(progress * 50 / 100)} profiles...
        </p>
        
        <div className="flex justify-center space-x-2 mt-6">
          <div className="w-3 h-3 bg-[hsl(225,73%,57%)] rounded-full animate-bounce" />
          <div className="w-3 h-3 bg-[hsl(330,100%,71%)] rounded-full animate-bounce delay-100" />
          <div className="w-3 h-3 bg-[hsl(225,73%,57%)] rounded-full animate-bounce delay-200" />
        </div>
      </div>
    </div>
  );
}
