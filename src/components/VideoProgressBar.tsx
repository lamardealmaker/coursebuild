import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface Question {
  timestamp: number;
  id?: string;
}

interface VideoProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  questions?: Question[];
  answeredQuestions?: Set<string>;
  formatTimestamp: (seconds: number) => string;
  className?: string;
}

function VideoProgressBar({
  currentTime,
  duration,
  onSeek,
  questions = [],
  answeredQuestions = new Set(),
  formatTimestamp,
  className
}: VideoProgressBarProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number>(0);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    
    // If duration is not available yet, prevent seeking but don't completely disable
    if (duration <= 0) {
      console.warn('⚠️ Cannot seek - video duration not available yet');
      return;
    }
    
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    const newTime = (percentage / 100) * duration;
    
    onSeek(Math.max(0, Math.min(newTime, duration)));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // Show hover time even if duration is 0, but don't allow seeking
    if (duration > 0) {
      const percentage = (x / rect.width) * 100;
      const time = (percentage / 100) * duration;
      
      setHoverTime(Math.max(0, Math.min(time, duration)));
      setHoverX(x);

      if (isDragging) {
        onSeek(Math.max(0, Math.min(time, duration)));
      }
    } else {
      // Still show hover effects but with placeholder time
      setHoverTime(0);
      setHoverX(x);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleProgressClick(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoverTime(null);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    
    // Prevent touch seeking if duration is not available
    if (duration <= 0) {
      console.warn('⚠️ Cannot seek - video duration not available yet');
      return;
    }
    
    const touch = e.touches[0];
    const rect = progressRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    const newTime = (percentage / 100) * duration;
    
    onSeek(Math.max(0, Math.min(newTime, duration)));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    
    // Prevent touch seeking if duration is not available
    if (duration <= 0) {
      console.warn('⚠️ Cannot seek - video duration not available yet');
      return;
    }
    
    const touch = e.touches[0];
    const rect = progressRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    const newTime = (percentage / 100) * duration;
    
    onSeek(Math.max(0, Math.min(newTime, duration)));
  };

  // Get questions that would be triggered if seeking to a specific time
  const getQuestionsInRange = (targetTime: number) => {
    return questions.filter(q => q.timestamp <= targetTime && q.timestamp > currentTime);
  };

  return (
    <div id="video-progress-bar" className={cn("space-y-3", className)}>
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{formatTimestamp(currentTime)}</span>
        <span>{formatTimestamp(duration)}</span>
      </div>
      
      {/* Clickable Progress Bar */}
      <div 
        ref={progressRef}
        className="relative h-8 cursor-pointer group"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleProgressClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {/* Hit area for easier clicking/tapping */}
        <div className="absolute inset-x-0 -inset-y-2" />
        
        {/* Progress track */}
        <div className={cn(
          "absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 bg-muted rounded-full overflow-hidden",
          duration <= 0 && "animate-pulse" // Pulse when loading
        )}>
          {/* Progress fill */}
          <div 
            className={cn(
              "h-full transition-all duration-100",
              duration > 0 ? "bg-primary" : "bg-muted-foreground/30" // Different color when loading
            )}
            style={{ width: `${progressPercentage}%` }}
          />
          
          {/* Hover indicator */}
          {hoverTime !== null && (
            <div 
              className="absolute top-1/2 w-1 h-4 -translate-y-1/2 bg-foreground/50"
              style={{ left: `${(hoverTime / duration) * 100}%` }}
            />
          )}
        </div>
        
        {/* Current position indicator */}
        <div 
          className={cn(
            "absolute top-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background shadow-md transition-transform group-hover:scale-125",
            duration > 0 ? "bg-primary" : "bg-muted-foreground/50" // Different color when loading
          )}
          style={{ left: `${progressPercentage}%` }}
        />
        
        {/* Question markers */}
        {duration > 0 && questions.map((question, index) => {
          const position = Math.min(Math.max((question.timestamp / duration) * 100, 0.5), 99.5);
          const questionId = question.id || `question-${index}`;
          const isAnswered = answeredQuestions.has(questionId);
          const isPassed = question.timestamp < currentTime;
          const isSkipped = isPassed && !isAnswered;
          
          return (
            <div
              key={questionId}
              className={cn(
                "absolute top-1/2 w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 border-2 border-background shadow-sm transition-all",
                isAnswered ? 'bg-green-500' : isSkipped ? 'bg-orange-500' : 'bg-primary',
                "hover:scale-125"
              )}
              style={{ left: `${position}%` }}
              title={`${isAnswered ? 'Answered' : isSkipped ? 'Skipped' : 'Question'} at ${formatTimestamp(question.timestamp)}`}
            />
          );
        })}
        
        {/* Hover tooltip */}
        {hoverTime !== null && (
          <div 
            className="absolute -top-10 -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap shadow-md"
            style={{ left: `${hoverX}px` }}
          >
            {duration > 0 ? formatTimestamp(hoverTime) : "Video loading..."}
            {duration > 0 && getQuestionsInRange(hoverTime).length > 0 && (
              <div className="text-orange-500">
                {getQuestionsInRange(hoverTime).length} question{getQuestionsInRange(hoverTime).length > 1 ? 's' : ''} ahead
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default React.memo(VideoProgressBar, (prevProps, nextProps) => {
  // Custom comparison function - only re-render if these props actually change
  return (
    prevProps.currentTime === nextProps.currentTime &&
    prevProps.duration === nextProps.duration &&
    prevProps.questions === nextProps.questions &&
    prevProps.answeredQuestions === nextProps.answeredQuestions &&
    prevProps.className === nextProps.className
  );
});