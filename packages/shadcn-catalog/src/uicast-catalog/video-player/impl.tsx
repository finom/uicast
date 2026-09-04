import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import { VideoPlayerDef } from "./def";

export const VideoPlayerImpl = createComponentImplementation({
  def: VideoPlayerDef,
  render: ({
    src,
    poster,
    autoplay,
    muted,
    loop,
    width,
    onPlay,
    onPause,
    onEnded,
  }, { entry }) => {
    return (
      <div
        className="rounded-lg overflow-hidden border"
        data-key={entry.key}
      >
        <video
          src={src}
          poster={poster}
          autoPlay={autoplay}
          muted={muted}
          loop={loop}
          controls
          className="w-full"
          style={width ? { width } : undefined}
          onPlay={() => onPlay()}
          onPause={() => onPause()}
          onEnded={() => onEnded()}
        />
      </div>
    );
  },
  placeholder: () => <Skeleton className="w-full" style={{ height: 240 }} />,
});
